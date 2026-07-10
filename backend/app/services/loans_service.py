from sqlalchemy import desc
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from app.core.config import library_settings
from fastapi import HTTPException, status
from sqlmodel import select, or_
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    Book,
    BookCopy,
    Loan,
    Member,
    LoanCreate,
    LoanDetailResponse,
)

# Indian Standard Time (IST) timezone
IST = timezone(timedelta(hours=5, minutes=30))


async def create_loan(loan_data: LoanCreate, session: AsyncSession) -> LoanDetailResponse:
    """
    Create Loan (Check-out): Link a Member to a BookCopy and set the loan date in IST.
    Ensures member status is active and book copies are available.
    """
    # 1. Fetch Member to check membership_status
    member = await session.get(Member, loan_data.member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {loan_data.member_id} not found",
        )
    
    if member.membership_status.lower() != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot checkout book: Member status is '{member.membership_status}' (must be active)",
        )

    current_loans = await session.exec(select(func.count(Loan.id)).where(Loan.member == loan_data.member_id))
    if current_loans >= library_settings.max_books_per_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Loan limit reached. Cannot checkout more books"
        )

    # 2. Fetch Book to check if it exists
    book = await session.get(Book, loan_data.book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {loan_data.book_id} not found",
        )

    # 3. Find an available BookCopy
    copy_query = select(BookCopy).where(
        BookCopy.book_id == loan_data.book_id,
        BookCopy.is_available == True
    ).limit(1)
    copy_res = await session.exec(copy_query)
    copy = copy_res.first()
    if not copy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No copies of this book are currently available for checkout",
        )

    # 4. Mark BookCopy as unavailable
    copy.is_available = False
    session.add(copy)

    # 5. Update Member counters and activity date
    member.total_loan_count += 1
    member.last_activity_date = datetime.now(IST)
    session.add(member)

    # 6. Create Loan record (setting dates to IST)
    new_loan = Loan(
        book_id=loan_data.book_id,
        member_id=loan_data.member_id,
        load_date=datetime.now(IST),
        return_date=None
    )
    session.add(new_loan)
    
    # Flush to generate IDs
    await session.flush()
    
    # 7. Construct response
    response = LoanDetailResponse(
        id=new_loan.id,
        book_id=new_loan.book_id,
        book_title=book.title,
        member_id=new_loan.member_id,
        member_first_name=member.first_name,
        member_last_name=member.last_name,
        load_date=new_loan.load_date,
        return_date=new_loan.return_date,
    )
    
    await session.commit()
    return response


async def return_book(loan_id: int, session: AsyncSession) -> LoanDetailResponse:
    """
    Complete Loan (Check-in): Update the return_date in IST and mark the BookCopy 
    as available again.
    """
    # 1. Fetch the active loan
    loan = await session.get(Loan, loan_id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan record with ID {loan_id} not found",
        )

    if loan.return_date is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This book has already been returned for this loan",
        )

    # 2. Update return_date in IST
    loan.return_date = datetime.now(IST)
    session.add(loan)

    # 3. Update member's last activity date in IST
    if loan.member_id:
        member = await session.get(Member, loan.member_id)
        if member:
            member.last_activity_date = datetime.now(IST)
            session.add(member)

    # 4. Find one unavailable copy of this book and mark it as available
    copy_query = select(BookCopy).where(
        BookCopy.book_id == loan.book_id,
        BookCopy.is_available == False
    ).limit(1)
    copy_res = await session.exec(copy_query)
    copy = copy_res.first()
    if copy:
        copy.is_available = True
        session.add(copy)

    await session.flush()

    # 5. Fetch book and member details for response
    book_title = "Unknown Book"
    member_first = "Unknown"
    member_last = "Member"

    if loan.book_id:
        book = await session.get(Book, loan.book_id)
        if book:
            book_title = book.title
            
    if loan.member_id:
        member = await session.get(Member, loan.member_id)
        if member:
            member_first = member.first_name
            member_last = member.last_name

    response = LoanDetailResponse(
        id=loan.id,
        book_id=loan.book_id,
        book_title=book_title,
        member_id=loan.member_id,
        member_first_name=member_first,
        member_last_name=member_last,
        load_date=loan.load_date,
        return_date=loan.return_date,
    )

    await session.commit()
    return response


