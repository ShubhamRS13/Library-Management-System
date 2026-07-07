import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

from app.models import Book, BookCopy, Loan, Member, LoanCreate, LoanDetailResponse
from app.services.loans_service import create_loan, return_book, get_loan, get_loans, get_active_loans, IST

class MockResult:
    def __init__(self, val):
        self._val = val
        
    def first(self):
        return self._val[0] if self._val else None
        
    def all(self):
        return self._val

class TestLoansService(unittest.IsolatedAsyncioTestCase):
    async def test_create_loan_success(self):
        # Setup mocks
        session = AsyncMock()
        
        # Configure session.add to be synchronous and assign ID to new Loan records
        def mock_add(obj):
            if isinstance(obj, Loan) and obj.id is None:
                obj.id = 5
        session.add = MagicMock(side_effect=mock_add)
        
        member = Member(id=1, first_name="John", last_name="Doe", email="john@example.com", phone_number="12345", membership_status="active", total_loan_count=0)
        book = Book(id=2, title="Test Book", author="Test Author", isbn="1234567890")
        copy = BookCopy(id=10, book_id=2, is_available=True, condition="good")
        
        # Mock session.get
        async def mock_get(model, obj_id):
            if model == Member and obj_id == 1:
                return member
            if model == Book and obj_id == 2:
                return book
            return None
        session.get = mock_get
        
        # Mock session.exec
        mock_result = MockResult([copy])
        session.exec = AsyncMock(return_value=mock_result)
        
        # Call service
        loan_data = LoanCreate(book_id=2, member_id=1)
        response = await create_loan(loan_data, session)
        
        # Verifications
        self.assertEqual(response.id, 5)
        self.assertEqual(response.book_title, "Test Book")
        self.assertEqual(response.member_first_name, "John")
        self.assertEqual(response.member_last_name, "Doe")
        self.assertFalse(copy.is_available)
        self.assertEqual(member.total_loan_count, 1)
        self.assertIsNotNone(member.last_activity_date)
        session.commit.assert_called_once()
        
    async def test_create_loan_member_inactive(self):
        session = AsyncMock()
        session.add = MagicMock()
        member = Member(id=1, first_name="John", last_name="Doe", email="john@example.com", phone_number="12345", membership_status="suspended")
        
        async def mock_get(model, obj_id):
            if model == Member and obj_id == 1:
                return member
            return None
        session.get = mock_get
        
        loan_data = LoanCreate(book_id=2, member_id=1)
        with self.assertRaises(HTTPException) as ctx:
            await create_loan(loan_data, session)
        
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("must be active", ctx.exception.detail)
        
    async def test_create_loan_no_copies(self):
        session = AsyncMock()
        session.add = MagicMock()
        member = Member(id=1, first_name="John", last_name="Doe", email="john@example.com", phone_number="12345", membership_status="active")
        book = Book(id=2, title="Test Book", author="Test Author", isbn="1234567890")
        
        async def mock_get(model, obj_id):
            if model == Member and obj_id == 1:
                return member
            if model == Book and obj_id == 2:
                return book
            return None
        session.get = mock_get
        
        # Mock session.exec returning no available copy
        mock_result = MockResult([])
        session.exec = AsyncMock(return_value=mock_result)
        
        loan_data = LoanCreate(book_id=2, member_id=1)
        with self.assertRaises(HTTPException) as ctx:
            await create_loan(loan_data, session)
            
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("No copies of this book are currently available", ctx.exception.detail)
        
    async def test_return_book_success(self):
        session = AsyncMock()
        session.add = MagicMock()
        loan = Loan(id=5, book_id=2, member_id=1, load_date=datetime.now(IST), return_date=None)
        member = Member(id=1, first_name="John", last_name="Doe", email="john@example.com", phone_number="12345")
        book = Book(id=2, title="Test Book", author="Test Author", isbn="1234567890")
        copy = BookCopy(id=10, book_id=2, is_available=False, condition="good")
        
        async def mock_get(model, obj_id):
            if model == Loan and obj_id == 5:
                return loan
            if model == Member and obj_id == 1:
                return member
            if model == Book and obj_id == 2:
                return book
            return None
        session.get = mock_get
        
        mock_result = MockResult([copy])
        session.exec = AsyncMock(return_value=mock_result)
        
        response = await return_book(5, session)
        
        self.assertIsNotNone(loan.return_date)
        self.assertTrue(copy.is_available)
        self.assertEqual(response.book_title, "Test Book")
        session.commit.assert_called_once()
        
    async def test_return_book_already_returned(self):
        session = AsyncMock()
        session.add = MagicMock()
        loan = Loan(id=5, book_id=2, member_id=1, load_date=datetime.now(IST), return_date=datetime.now(IST))
        
        async def mock_get(model, obj_id):
            if model == Loan and obj_id == 5:
                return loan
            return None
        session.get = mock_get
        
        with self.assertRaises(HTTPException) as ctx:
            await return_book(5, session)
            
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("already been returned", ctx.exception.detail)

    async def test_get_loan_details(self):
        session = AsyncMock()
        session.add = MagicMock()
        loan = Loan(id=5, book_id=2, member_id=1, load_date=datetime.now(IST), return_date=None)
        member = Member(id=1, first_name="John", last_name="Doe", email="john@example.com", phone_number="12345")
        book = Book(id=2, title="Test Book", author="Test Author", isbn="1234567890")
        
        async def mock_get(model, obj_id):
            if model == Loan and obj_id == 5:
                return loan
            if model == Member and obj_id == 1:
                return member
            if model == Book and obj_id == 2:
                return book
            return None
        session.get = mock_get
        
        response = await get_loan(5, session)
        self.assertEqual(response.book_title, "Test Book")
        self.assertEqual(response.member_first_name, "John")

    async def test_get_loans_and_active_loans(self):
        session = AsyncMock()
        session.add = MagicMock()
        
        loan = Loan(id=5, book_id=2, member_id=1, load_date=datetime.now(IST), return_date=None)
        book = Book(id=2, title="Test Book", author="Test Author", isbn="1234567890")
        member = Member(id=1, first_name="John", last_name="Doe", email="john@example.com", phone_number="12345")
        
        # session.exec returns a list of tuples (Loan, Book, Member)
        mock_result = MockResult([(loan, book, member)])
        session.exec = AsyncMock(return_value=mock_result)
        
        loans = await get_loans(session)
        self.assertEqual(len(loans), 1)
        self.assertEqual(loans[0].book_title, "Test Book")
        self.assertEqual(loans[0].member_first_name, "John")
        
        active_loans = await get_active_loans(session)
        self.assertEqual(len(active_loans), 1)
        self.assertEqual(active_loans[0].book_title, "Test Book")
