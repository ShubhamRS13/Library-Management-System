import sys
import os
import asyncio
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import httpx
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.main import app
from app.database import engine
from app.models import Member, Loan, Book, BookCopy

async def clean_database():
    print("Cleaning database...")
    async with AsyncSession(engine) as session:
        # Delete loans, copies, books, and members to make test runs idempotent
        await session.exec(text("DELETE FROM loan"))
        await session.exec(text("DELETE FROM bookcopy"))
        await session.exec(text("DELETE FROM book"))
        await session.exec(text("DELETE FROM member"))
        await session.commit()
    print("Database cleaned.")

async def test_members_api():
    await clean_database()
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test POST /members/ (Create member)
        print("Testing POST /members/ (create member)...")
        member_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone_number": "1234567890",
            "address": "123 Main St"
        }
        res = await client.post("/members/", json=member_data)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        member = res.json()
        assert member["first_name"] == "John"
        assert member["last_name"] == "Doe"
        assert member["email"] == "john.doe@example.com"
        assert member["phone_number"] == "1234567890"
        assert member["address"] == "123 Main St"
        assert member["membership_status"] == "active"
        assert "join_date" in member
        assert "id" in member
        
        member_id = member["id"]
        print(f"Member created with ID: {member_id}")
        
        # 2. Test duplicate email registration (throws 409 Conflict)
        print("Testing POST /members/ duplicate email validation...")
        res = await client.post("/members/", json=member_data)
        assert res.status_code == 409, f"Expected 409 Conflict for duplicate email, got {res.status_code}: {res.text}"
        print("Duplicate email constraint handled correctly (409 Conflict).")
        
        # 3. Test validation of empty fields
        print("Testing POST /members/ empty field validation...")
        invalid_member = member_data.copy()
        invalid_member["first_name"] = ""
        res = await client.post("/members/", json=invalid_member)
        assert res.status_code == 400, f"Expected 400 Bad Request for empty first_name, got {res.status_code}: {res.text}"
        print("Empty name constraint handled correctly (400 Bad Request).")
        
        # 4. Test GET /members/ (List and search)
        print("Testing GET /members/ (list and search)...")
        # Create a second member
        member2_data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "phone_number": "0987654321",
            "address": "456 Oak Ave"
        }
        await client.post("/members/", json=member2_data)
        
        # List all
        res = await client.get("/members/")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        members = res.json()
        assert len(members) == 2, f"Expected 2 members, got {len(members)}"
        print("List members returned correct count of 2.")
        
        # Search by ID
        res = await client.get(f"/members/?search={member_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        results = res.json()
        assert len(results) == 1, f"Expected 1 search result, got {len(results)}"
        assert results[0]["id"] == member_id, f"Expected ID {member_id}, got {results[0]['id']}"
        print("Search by member ID works correctly.")
        
        # Search by name (case-insensitive)
        res = await client.get("/members/?search=jane")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        results = res.json()
        assert len(results) == 1, f"Expected 1 search result, got {len(results)}"
        assert results[0]["first_name"] == "Jane", f"Expected Jane, got {results[0]['first_name']}"
        print("Search by name (case-insensitive) works correctly.")

        # Search by combined name
        res = await client.get("/members/?search=John Doe")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        results = res.json()
        assert len(results) == 1, f"Expected 1 search result, got {len(results)}"
        assert results[0]["first_name"] == "John", f"Expected John, got {results[0]['first_name']}"
        print("Search by combined first/last name works correctly.")
        
        # 5. Test PUT /members/{member_id} (Update details)
        print("Testing PUT /members/{member_id} (update details)...")
        update_data = {
            "first_name": "Johnny",
            "address": "789 Pine Rd"
        }
        res = await client.put(f"/members/{member_id}", json=update_data)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        updated = res.json()
        assert updated["first_name"] == "Johnny"
        assert updated["address"] == "789 Pine Rd"
        assert updated["email"] == "john.doe@example.com" # unchanged
        print("Member details update works correctly.")
        
        # 6. Test PUT /members/{member_id}/status (Update status)
        print("Testing PUT /members/{member_id}/status (update status)...")
        res = await client.put(f"/members/{member_id}/status?new_status=suspended")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        updated_status = res.json()
        assert updated_status["membership_status"] == "suspended"
        
        # Test invalid status
        res = await client.put(f"/members/{member_id}/status?new_status=invalid_status")
        assert res.status_code == 400, f"Expected 400 for invalid status update, got {res.status_code}"
        print("Invalid status updates are blocked correctly.")
        
        # Reset back to active
        await client.put(f"/members/{member_id}/status?new_status=active")
        print("Status updates work correctly.")
        
        # 7. Test GET /members/{member_id} (Retrieve member details with active and recent loans)
        print("Testing GET /members/{member_id} with loans history...")
        # Inject mock books and loan records in the database
        async with AsyncSession(engine) as session:
            # Create a book
            book = Book(title="The Hobbit", author="J.R.R. Tolkien", isbn="9780261103344")
            session.add(book)
            await session.flush()
            
            # Create book copies
            copy1 = BookCopy(book_id=book.id, is_available=False, condition="good")
            copy2 = BookCopy(book_id=book.id, is_available=True, condition="good")
            session.add(copy1)
            session.add(copy2)
            await session.flush()
            
            # Create active loan (return_date is None)
            active_loan = Loan(
                book_id=book.id,
                member_id=member_id,
                load_date=datetime.utcnow()
            )
            # Create a completed loan (return_date is not None)
            completed_loan = Loan(
                book_id=book.id,
                member_id=member_id,
                load_date=datetime.utcnow(),
                return_date=datetime.utcnow()
            )
            session.add(active_loan)
            session.add(completed_loan)
            await session.commit()
            
        # Fetch detailed member profile
        res = await client.get(f"/members/{member_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        details = res.json()
        assert details["first_name"] == "Johnny"
        assert len(details["active_loans"]) == 1, f"Expected 1 active loan, got {len(details['active_loans'])}"
        assert details["active_loans"][0]["book_title"] == "The Hobbit"
        assert len(details["recent_loans"]) == 1, f"Expected 1 recent loan, got {len(details['recent_loans'])}"
        assert details["recent_loans"][0]["book_title"] == "The Hobbit"
        assert details["recent_loans"][0]["return_date"] is not None
        print("Fetching member details with active/recent loans works perfectly.")
        
        # 8. Test DELETE /members/{member_id} (Active loans check)
        print("Testing DELETE /members/{member_id} active loans safeguard block...")
        res = await client.delete(f"/members/{member_id}")
        assert res.status_code == 400, f"Expected 400 when deleting member with active loans, got {res.status_code}: {res.text}"
        print("Safeguard blocked member deletion due to active loans correctly.")
        
        # Return the book (mark active loan as returned)
        print("Resolving active loan to allow member deletion...")
        async with AsyncSession(engine) as session:
            res_loan = await session.exec(select(Loan).where(Loan.member_id == member_id, Loan.return_date.is_(None)))
            al = res_loan.first()
            al.return_date = datetime.utcnow()
            session.add(al)
            await session.commit()
            
        # Try deleting again now that there are no active loans
        res = await client.delete(f"/members/{member_id}")
        assert res.status_code == 204, f"Expected 204, got {res.status_code}"
        print("Member with no active loans deleted successfully (204 No Content).")
        
        # Retrieve member details (should be 404 now)
        res = await client.get(f"/members/{member_id}")
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("Member deletion verified successfully (member is gone).")
        
    print("\n--- ALL TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_members_api())
