from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.database import get_session
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.ai_agent.agent import library_agent
from app.models import ChatMessage
from pydantic_ai.messages import ModelMessagesTypeAdapter


router = APIRouter()

# Configurable limit for chat history turns to retain
CHAT_HISTORY_LIMIT = 10

@router.post("/chat")
async def chat_stream(
    message: str, 
    session_id: str, 
    session: AsyncSession = Depends(get_session)
):
    # Fetch historical messages for the session (up to CHAT_HISTORY_LIMIT turns)
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(CHAT_HISTORY_LIMIT)
    )
    results = (await session.exec(stmt)).all()
    # Reverse to get chronological order
    results.reverse()

    # Deserialize and flatten the messages
    message_history = []
    for record in results:
        if record.message_data:
            try:
                turn_messages = ModelMessagesTypeAdapter.validate_json(record.message_data)
                message_history.extend(turn_messages)
            except Exception:
                # If deserialization fails, skip this turn's history
                pass

    async def generate():
        # run_stream handles the streaming connection
        async with library_agent.run_stream(
            message,
            message_history=message_history,
            deps={'session': session}
        ) as result:
            # stream_structured yields pieces of your LibraryResponse model
            async for data in result.stream_output(debounce_by=0.1):
                # Send the partial data as JSON to the frontend
                yield data.model_dump_json() + "\n"

            # After the stream is fully consumed, store the new messages for this turn
            new_msgs = result.new_messages()
            if new_msgs:
                serialized = ModelMessagesTypeAdapter.dump_json(new_msgs).decode('utf-8')
                new_record = ChatMessage(session_id=session_id, message_data=serialized)
                session.add(new_record)
                await session.commit()

    return StreamingResponse(generate(), media_type="application/x-ndjson")
