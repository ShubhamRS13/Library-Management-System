from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import get_session
from app.models import Loan  # Import your SQLModel Loan class

# Create the router instance
router = APIRouter()

@router.post("/", response_model=Loan)
async def create_loan(loan: Loan, session: AsyncSession = Depends(get_session)):
    """
    Create Loan (Check-out): Link a Member to a BookCopy and set the loan date.
    Ensure you check the member's status before processing.
    """
    # Logic: 
    # 1. Fetch Member to check membership_status [cite: 1299]
    # 2. Update BookCopy.is_available to False 
    # 3. Create and save the Loan record 
    pass

@router.patch("/{loan_id}/return", response_model=Loan)
async def return_book(loan_id: int, session: AsyncSession = Depends(get_session)):
    """
    Complete Loan (Check-in): Update the return_date and mark the BookCopy 
    as available again.
    """
    # Logic:
    # 1. Fetch the active loan
    # 2. Update return_date
    # 3. Update BookCopy.is_available to True
    pass

@router.get("/", response_model=list[Loan])
async def read_loans(session: AsyncSession = Depends(get_session)):
    """
    List Loans: Fetch all loan records (with optional filters).
    """
    pass

@router.get("/{loan_id}", response_model=Loan)
async def read_loan(loan_id: int, session: AsyncSession = Depends(get_session)):
    """
    Loan Details: Retrieve specific details of a single loan record.
    """
    pass

@router.get("/active", response_model=list[Loan])
async def read_active_loans(session: AsyncSession = Depends(get_session)):
    """
    Active Loans: A shortcut to view all books currently out on loan.
    """
    pass