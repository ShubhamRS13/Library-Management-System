import sys
import os
import asyncio
from datetime import datetime, timezone, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import engine
from app.models import Book, BookCopy, RelatedBook, Member, Loan

# 50 books definitions
books_raw = [
    # Fiction Sequels Group 1 (Harry Potter)
    {"num": 1, "title": "Harry Potter and the Sorcerer's Stone", "author": "J.K. Rowling", "summary": "A young boy discovers he is a wizard and attends a magical boarding school.", "tags": "fantasy, magic, adventure, youth", "copies": 2},
    {"num": 2, "title": "Harry Potter and the Chamber of Secrets", "author": "J.K. Rowling", "summary": "Harry returns for his second year and faces a dark mystery within the school.", "tags": "fantasy, magic, adventure, mystery", "copies": 1},
    {"num": 3, "title": "Harry Potter and the Prisoner of Azkaban", "author": "J.K. Rowling", "summary": "An escaped prisoner seeks out Harry, leading to revelations about his parents.", "tags": "fantasy, magic, adventure, time-travel", "copies": 3},
    {"num": 4, "title": "Harry Potter and the Goblet of Fire", "author": "J.K. Rowling", "summary": "Harry is mysteriously entered into a dangerous wizarding tournament.", "tags": "fantasy, magic, tournament, drama", "copies": 2},
    {"num": 5, "title": "Harry Potter and the Order of the Phoenix", "author": "J.K. Rowling", "summary": "A secret society forms to fight the return of the dark lord.", "tags": "fantasy, magic, rebellion, drama", "copies": 1},
    
    # Fiction Sequels Group 2 (Lord of the Rings)
    {"num": 6, "title": "The Fellowship of the Ring", "author": "J.R.R. Tolkien", "summary": "A hobbit inherits a ring of power and sets out to destroy it.", "tags": "fantasy, epic, adventure, elves", "copies": 2},
    {"num": 7, "title": "The Two Towers", "author": "J.R.R. Tolkien", "summary": "The fellowship splits as the forces of darkness prepare for war.", "tags": "fantasy, epic, adventure, battle", "copies": 3},
    {"num": 8, "title": "The Return of the King", "author": "J.R.R. Tolkien", "summary": "The final battle for Middle-earth and the restoration of the rightful king.", "tags": "fantasy, epic, adventure, final", "copies": 2},
    
    # Fiction Sequels Group 3 (Dune)
    {"num": 9, "title": "Dune", "author": "Frank Herbert", "summary": "A noble family is thrust into politics and survival on a hostile desert planet.", "tags": "scifi, space-opera, desert, politics", "copies": 3},
    {"num": 10, "title": "Dune Messiah", "author": "Frank Herbert", "summary": "Paul Atreides rules the empire but faces conspiracies from all sides.", "tags": "scifi, space-opera, tragedy, politics", "copies": 2},
    {"num": 11, "title": "Children of Dune", "author": "Frank Herbert", "summary": "The twins of Paul Atreides must navigate the future of the desert world.", "tags": "scifi, space-opera, empire, legacy", "copies": 1},
    
    # Business Sales
    {"num": 12, "title": "Spin Selling", "author": "Neil Rackham", "summary": "A research-backed framework for selling high-value goods and services.", "tags": "business, sales, strategy, communication", "copies": 2},
    {"num": 13, "title": "The Ultimate Sales Machine", "author": "Chet Holmes", "summary": "Twelve key strategies to tune up every aspect of your business operations.", "tags": "business, sales, management, growth", "copies": 1},
    {"num": 14, "title": "Influence: The Psychology of Persuasion", "author": "Robert Cialdini", "summary": "An analysis of the six core psychological triggers that drive buying decisions.", "tags": "business, sales, psychology, marketing", "copies": 3},
    
    # Business Marketing
    {"num": 15, "title": "Positioning: The Battle for Your Mind", "author": "Al Ries", "summary": "How to define a unique position for your brand in the mind of consumers.", "tags": "business, marketing, branding, strategy", "copies": 2},
    {"num": 16, "title": "Purple Cow", "author": "Seth Godin", "summary": "Making your product remarkable to ensure it stands out in a crowded market.", "tags": "business, marketing, innovation, strategy", "copies": 2},
    {"num": 17, "title": "Contagious: How to Build Word of Mouth", "author": "Jonah Berger", "summary": "An exploration of the social currency and triggers that make ideas go viral.", "tags": "business, marketing, virality, psychology", "copies": 1},
    
    # Business Management
    {"num": 18, "title": "High Output Management", "author": "Andrew Grove", "summary": "Practical advice on building and leading teams from Intel's legendary CEO.", "tags": "business, management, leadership, execution", "copies": 2},
    {"num": 19, "title": "The Lean Startup", "author": "Eric Ries", "summary": "How continuous innovation and rapid feedback loops build successful startups.", "tags": "business, management, entrepreneurship, innovation", "copies": 3},
    {"num": 20, "title": "Zero to One", "author": "Peter Thiel", "summary": "How to build a business that creates a brand new market rather than competing.", "tags": "business, management, startups, strategy", "copies": 2},
    
    # Business HR
    {"num": 21, "title": "Work Rules!", "author": "Laszlo Bock", "summary": "Insights into Google's people operations and culture.", "tags": "business, hr, talent, leadership", "copies": 1},
    {"num": 22, "title": "First, Break All the Rules", "author": "Marcus Buckingham", "summary": "What the world's greatest managers do differently to motivate employees.", "tags": "business, hr, management, talent", "copies": 2},
    {"num": 23, "title": "The Alliance", "author": "Reid Hoffman", "summary": "A framework for managing talent in the internet age using tours of duty.", "tags": "business, hr, careers, management", "copies": 1},
    
    # Classics & Dystopia
    {"num": 24, "title": "To Kill a Mockingbird", "author": "Harper Lee", "summary": "A story of racial injustice and loss of innocence in the American South.", "tags": "classics, drama, justice, youth", "copies": 3},
    {"num": 25, "title": "1984", "author": "George Orwell", "summary": "A chilling vision of a totalitarian regime ruled by Big Brother.", "tags": "classics, dystopia, politics, sci-fi", "copies": 3},
    {"num": 26, "title": "Animal Farm", "author": "George Orwell", "summary": "A satirical fable detailing the corruptive nature of political power.", "tags": "classics, allegory, politics, drama", "copies": 2},
    {"num": 27, "title": "Brave New World", "author": "Aldous Huxley", "summary": "A technological dystopia where citizens are genetically engineered and pacified.", "tags": "classics, dystopia, sci-fi, technology", "copies": 2},
    {"num": 28, "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "summary": "A critique of the American Dream set in the roaring twenties.", "tags": "classics, drama, romance, wealth", "copies": 2},
    {"num": 29, "title": "Pride and Prejudice", "author": "Jane Austen", "summary": "A classic romance exploring social class and misconceptions in Regency England.", "tags": "classics, romance, drama, society", "copies": 3},
    {"num": 30, "title": "Sense and Sensibility", "author": "Jane Austen", "summary": "The lives and romantic struggles of two sisters with contrasting temperaments.", "tags": "classics, romance, drama, sisters", "copies": 1},
    
    # Mystery
    {"num": 31, "title": "A Study in Scarlet", "author": "Arthur Conan Doyle", "summary": "The very first Sherlock Holmes story introducing the famous detective.", "tags": "mystery, detective, crime, sherlock", "copies": 2},
    {"num": 32, "title": "The Sign of the Four", "author": "Arthur Conan Doyle", "summary": "Holmes resolves a complex mystery involving stolen treasure and betrayal.", "tags": "mystery, detective, crime, sherlock", "copies": 2},
    {"num": 33, "title": "The Hound of the Baskervilles", "author": "Arthur Conan Doyle", "summary": "A cursed family and a spectral hound on the moors of Devon.", "tags": "mystery, detective, horror, sherlock", "copies": 3},
    {"num": 34, "title": "Murder on the Orient Express", "author": "Agatha Christie", "summary": "Poirot investigates a murder on a snowbound luxury train.", "tags": "mystery, detective, train, poirot", "copies": 2},
    {"num": 35, "title": "Death on the Nile", "author": "Agatha Christie", "summary": "A scenic cruise becomes a crime scene when a wealthy heiress is killed.", "tags": "mystery, detective, travel, poirot", "copies": 2},
    {"num": 36, "title": "The Murder of Roger Ackroyd", "author": "Agatha Christie", "summary": "A brilliant village murder mystery with an unforgettable twist.", "tags": "mystery, detective, twist, poirot", "copies": 2},
    
    # Science & Non-fiction
    {"num": 37, "title": "A Brief History of Time", "author": "Stephen Hawking", "summary": "An accessible introduction to cosmology, black holes, and the universe.", "tags": "science, physics, cosmology, space", "copies": 2},
    {"num": 38, "title": "The Grand Design", "author": "Stephen Hawking", "summary": "An exploration of quantum theories and the nature of physical laws.", "tags": "science, physics, philosophy, reality", "copies": 1},
    {"num": 39, "title": "Sapiens: A Brief History of Humankind", "author": "Yuval Noah Harari", "summary": "An expansive narrative tracking human evolution from hunter-gatherers to modern society.", "tags": "history, science, humanity, sociology", "copies": 3},
    {"num": 40, "title": "Homo Deus: A Brief History of Tomorrow", "author": "Yuval Noah Harari", "summary": "A look at the future of humanity and the challenges we will face.", "tags": "history, science, future, technology", "copies": 2},
    {"num": 41, "title": "21 Lessons for the 21st Century", "author": "Yuval Noah Harari", "summary": "An analysis of the most pressing political, social, and technological challenges today.", "tags": "sociology, current-events, politics, philosophy", "copies": 2},
    
    # Tech / Clean Series
    {"num": 42, "title": "Clean Code", "author": "Robert C. Martin", "summary": "A handbook of agile software craftsmanship for writing better, cleaner code.", "tags": "programming, tech, software-engineering, code", "copies": 3},
    {"num": 43, "title": "The Clean Coder", "author": "Robert C. Martin", "summary": "A code of conduct for professional programmers detailing behavior and mindset.", "tags": "programming, tech, professional, career", "copies": 2},
    {"num": 44, "title": "Clean Architecture", "author": "Robert C. Martin", "summary": "A guide to software structure and design to build robust, testable systems.", "tags": "programming, tech, design, architecture", "copies": 2},
    {"num": 45, "title": "Design Patterns", "author": "Erich Gamma", "summary": "The classic text cataloging reusable solutions to common software design problems.", "tags": "programming, tech, design, patterns", "copies": 2},
    
    # Philosophy & Self Help
    {"num": 46, "title": "Meditations", "author": "Marcus Aurelius", "summary": "The private journal of a Roman Emperor containing stoic wisdom and reflections.", "tags": "philosophy, stoicism, classics, self-help", "copies": 3},
    {"num": 47, "title": "Letters from a Stoic", "author": "Seneca", "summary": "Epistles from a statesman offering advice on life, virtue, and morality.", "tags": "philosophy, stoicism, classics, wisdom", "copies": 2},
    {"num": 48, "title": "Atomic Habits", "author": "James Clear", "summary": "An easy and proven way to build good habits and break bad ones.", "tags": "self-help, habits, psychology, productivity", "copies": 3},
    {"num": 49, "title": "The Power of Habit", "author": "Charles Duhigg", "summary": "The scientific discoveries that explain why habits exist and how they can be changed.", "tags": "self-help, habits, psychology, science", "copies": 2},
    {"num": 50, "title": "Deep Work", "author": "Cal Newport", "summary": "Rules for focused success in a distracted world.", "tags": "productivity, focus, self-help, careers", "copies": 2}
]

relations_raw = [
    # HP series
    (1, 2), (1, 3), (1, 4), (1, 5),
    (2, 3), (2, 4), (2, 5),
    (3, 4), (3, 5),
    (4, 5),
    
    # LotR series
    (6, 7), (6, 8),
    (7, 8),
    
    # Dune series
    (9, 10), (9, 11),
    (10, 11),
    
    # Sales
    (12, 13), (12, 14),
    (13, 14),
    
    # Marketing
    (15, 16), (15, 17),
    (16, 17),
    
    # Management
    (18, 19), (18, 20),
    (19, 20),
    
    # HR
    (21, 22), (21, 23),
    (22, 23),
    
    # Dystopia
    (25, 26), (25, 27),
    
    # Austen
    (29, 30),
    
    # Sherlock
    (31, 32), (31, 33),
    (32, 33),
    
    # Poirot
    (34, 35), (34, 36),
    (35, 36),
    
    # Hawking
    (37, 38),
    
    # Harari
    (39, 40), (39, 41),
    (40, 41),
    
    # Clean code series
    (42, 43), (42, 44),
    (43, 44),
    (44, 45),
    
    # Stoics
    (46, 47),
    
    # Habits
    (48, 49), (48, 50)
]

members_raw = [
    {"first_name": "Alice", "last_name": "Smith", "email": "alice.smith@example.com", "phone_number": "5550101", "address": "742 Evergreen Terrace"},
    {"first_name": "Bob", "last_name": "Jones", "email": "bob.jones@example.com", "phone_number": "5550102", "address": "123 Fake Street"},
    {"first_name": "Charlie", "last_name": "Brown", "email": "charlie.brown@example.com", "phone_number": "5550103", "address": "456 Oak Avenue"},
    {"first_name": "Diana", "last_name": "Prince", "email": "diana.prince@example.com", "phone_number": "5550104", "address": "Themyscira Embassy"},
    {"first_name": "Evan", "last_name": "Wright", "email": "evan.wright@example.com", "phone_number": "5550105", "address": "890 Maple Drive"},
    {"first_name": "Fiona", "last_name": "Gallagher", "email": "fiona.gallagher@example.com", "phone_number": "5550106", "address": "2119 South Homan Avenue"},
    {"first_name": "George", "last_name": "Clark", "email": "george.clark@example.com", "phone_number": "5550107", "address": "100 Pine Road"},
    {"first_name": "Hannah", "last_name": "Abbott", "email": "hannah.abbott@example.com", "phone_number": "5550108", "address": "Leaky Cauldron Room 4"},
    {"first_name": "Ian", "last_name": "Malcolm", "email": "ian.malcolm@example.com", "phone_number": "5550109", "address": "Sante Fe Institute"},
    {"first_name": "Julia", "last_name": "Roberts", "email": "julia.roberts@example.com", "phone_number": "5550110", "address": "90210 Beverly Hills"}
]

async def clean_database(session: AsyncSession):
    print("Cleaning existing database tables...")
    await session.exec(text("DELETE FROM loan"))
    await session.exec(text("DELETE FROM bookcopy"))
    await session.exec(text("DELETE FROM relatedbook"))
    await session.exec(text("DELETE FROM book"))
    await session.exec(text("DELETE FROM member"))
    await session.exec(text("DELETE FROM chatmessage"))
    await session.commit()
    print("Database cleaned.")

async def main():
    async with AsyncSession(engine) as session:
        await clean_database(session)
        
        print("Inserting 50 books and copies...")
        # Dictionary mapping book "num" to database ID
        book_num_to_id = {}
        # List of physical copies for each book ID
        book_copies_map = {} # book_id -> list of BookCopy objects
        
        for b_raw in books_raw:
            # Generate a unique custom ISBN
            isbn_str = f"978000000{b_raw['num']:04d}"
            
            book = Book(
                title=b_raw["title"],
                author=b_raw["author"],
                isbn=isbn_str,
                summary=b_raw["summary"],
                tags=b_raw["tags"]
            )
            session.add(book)
            await session.flush() # populate book.id
            
            book_num_to_id[b_raw["num"]] = book.id
            book_copies_map[book.id] = []
            
            # Create physical copies
            for i in range(b_raw["copies"]):
                copy = BookCopy(book_id=book.id, is_available=True, condition="good")
                session.add(copy)
                await session.flush() # populate copy.id
                book_copies_map[book.id].append(copy)
                
        print("Establishing book relationships...")
        inserted_relations = set()
        for r_num_a, r_num_b in relations_raw:
            id_a = book_num_to_id[r_num_a]
            id_b = book_num_to_id[r_num_b]
            
            a, b = min(id_a, id_b), max(id_a, id_b)
            if (a, b) not in inserted_relations:
                session.add(RelatedBook(book_a_id=a, book_b_id=b))
                inserted_relations.add((a, b))
                
        print("Inserting 10 members...")
        member_id_map = {} # index -> member.id
        for idx, m_raw in enumerate(members_raw):
            member = Member(
                first_name=m_raw["first_name"],
                last_name=m_raw["last_name"],
                email=m_raw["email"],
                phone_number=m_raw["phone_number"],
                address=m_raw["address"],
                membership_status="active",
                join_date=datetime.now(timezone.utc) - timedelta(days=30),
                total_loan_count=0
            )
            session.add(member)
            await session.flush()
            member_id_map[idx] = member
            
        print("Generating closed and open loans...")
        now = datetime.now(timezone.utc)
        
        # Helper to create a loan
        async def make_loan(member, book_num, copy_idx, borrowed_days_ago, returned_days_ago=None):
            book_id = book_num_to_id[book_num]
            copy = book_copies_map[book_id][copy_idx]
            
            loan_date = now - timedelta(days=borrowed_days_ago)
            return_date = None
            if returned_days_ago is not None:
                return_date = now - timedelta(days=returned_days_ago)
                copy.is_available = True
            else:
                copy.is_available = False # Borrowed copies are not available
                member.total_loan_count += 1
                member.last_activity_date = loan_date
            
            session.add(copy)
            
            loan = Loan(
                book_id=book_id,
                member_id=member.id,
                load_date=loan_date,
                return_date=return_date
            )
            session.add(loan)
            
        # Member 0 (Alice Smith): 1 closed, 1 open
        await make_loan(member_id_map[0], book_num=1, copy_idx=0, borrowed_days_ago=10, returned_days_ago=3)
        await make_loan(member_id_map[0], book_num=2, copy_idx=0, borrowed_days_ago=2)
        
        # Member 1 (Bob Jones): 1 closed, 1 open
        await make_loan(member_id_map[1], book_num=6, copy_idx=0, borrowed_days_ago=14, returned_days_ago=7)
        await make_loan(member_id_map[1], book_num=7, copy_idx=0, borrowed_days_ago=4)
        
        # Member 2 (Charlie Brown): 1 open
        await make_loan(member_id_map[2], book_num=12, copy_idx=0, borrowed_days_ago=5)
        
        # Member 3 (Diana Prince): 1 closed
        await make_loan(member_id_map[3], book_num=18, copy_idx=0, borrowed_days_ago=20, returned_days_ago=10)
        
        # Member 4 (Evan Wright): 1 open
        await make_loan(member_id_map[4], book_num=42, copy_idx=0, borrowed_days_ago=1)
        
        # Member 5 (Fiona Gallagher): 1 closed, 1 open
        await make_loan(member_id_map[5], book_num=24, copy_idx=0, borrowed_days_ago=8, returned_days_ago=1)
        await make_loan(member_id_map[5], book_num=25, copy_idx=0, borrowed_days_ago=1)
        
        # Member 6 (George Clark): 1 closed
        await make_loan(member_id_map[6], book_num=31, copy_idx=0, borrowed_days_ago=15, returned_days_ago=5)
        
        # Member 7 (Hannah Abbott): 1 open
        await make_loan(member_id_map[7], book_num=46, copy_idx=0, borrowed_days_ago=3)
        
        # Member 8 (Ian Malcolm): 1 closed
        await make_loan(member_id_map[8], book_num=39, copy_idx=0, borrowed_days_ago=12, returned_days_ago=4)
        
        # Commit all changes to the database
        await session.commit()
        print("Test data inserted successfully!")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
