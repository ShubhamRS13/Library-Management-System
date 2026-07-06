from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import or_

from app.models import (
    Member,
    Loan,
    Book,
    MemberCreate,
    MemberUpdate,
    MemberLoanInfo,
    MemberDetailResponse,
)


async def create_member(member_data: MemberCreate, session: AsyncSession) -> Member:
    """
    Register a new library member. Handles input validation and email uniqueness.
    """
    first_name = member_data.first_name.strip() if member_data.first_name else ""
    last_name = member_data.last_name.strip() if member_data.last_name else ""
    email = member_data.email.strip() if member_data.email else ""
    phone_number = member_data.phone_number.strip() if member_data.phone_number else ""
    address = member_data.address.strip() if member_data.address else None

    # Validate empty fields
    if not first_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="First name is required and cannot be empty",
        )
    if not last_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Last name is required and cannot be empty",
        )
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required and cannot be empty",
        )
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required and cannot be empty",
        )

    # Check email uniqueness (case-insensitive)
    existing_email_res = await session.exec(
        select(Member).where(Member.email.ilike(email))
    )
    if existing_email_res.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A member with this email already exists",
        )

    new_member = Member(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        membership_status="active",
        join_date=datetime.utcnow(),
        last_activity_date=datetime.utcnow(),
        total_loan_count=0,
    )

    session.add(new_member)
    await session.commit()
    await session.refresh(new_member)

    return new_member


async def get_members(
    session: AsyncSession,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Member]:
    """
    Retrieve all library members, with optional search by ID or name (first name, last name, or combined).
    """
    query = select(Member)

    if search:
        search_term = search.strip()
        conditions = []

        # 1. Search by ID if search term is numeric
        if search_term.isdigit():
            conditions.append(Member.id == int(search_term))

        # 2. Search by first name or last name
        conditions.append(Member.first_name.ilike(f"%{search_term}%"))
        conditions.append(Member.last_name.ilike(f"%{search_term}%"))

        # 3. Search by combined first and last name (e.g. "John Doe")
        # Split search term to match first_name + last_name
        parts = search_term.split(maxsplit=1)
        if len(parts) == 2:
            conditions.append(
                Member.first_name.ilike(f"%{parts[0]}%")
                & Member.last_name.ilike(f"%{parts[1]}%")
            )

        query = query.where(or_(*conditions))

    query = query.order_by(Member.id).limit(limit).offset(offset)
    result = await session.exec(query)
    return result.all()


async def get_member_detail(member_id: int, session: AsyncSession) -> MemberDetailResponse:
    """
    Retrieve a specific member's profile along with active loans and recent loans.
    """
    member = await session.get(Member, member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found",
        )

    # Fetch active loans (where return_date is None)
    active_loans_res = await session.exec(
        select(Loan).where(Loan.member_id == member_id, Loan.return_date.is_(None))
    )
    active_loans = active_loans_res.all()

    # Fetch recent loans (where return_date is not None), limit to 5
    recent_loans_res = await session.exec(
        select(Loan)
        .where(Loan.member_id == member_id, Loan.return_date.isnot(None))
        .order_by(Loan.load_date.desc())
        .limit(5)
    )
    recent_loans = recent_loans_res.all()

    # Helper function to construct MemberLoanInfo list
    async def build_loans_info(loans_list: List[Loan]) -> List[MemberLoanInfo]:
        info_list = []
        for loan in loans_list:
            book_title = "Unknown Book"
            book_author = "Unknown Author"
            if loan.book_id:
                book = await session.get(Book, loan.book_id)
                if book:
                    book_title = book.title
                    book_author = book.author

            info_list.append(
                MemberLoanInfo(
                    id=loan.id,
                    book_id=loan.book_id,
                    book_title=book_title,
                    book_author=book_author,
                    load_date=loan.load_date,
                    return_date=loan.return_date,
                )
            )
        return info_list

    active_info = await build_loans_info(active_loans)
    recent_info = await build_loans_info(recent_loans)

    return MemberDetailResponse(
        id=member.id,
        first_name=member.first_name,
        last_name=member.last_name,
        email=member.email,
        phone_number=member.phone_number,
        address=member.address,
        membership_status=member.membership_status,
        join_date=member.join_date,
        last_activity_date=member.last_activity_date,
        total_loan_count=member.total_loan_count,
        active_loans=active_info,
        recent_loans=recent_info,
    )


async def update_member(
    member_id: int, member_update: MemberUpdate, session: AsyncSession
) -> Member:
    """
    Update member details. Validates email uniqueness if updated.
    """
    member = await session.get(Member, member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found",
        )

    # Track if any field changes
    has_changes = False

    if member_update.first_name is not None:
        first_name = member_update.first_name.strip()
        if not first_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="First name cannot be empty",
            )
        member.first_name = first_name
        has_changes = True

    if member_update.last_name is not None:
        last_name = member_update.last_name.strip()
        if not last_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Last name cannot be empty",
            )
        member.last_name = last_name
        has_changes = True

    if member_update.email is not None:
        email = member_update.email.strip()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email cannot be empty",
            )
        if email.lower() != member.email.lower():
            # Verify new email uniqueness
            existing_email_res = await session.exec(
                select(Member).where(Member.email.ilike(email))
            )
            if existing_email_res.first():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A member with this email already exists",
                )
        member.email = email
        has_changes = True

    if member_update.phone_number is not None:
        phone_number = member_update.phone_number.strip()
        if not phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number cannot be empty",
            )
        member.phone_number = phone_number
        has_changes = True

    if member_update.address is not None:
        member.address = member_update.address.strip() if member_update.address else None
        has_changes = True

    if has_changes:
        member.last_activity_date = datetime.utcnow()
        session.add(member)
        await session.commit()
        await session.refresh(member)

    return member


async def update_member_status(
    member_id: int, new_status: str, session: AsyncSession
) -> Member:
    """
    Update member status (e.g. active, suspended, expired).
    """
    member = await session.get(Member, member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found",
        )

    clean_status = new_status.strip().lower()
    allowed_statuses = ["active", "suspended", "expired"]
    if clean_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Allowed values are: {', '.join(allowed_statuses)}",
        )

    if member.membership_status != clean_status:
        member.membership_status = clean_status
        member.last_activity_date = datetime.utcnow()
        session.add(member)
        await session.commit()
        await session.refresh(member)

    return member


async def delete_member(member_id: int, session: AsyncSession) -> None:
    """
    Delete a member. Blocks deletion if there are outstanding (unreturned) loans.
    """
    member = await session.get(Member, member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found",
        )

    # Edge Case: check for active loans (unreturned books)
    active_loans_res = await session.exec(
        select(Loan).where(Loan.member_id == member_id, Loan.return_date.is_(None))
    )
    if active_loans_res.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete member with active/outstanding loans. Return books first.",
        )

    # Cascade delete any returned (completed) loans history for this member
    completed_loans_res = await session.exec(
        select(Loan).where(Loan.member_id == member_id)
    )
    for loan in completed_loans_res.all():
        await session.delete(loan)

    # Delete the member record
    await session.delete(member)
    await session.commit()
