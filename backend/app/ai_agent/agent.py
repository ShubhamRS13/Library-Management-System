from pydantic_ai import Agent
from app.services import books_service
from app.database import get_session
from app.models import LibraryResponse
from dotenv import load_dotenv
import os

# 1. Load the variables from .env into the process environment
load_dotenv()


library_agent = Agent(
    model='openai:gpt-4o',
    output_type=LibraryResponse,
    system_prompt=(
        """
        You are GranthPal, a knowledgeable and polite library assistant. 
        Your purpose is to help members find books and check their availability. 
        Strictly restrict all conversations to books, literature, and library services. 
        If a user asks about non-book topics, politely decline and steer them back to books. 
        When recommending books, always check if they are available using `search_book` tool.

        **Output format**
        Return the conversational message in `message` and the books you found in `recommended_books`
        > In response always first fill the books using `recommended_books` and then `message`
        """
    ),
    deps_type=dict
)

@library_agent.tool
async def search_book(ctx, title: str = None, author: str = None, isbn: str = None, tags: list = None):
    """Search & get information about book by title, author, isbn or tags and return list of the books with summary and avaibility status"""
    session = ctx.deps['session']
    return await books_service.get_books(title=title, author=author, isbn=isbn, tags=tags, limit=5, offset=0, session=session)

