from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import LoanCreate, LoanDetailResponse
from app.services import loans_service

# Create the router instance
router = APIRouter()


@router.post("/", response_model=LoanDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(
    loan_request: LoanCreate,
    session: AsyncSession = Depends(get_session)
):
    """
    Create Loan (Check-out): Link a Member to a BookCopy and set the loan date in IST.
    """
    return await loans_service.create_loan(loan_request, session)


@router.patch("/{loan_id}/return", response_model=LoanDetailResponse)
async def return_book(
    loan_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Complete Loan (Check-in): Update the return_date in IST and mark the BookCopy 
    as available again.
    """
    return await loans_service.return_book(loan_id, session)


@router.get("/", response_model=List[LoanDetailResponse])
async def read_loans(
    search: Optional[str] = Query(None, description="Search by book title, author, or member name"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """
    List Loans: Fetch all loan records with optional search filter.
    """
    return await loans_service.get_loans(session, search=search, limit=limit, offset=offset)


@router.get("/active", response_model=List[LoanDetailResponse])
async def read_active_loans(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session)
):
    """
    Active Loans: A shortcut to view all books currently out on loan.
    """
    return await loans_service.get_active_loans(session, limit=limit, offset=offset)


@router.get("/{loan_id}", response_model=LoanDetailResponse)
async def read_loan(
    loan_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Loan Details: Retrieve specific details of a single loan record.
    """
    return await loans_service.get_loan(loan_id, session)