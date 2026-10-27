import pytest
from bson import ObjectId
from pydantic import ValidationError

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.schemas.api import RegisterRequest


def test_password_hash_verifies_only_the_original_password() -> None:
    hashed_password = hash_password("secure-password-123")

    assert hashed_password != "secure-password-123"
    assert verify_password("secure-password-123", hashed_password)
    assert not verify_password("another-password", hashed_password)


def test_signed_access_token_round_trips_object_id_subject() -> None:
    subject = str(ObjectId())

    assert decode_access_token(create_access_token(subject)) == subject


def test_invalid_access_token_is_rejected() -> None:
    assert decode_access_token("not-a-jwt") is None


def test_registration_requires_a_strong_minimum_password_length() -> None:
    with pytest.raises(ValidationError):
        RegisterRequest(full_name="Alex Morgan", email="alex@example.com", password="short")