async def get_loan(loan_id: int, session: AsyncSession) -> LoanDetailResponse:
    """
    Retrieve specific details of a single loan record, including names.
    """
    loan = await session.get(Loan, loan_id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan record with ID {loan_id} not found",
        )

    book_title = "Unknown Book"
    member_first = "Unknown"
    member_last = "Member"

    if loan.book_id:
        book = await session.get(Book, loan.book_id)
        if book:
            book_title = book.title
            
    if loan.member_id:
        member = await session.get(Member, loan.member_id)
        if member:
            member_first = member.first_name
            member_last = member.last_name

    return LoanDetailResponse(
        id=loan.id,
        book_id=loan.book_id,
        book_title=book_title,
        member_id=loan.member_id,
        member_first_name=member_first,
        member_last_name=member_last,
        load_date=loan.load_date,
        return_date=loan.return_date,
    )


async def get_loans(
    session: AsyncSession,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[LoanDetailResponse]:
    """
    List Loans: Fetch all loan records (with optional filters/search by book title or member name).
    """
    query = select(Loan, Book, Member).join(Book, Loan.book_id == Book.id, isouter=True).join(Member, Loan.member_id == Member.id, isouter=True)

    if search:
        search_term = search.strip()
        conditions = [
            Book.title.ilike(f"%{search_term}%"),
            Book.author.ilike(f"%{search_term}%"),
            Member.first_name.ilike(f"%{search_term}%"),
            Member.last_name.ilike(f"%{search_term}%")
        ]
        # Handle full name splits
        parts = search_term.split(maxsplit=1)
        if len(parts) == 2:
            conditions.append(
                Member.first_name.ilike(f"%{parts[0]}%") & Member.last_name.ilike(f"%{parts[1]}%")
            )
        query = query.where(or_(*conditions))

    query = query.order_by(Loan.load_date.desc()).limit(limit).offset(offset)
    result = await session.exec(query)
    rows = result.all()

    response_list = []
    for loan, book, member in rows:
        book_title = book.title if book else "Unknown Book"
        member_first = member.first_name if member else "Unknown"
        member_last = member.last_name if member else "Member"

        response_list.append(
            LoanDetailResponse(
                id=loan.id,
                book_id=loan.book_id,
                book_title=book_title,
                member_id=loan.member_id,
                member_first_name=member_first,
                member_last_name=member_last,
                load_date=loan.load_date,
                return_date=loan.return_date,
            )
        )
    return response_list


async def get_active_loans(
    session: AsyncSession,
    limit: int = 50,
    offset: int = 0
) -> List[LoanDetailResponse]:
    """
    Active Loans: A shortcut to view all books currently out on loan.
    """
    query = select(Loan, Book, Member).join(Book, Loan.book_id == Book.id, isouter=True).join(Member, Loan.member_id == Member.id, isouter=True)
    query = query.where(Loan.return_date.is_(None))
    query = query.order_by(Loan.load_date.desc()).limit(limit).offset(offset)

    result = await session.exec(query)
    rows = result.all()

    response_list = []
    for loan, book, member in rows:
        book_title = book.title if book else "Unknown Book"
        member_first = member.first_name if member else "Unknown"
        member_last = member.last_name if member else "Member"

        response_list.append(
            LoanDetailResponse(
                id=loan.id,
                book_id=loan.book_id,
                book_title=book_title,
                member_id=loan.member_id,
                member_first_name=member_first,
                member_last_name=member_last,
                load_date=loan.load_date,
                return_date=loan.return_date,
            )
        )
    return response_list


async def get_past_books_with_tags(member_id: int, session: AsyncSession) -> Dict[str, Any]:
    # 1. Fetch both title and tags
    query = (
        select(Book.title, Book.tags)
        .join(Loan, Loan.book_id == Book.id)
        .where(Loan.member_id == member_id, Loan.return_date.is_not(None))
        .order_by(desc(Loan.return_date))
        .limit(10)
    )
    
    result = await session.exec(query)
    # This returns a list of tuples: [("Title", "tag1,tag2"), ...]
    books_data = result.all()
    
    # 2. Extract titles
    titles = [row[0] for row in books_data]
    
    # 3. Process tags into a unique set
    unique_tags = set()
    for row in books_data:
        raw_tags = row[1]  # The comma-separated string
        if raw_tags:
            tags_list = [tag.strip() for tag in raw_tags.split(',')]   
            unique_tags.update(tags_list)
            
    return {
        "books_title": titles,
        "tags": list(unique_tags)
    }
    