from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import Book, BulkBookUploadResponse, BookListItem, BookDetailResponse, BookUpdate
from app.services import books_service


router = APIRouter()


@router.post("/", response_model=Book)
async def create_book(book: Book, session: AsyncSession = Depends(get_session)):
    """
    Add a new book title to the library inventory.
    """
    return await books_service.create_book(book, session)

@router.post("/bulk", response_model=BulkBookUploadResponse)
async def create_books(books: List[Book], session: AsyncSession = Depends(get_session)):
    """
    Add multiple new book titles to the library inventory.
    """
    return await books_service.create_books_bulk(books, session)

@router.get("/", response_model=List[BookListItem])
async def read_books(
    title: Optional[str] = None,
    author: Optional[str] = None,
    isbn: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    """
    Retrieve all books from the inventory.
    """
    return await books_service.get_books(session, title=title, author=author, isbn=isbn, tags=tags, limit=limit, offset=offset)

@router.get("/{book_id}", response_model=BookDetailResponse)
async def read_book(book_id: int, session: AsyncSession = Depends(get_session)):
    """
    Retrieve a specific book by its ID.
    """
    return await books_service.get_book_detail(book_id, session)

@router.get("/suggestions", response_model=List[BookListItem])
async def suggestions(q: Optional[str] = None, limit: int = 10, session: AsyncSession = Depends(get_session)):
    """Autocomplete suggestions for title/author/isbn"""
    return await books_service.get_suggestions(session, q, limit)

@router.put("/{book_id}", response_model=BookUpdate)
async def update_book(book_id: int, book_update: BookUpdate, session: AsyncSession = Depends(get_session)):
    """
    Update details for an existing book.
    """
    return await books_service.update_book(book_id, book_update, session)

@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: int, session: AsyncSession = Depends(get_session)):
    """
    Remove a book from the library inventory.
    """
    return await books_service.delete_book(book_id, session)

@router.delete("/bulk")
async def delete_books(book_ids: List[int], session: AsyncSession = Depends(get_session)):
    """
    Remove multiple books from the library inventory.
    """
    return await books_service.delete_books_bulk(book_ids, session)

@router.delete("/{book_id}/copies/{copy_id}", status_code=204)
async def delete_book_copy(
    book_id: int,
    copy_id: int,
    session: AsyncSession = Depends(get_session),
):
    await books_service.delete_book_copy(book_id, copy_id, session)