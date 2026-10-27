from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from app.api.routes.auth import get_current_user, get_optional_user
from app.core.database import get_database
from app.schemas.api import CommentCreate, ConversationCreate, JobCreate, MessageCreate, PostCreate, ProfileUpdate

router = APIRouter(tags=["Professional network"])


def as_public(document: dict | None) -> dict | None:
    if document is None:
        return None
    result = dict(document)
    result["id"] = str(result.pop("_id"))
    result.pop("password_hash", None)

    def normalize(value: object) -> object:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, dict):
            return {key: normalize(item) for key, item in value.items()}
        if isinstance(value, list):
            return [normalize(item) for item in value]
        return value

    normalized = normalize(result)
    if not isinstance(normalized, dict):
        raise TypeError("Public API documents must normalize to a mapping")
    return normalized


def object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return ObjectId(value)


@router.get("/profiles/me")
async def my_profile(user: dict = Depends(get_current_user)) -> dict:
    return as_public(user)


@router.patch("/profiles/me")
async def update_my_profile(
    payload: ProfileUpdate,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    changes = payload.model_dump(exclude_unset=True)
    if changes:
        changes["updated_at"] = datetime.now(UTC)
        await database.users.update_one({"_id": user["_id"]}, {"$set": changes})
        user.update(changes)
    return as_public(user)


@router.get("/profiles/{user_id}")
async def get_profile(user_id: str, database: AsyncDatabase = Depends(get_database)) -> dict:
    user = await database.users.find_one({"_id": object_id(user_id)})
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return as_public(user)


@router.get("/feed")
async def get_feed(
    limit: int = Query(default=20, ge=1, le=100),
    before: datetime | None = None,
    user: dict | None = Depends(get_optional_user),
    database: AsyncDatabase = Depends(get_database),
) -> list[dict]:
    allowed_posts: list[dict] = [{"visibility": "public"}]
    if user:
        user_id = user["_id"]
        connections = database.connections.find(
            {"status": "accepted", "$or": [{"requester_id": user_id}, {"recipient_id": user_id}]},
            {"requester_id": 1, "recipient_id": 1},
        )
        peer_ids = [
            connection["recipient_id"] if connection["requester_id"] == user_id else connection["requester_id"]
            async for connection in connections
        ]
        allowed_posts.extend([
            {"author_id": user_id},
            {"visibility": "connections", "author_id": {"$in": [user_id, *peer_ids]}},
        ])
    filters: dict = {"$or": allowed_posts}
    if before:
        filters["created_at"] = {"$lt": before}
    cursor = database.posts.find(filters).sort("created_at", -1).limit(limit)
    return [as_public(post) async for post in cursor]


@router.post("/feed", status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    post = {
        "author_id": user["_id"], "author_name": user["full_name"], "content": payload.content.strip(),
        "visibility": payload.visibility, "reactions": [], "comments": [], "created_at": datetime.now(UTC),
    }
    result = await database.posts.insert_one(post)
    post["_id"] = result.inserted_id
    return as_public(post)


@router.post("/feed/{post_id}/reactions")
async def toggle_reaction(
    post_id: str,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    query = {"_id": object_id(post_id)}
    post = await database.posts.find_one(query, {"reactions": 1})
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    user_id = str(user["_id"])
    operation = "$pull" if user_id in post.get("reactions", []) else "$addToSet"
    result = await database.posts.find_one_and_update(query, {operation: {"reactions": user_id}}, return_document=ReturnDocument.AFTER)
    return as_public(result)


@router.post("/feed/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def comment_on_post(
    post_id: str,
    payload: CommentCreate,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    comment = {"id": str(ObjectId()), "author_id": str(user["_id"]), "author_name": user["full_name"], "content": payload.content.strip(), "created_at": datetime.now(UTC)}
    result = await database.posts.find_one_and_update(
        {"_id": object_id(post_id)}, {"$push": {"comments": comment}}, return_document=ReturnDocument.AFTER,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return comment


@router.get("/connections")
async def list_connections(user: dict = Depends(get_current_user), database: AsyncDatabase = Depends(get_database)) -> list[dict]:
    cursor = database.connections.find({"$or": [{"requester_id": user["_id"]}, {"recipient_id": user["_id"]}]})
    return [as_public(connection) async for connection in cursor]


@router.post("/connections/{recipient_id}/request", status_code=status.HTTP_201_CREATED)
async def request_connection(
    recipient_id: str,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    target_id = object_id(recipient_id)
    if target_id == user["_id"] or await database.users.find_one({"_id": target_id}, {"_id": 1}) is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    pair_key = ":".join(sorted([str(user["_id"]), str(target_id)]))
    if await database.connections.find_one({"pair_key": pair_key}):
        raise HTTPException(status_code=409, detail="A connection already exists")
    connection = {"pair_key": pair_key, "requester_id": user["_id"], "recipient_id": target_id, "status": "pending", "created_at": datetime.now(UTC)}
    result = await database.connections.insert_one(connection)
    connection["_id"] = result.inserted_id
    return as_public(connection)


@router.post("/connections/{connection_id}/accept")
async def accept_connection(
    connection_id: str,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    connection = await database.connections.find_one_and_update(
        {"_id": object_id(connection_id), "recipient_id": user["_id"], "status": "pending"},
        {"$set": {"status": "accepted", "updated_at": datetime.now(UTC)}}, return_document=ReturnDocument.AFTER,
    )
    if connection is None:
        raise HTTPException(status_code=404, detail="Pending connection request not found")
    return as_public(connection)


@router.get("/jobs")
async def list_jobs(limit: int = Query(default=20, ge=1, le=100), database: AsyncDatabase = Depends(get_database)) -> list[dict]:
    cursor = database.jobs.find({"status": "open"}).sort("created_at", -1).limit(limit)
    return [as_public(job) async for job in cursor]


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    job = {**payload.model_dump(), "poster_id": user["_id"], "status": "open", "applicant_ids": [], "created_at": datetime.now(UTC)}
    result = await database.jobs.insert_one(job)
    job["_id"] = result.inserted_id
    return as_public(job)


@router.post("/jobs/{job_id}/apply")
async def apply_for_job(
    job_id: str,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    result = await database.jobs.update_one({"_id": object_id(job_id), "status": "open"}, {"$addToSet": {"applicant_ids": user["_id"]}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Open job not found")
    return {"message": "Application recorded"}


@router.get("/conversations")
async def list_conversations(
    limit: int = Query(default=30, ge=1, le=100),
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> list[dict]:
    cursor = database.conversations.find({"participants": user["_id"]}).sort("created_at", -1).limit(limit)
    return [as_public(conversation) async for conversation in cursor]


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
async def start_conversation(
    payload: ConversationCreate,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    recipient_id = object_id(payload.recipient_id)
    if recipient_id == user["_id"] or await database.users.find_one({"_id": recipient_id}, {"_id": 1}) is None:
        raise HTTPException(status_code=404, detail="Recipient not found")
    participants = sorted([user["_id"], recipient_id])
    conversation = await database.conversations.find_one_and_update(
        {"participants": participants},
        {"$setOnInsert": {"participants": participants, "created_at": datetime.now(UTC)}},
        upsert=True, return_document=ReturnDocument.AFTER,
    )
    return as_public(conversation)


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> list[dict]:
    conversation = await database.conversations.find_one({"_id": object_id(conversation_id), "participants": user["_id"]})
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    cursor = database.messages.find({"conversation_id": conversation["_id"]}).sort("created_at", 1).limit(500)
    return [as_public(message) async for message in cursor]


@router.post("/conversations/{conversation_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    conversation = await database.conversations.find_one({"_id": object_id(conversation_id), "participants": user["_id"]})
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    message = {"conversation_id": conversation["_id"], "sender_id": user["_id"], "content": payload.content.strip(), "created_at": datetime.now(UTC)}
    result = await database.messages.insert_one(message)
    message["_id"] = result.inserted_id
    return as_public(message)


@router.get("/notifications")
async def list_notifications(
    limit: int = Query(default=30, ge=1, le=100),
    user: dict = Depends(get_current_user),
    database: AsyncDatabase = Depends(get_database),
) -> list[dict]:
    cursor = database.notifications.find({"user_id": user["_id"]}).sort("created_at", -1).limit(limit)
    return [as_public(notification) async for notification in cursor]