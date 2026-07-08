from typing import List, Optional

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    Book,
    BookCopy,
    Loan,
    Member,
    BookListItem,
    BookDetailResponse,
    CopyInfo,
    LoanInfo,
    HolderInfo,
    BulkBookUploadResponse,
    BookUpdate,
)


async def create_book(book: Book, session: AsyncSession, copy_count: int = 1):
    """
    Create a new book title and multiple physical copies.
    """
    if copy_count < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="copy_count must be at least 1",
        )

    isbn = (book.isbn or "").strip()

    if not book.title or not book.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    if not book.author or not book.author.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Author is required",
        )

    if not isbn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ISBN is required",
        )

    existing_book = await session.exec(select(Book).where(Book.isbn == isbn))
    if existing_book.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A book with this ISBN already exists",
        )

    book.isbn = isbn
    book.title = book.title.strip()
    book.author = book.author.strip()

    session.add(book)
    await session.flush()

    # Create multiple copies based on copy_count
    for _ in range(copy_count):
        book_copy = BookCopy(book_id=book.id, is_available=True, condition="good")
        session.add(book_copy)

    await session.commit()
    await session.refresh(book)

    return book


async def create_books_bulk(books: list, session: AsyncSession):
    """
    Create many books in one request with multiple copies per book.
    Accepts list of BookCreateRequest objects with copy_count.
    """
    created_books = []
    failed_books = []

    for index, book_data in enumerate(books, start=1):
        try:
            copy_count = 1
            book = book_data
            
            # Handle if book_data is a dict (from JSON request)
            if isinstance(book_data, dict):
                copy_count = book_data.get("copy_count", 1)
                book = Book(
                    title=book_data.get("title"),
                    author=book_data.get("author"),
                    isbn=book_data.get("isbn"),
                    summary=book_data.get("summary"),
                    tags=book_data.get("tags"),
                )
            # Handle if it's already a Book model
            elif hasattr(book_data, "copy_count"):
                copy_count = book_data.copy_count
                book = Book(
                    title=book_data.title,
                    author=book_data.author,
                    isbn=book_data.isbn,
                    summary=getattr(book_data, "summary", None),
                    tags=getattr(book_data, "tags", None),
                )
            
            created_book = await create_book(book, session, copy_count=copy_count)
            created_books.append(created_book)
        except HTTPException as exc:
            failed_books.append(
                {
                    "row": index,
                    "title": getattr(book_data, "title", "unknown"),
                    "isbn": getattr(book_data, "isbn", "unknown"),
                    "error": exc.detail,
                }
            )
        except Exception as exc:
            failed_books.append(
                {
                    "row": index,
                    "title": getattr(book_data, "title", "unknown"),
                    "isbn": getattr(book_data, "isbn", "unknown"),
                    "error": str(exc),
                }
            )

    return BulkBookUploadResponse(created=created_books, failed=failed_books)


async def get_books(
    session: AsyncSession,
    title: Optional[str] = None,
    author: Optional[str] = None,
    isbn: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[BookListItem]:
    """Return lightweight list items for search/list views."""
    query = select(Book)
    if title:
        query = query.where(Book.title.ilike(f"%{title}%"))
    if author:
        query = query.where(Book.author.ilike(f"%{author}%"))
    if isbn:
        query = query.where(Book.isbn == isbn)
    if tags:
        # match any of the provided tags as substring in stored tags string
        for t in tags:
            query = query.where(Book.tags.ilike(f"%{t}%"))

    query = query.limit(limit).offset(offset)
    result = await session.exec(query)
    books = result.all()

    book_ids = [b.id for b in books if b.id is not None]
    available_book_ids = set()
    if book_ids:
        copies_query = select(BookCopy.book_id).where(
            BookCopy.book_id.in_(book_ids),
            BookCopy.is_available == True
        )
        copies_result = await session.exec(copies_query)
        available_book_ids = set(copies_result.all())

    items: List[BookListItem] = []
    for b in books:
        items.append(
            BookListItem(
                id=b.id,
                title=b.title,
                author=b.author,
                isbn=b.isbn,
                summary=b.summary,
                tags=b.tags,
                available=b.id in available_book_ids,
            )
        )

    return items


async def get_book_detail(book_id: int, session: AsyncSession):
    """Return detailed book info including copies and loan history."""
    book = await session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    copies_res = await session.exec(select(BookCopy).where(BookCopy.book_id == book_id))
    copies = copies_res.all()
    copies_info = [CopyInfo(id=c.id, is_available=c.is_available, condition=c.condition) for c in copies]
    available_count = sum(1 for c in copies if c.is_available)

    # current holders: find all active loans where return_date is None
    active_loans_res = await session.exec(
        select(Loan).where(Loan.book_id == book_id, Loan.return_date.is_(None))
    )
    active_loans = active_loans_res.all()
    current_holders: List[HolderInfo] = []
    for al in active_loans:
        if al.member_id:
            member = await session.get(Member, al.member_id)
            if member:
                current_holders.append(
                    HolderInfo(
                        member_id=member.id,
                        first_name=member.first_name,
                        last_name=member.last_name,
                        phone_number=member.phone_number,
                    )
                )

    # loan history
    history_res = await session.exec(select(Loan).where(Loan.book_id == book_id).order_by(Loan.load_date.desc()))
    history = history_res.all()
    loan_history: List[LoanInfo] = []
    for ln in history:
        member_first = None
        member_last = None
        if ln.member_id:
            member = await session.get(Member, ln.member_id)
            if member:
                member_first = member.first_name
                member_last = member.last_name

        loan_history.append(
            LoanInfo(
                id=ln.id,
                member_id=ln.member_id,
                member_first_name=member_first,
                member_last_name=member_last,
                load_date=ln.load_date,
                return_date=ln.return_date,
            )
        )

    return BookDetailResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        isbn=book.isbn,
        summary=book.summary,
        tags=book.tags,
        available_copies_count=available_count,
        copies=copies_info,
        current_holders=current_holders,
        loan_history=loan_history,
    )


