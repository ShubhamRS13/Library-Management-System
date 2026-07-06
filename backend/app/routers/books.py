from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import get_session
from app.models import Book, BookCopy # Import your SQLModel classes
from typing import Optional, List

router = APIRouter()

@router.post("/", response_model=Book)
async def create_book(book: Book, session: AsyncSession = Depends(get_session)):
    """
    Add a new book title to the library inventory.
    """
    from sqlmodel import select

    # Check if a book with the same ISBN already exists
    statement = select(Book).where(Book.isbn == book.isbn)
    result = await session.execute(statement)
    existing_book = result.scalars().first()
    if existing_book:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book with ISBN '{book.isbn}' already exists."
        )

    # Explicitly link and add copies if provided
    if book.copies:
        for copy in book.copies:
            copy.book = book
            session.add(copy)

    session.add(book)
    await session.commit()
    await session.refresh(book, ["copies"])
    return book

@router.post("/bulk", response_model=List[Book])
async def create_books(books: List[Book], session: AsyncSession = Depends(get_session)):
    """
    Add multiple new book titles to the library inventory.
    """
    # Write logic to add single book and its copies to the inventory - bulk operation.
    # Logic to add multiple books goes here
    pass

@router.get("/", response_model=list[Book])
async def read_books(
    title: Optional[str] = None,
    author: Optional[str] = None,
    isbn: Optional[str] = None,
    tags: Optional[List[str]] = None,
    session: AsyncSession = Depends(get_session)
    ):
    """
    Retrieve all books from the inventory.
    """
    # Logic to fetch all books goes here
    pass

@router.get("/{book_id}", response_model=Book)
async def read_book(book_id: int, session: AsyncSession = Depends(get_session)):
    """
    Retrieve a specific book by its ID.
    """
    # Logic to fetch a single book goes here
    # take care of copy addition and deletion.
    pass

@router.put("/{book_id}", response_model=Book)
async def update_book(book_id: int, book: Book, session: AsyncSession = Depends(get_session)):
    """
    Update details for an existing book.
    """
    # Logic to update book details goes here
    pass

@router.delete("/{book_id}")
async def delete_book(book_id: int, session: AsyncSession = Depends(get_session)):
    """
    Remove a book from the library inventory.
    """
    # Write the logic to delete a book and its all copies from the inventory - single
    # Logic to delete a book goes here
    pass

@router.delete("/bulk")
async def delete_books(book_ids: List[int], session: AsyncSession = Depends(get_session)):
    """
    Remove multiple books from the library inventory.
    """
    # Write the logic to delete a book and its all copies from the inventory - bulk operation
    # Logic to delete multiple books goes here
    pass