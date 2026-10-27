from bson import ObjectId

from app.api.routes.network import as_public


def test_public_document_converts_nested_object_ids() -> None:
    author_id = ObjectId()
    document = {
        "_id": ObjectId(),
        "author_id": author_id,
        "members": [author_id],
        "password_hash": "never-return-this",
    }

    public_document = as_public(document)

    assert public_document is not None
    assert isinstance(public_document["id"], str)
    assert public_document["author_id"] == str(author_id)
    assert public_document["members"] == [str(author_id)]
    assert "password_hash" not in public_document