async def get_suggestions(session: AsyncSession, q: Optional[str] = None, limit: int = 10):
    """Return short suggestion list for autocomplete (title/author/isbn)."""
    if not q:
        return []

    query = select(Book).where(
        (Book.title.ilike(f"%{q}%")) | (Book.author.ilike(f"%{q}%")) | (Book.isbn.ilike(f"%{q}%"))
    ).limit(limit)
    res = await session.exec(query)
    books = res.all()
    return [
        BookListItem(id=b.id, title=b.title, author=b.author, isbn=b.isbn, summary=b.summary, tags=b.tags)
        for b in books
    ]

async def update_book(book_id: int, book_update: BookUpdate, session: AsyncSession):
    book = await session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    if book_update.isbn:
        isbn = book_update.isbn.strip()
        if isbn != book.isbn:
            existing = await session.exec(select(Book).where(Book.isbn == isbn))
            if existing.first():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ISBN already exists")
            book.isbn = isbn

    if book_update.title is not None:
        if not book_update.title.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")
        book.title = book_update.title.strip()

    if book_update.author is not None:
        if not book_update.author.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Author is required")
        book.author = book_update.author.strip()

    if book_update.summary is not None:
        book.summary = book_update.summary.strip() if book_update.summary else None

    if book_update.tags is not None:
        book.tags = book_update.tags.strip() if book_update.tags else None

    if book_update.add_copies and book_update.add_copies > 0:
        for _ in range(book_update.add_copies):
            session.add(BookCopy(book_id=book.id, is_available=True, condition="good"))

    await session.commit()
    await session.refresh(book)
    return book

async def delete_book(book_id: int, session: AsyncSession):
    book = await session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    copies = await session.exec(select(BookCopy).where(BookCopy.book_id == book_id))
    for copy in copies.all():
        await session.delete(copy)

    loans = await session.exec(select(Loan).where(Loan.book_id == book_id))
    for loan in loans.all():
        await session.delete(loan)

    await session.delete(book)
    await session.commit()

async def delete_books_bulk(book_ids: List[int], session: AsyncSession):
    deleted = []
    failed = []

    for book_id in book_ids:
        try:
            await delete_book(book_id, session)
            deleted.append(book_id)
        except HTTPException as exc:
            failed.append({"book_id": book_id, "error": exc.detail})
        except Exception as exc:
            failed.append({"book_id": book_id, "error": str(exc)})

    return {"deleted": deleted, "failed": failed}



async def delete_book_copy(book_id: int, copy_id: int, session: AsyncSession):
    copy = await session.get(BookCopy, copy_id)
    if not copy or copy.book_id != book_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Copy not found")

    copy_count = await session.exec(select(BookCopy).where(BookCopy.book_id == book_id))
    copies = copy_count.all()
    if len(copies) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the last copy. Remove the book instead or add another copy first."
        )

    await session.delete(copy)
    await session.commit()