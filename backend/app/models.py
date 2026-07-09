from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, Relationship, SQLModel
from pydantic import BaseModel
# from sqlalchemy.orm import Mapped
class BookCopy(SQLModel, table=True):
    __tablename__ = "bookcopy"

    id: Optional[int] = Field(default=None, primary_key=True)
    book_id: Optional[int] = Field(default=None, foreign_key="book.id")
    is_available: bool = Field(default=True, sa_column=Column(Boolean))
    condition: str = Field(default="good")

    book: Optional["Book"] = Relationship(back_populates="copies")  # Keep this as-is


class BookRelation(SQLModel, table=True):
    __tablename__ = "bookrelation"

    id: Optional[int] = Field(default=None, primary_key=True)
    book_id: Optional[int] = Field(default=None, foreign_key="book.id")
    related_book_ids: Optional[list[int]] = Field(
        default=None,
        sa_column=Column(ARRAY(Integer)),
    )

    book: Optional["Book"] = Relationship(back_populates="relations")  # Keep this as-is


class Loan(SQLModel, table=True):
    __tablename__ = "loan"

    id: Optional[int] = Field(default=None, primary_key=True)
    book_id: Optional[int] = Field(default=None, foreign_key="book.id")
    member_id: Optional[int] = Field(default=None, foreign_key="member.id")
    load_date: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    return_date: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))

    book: Optional["Book"] = Relationship(back_populates="loans")  # Keep this as-is
    member: Optional["Member"] = Relationship(back_populates="loans")  # Keep this as-is
    
class Member(SQLModel, table=True):
    __tablename__ = "member"

    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(index=True)
    last_name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    phone_number: str = Field(index=True)
    address: Optional[str] = Field(default=None)
    membership_status: str = Field(default="active")
    join_date: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    last_activity_date: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    total_loan_count: int = Field(default=0)

    loans: List["Loan"] = Relationship(back_populates="member")

class Book(SQLModel, table=True):
    __tablename__ = "book"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    author: str = Field(index=True)
    isbn: str = Field(unique=True, index=True)
    summary: Optional[str] = Field(default=None)
    tags: Optional[str] = Field(default=None)

    copies: List["BookCopy"] = Relationship(back_populates="book")
    loans: List["Loan"] = Relationship(back_populates="book")
    relations: List["BookRelation"] = Relationship(back_populates="book")


class BookListItem(SQLModel):
    id: int
    title: str
    author: str
    isbn: str
    summary: Optional[str] = None
    tags: Optional[str] = None

class BookListItem(SQLModel):
    id: int
    title: str
    author: str
    isbn: str
    summary: Optional[str] = None
    tags: Optional[str] = None
    available: Optional[bool] = True

class CopyInfo(SQLModel):
    id: int
    is_available: bool
    condition: str


class HolderInfo(SQLModel):
    member_id: int
    first_name: str
    last_name: str
    phone_number: Optional[str] = None


class LoanInfo(SQLModel):
    id: int
    member_id: int
    member_first_name: str
    member_last_name: str
    load_date: datetime
    return_date: Optional[datetime] = None


class BookDetailResponse(SQLModel):
    id: int
    title: str
    author: str
    isbn: str
    summary: Optional[str] = None
    tags: Optional[str] = None
    available_copies_count: int = 0
    copies: List[CopyInfo] = []
    current_holders: List[HolderInfo] = []
    loan_history: List[LoanInfo] = []

class BookUpdate(SQLModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[str] = None
    add_copies: Optional[int] = 0


class BookCreateRequest(SQLModel):
    title: str
    author: str
    isbn: str
    summary: Optional[str] = None
    tags: Optional[str] = None
    copy_count: int = 1


class BulkBookUploadResponse(SQLModel):
    created: List[Book]
    failed: List[dict]


class MemberCreate(SQLModel):
    first_name: str
    last_name: str
    email: str
    phone_number: str
    address: Optional[str] = None


class MemberUpdate(SQLModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None


class MemberLoanInfo(SQLModel):
    id: int
    book_id: int
    book_title: str
    book_author: str
    load_date: datetime
    return_date: Optional[datetime] = None


class MemberDetailResponse(SQLModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone_number: str
    address: Optional[str] = None
    membership_status: str
    join_date: datetime
    last_activity_date: Optional[datetime] = None
    total_loan_count: int
    active_loans: List[MemberLoanInfo] = []
    recent_loans: List[MemberLoanInfo] = []


class LoanCreate(SQLModel):
    book_id: int
    member_id: int


class LoanDetailResponse(SQLModel):
    id: int
    book_id: int
    book_title: str
    member_id: int
    member_first_name: str
    member_last_name: str
    load_date: datetime
    return_date: Optional[datetime] = None

class BookCard(BaseModel):
    book_id: int
    title: str
    author: str
    is_available: bool

class LibraryResponse(BaseModel):
    message: str  # The conversational text (GranthPal speaking)
    recommended_books: Optional[List[BookCard]] # The data to render as UI Cards

class ChatMessage(SQLModel, table=True):
    __tablename__ = "chatmessage"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    message_data: str = Field(default="[]")
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), default=datetime.utcnow)
    )

