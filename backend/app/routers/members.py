from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import get_session
from app.models import (
    Member,
    MemberCreate,
    MemberUpdate,
    MemberDetailResponse,
)
from app.services import members_service

router = APIRouter()

@router.post("/", response_model=Member, status_code=status.HTTP_201_CREATED)
async def create_member(
    member: MemberCreate, session: AsyncSession = Depends(get_session)
):
    """Register a new library member."""
    return await members_service.create_member(member, session)

@router.get("/", response_model=List[Member])
async def read_members(
    search: Optional[str] = Query(None, description="Search by ID or Name"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve all library members with optional search."""
    return await members_service.get_members(session, search=search, limit=limit, offset=offset)

@router.get("/{member_id}", response_model=MemberDetailResponse)
async def read_member(member_id: int, session: AsyncSession = Depends(get_session)):
    """Retrieve a specific member's profile, including their active and recent loans."""
    return await members_service.get_member_detail(member_id, session)

@router.put("/{member_id}", response_model=Member)
async def update_member(
    member_id: int, 
    member: MemberUpdate, 
    session: AsyncSession = Depends(get_session)
):
    """Update general member profile details."""
    return await members_service.update_member(member_id, member, session)

@router.put("/{member_id}/status", response_model=Member)
async def update_member_status(
    member_id: int, 
    new_status: str = Query(..., description="New membership status"), 
    session: AsyncSession = Depends(get_session)
):
    """
    Update a member's status (e.g., active, suspended, expired).
    This logic will handle blocking/unblocking members.
    """
    return await members_service.update_member_status(member_id, new_status, session)

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(member_id: int, session: AsyncSession = Depends(get_session)):
    """Remove a member from the system."""
    await members_service.delete_member(member_id, session)
