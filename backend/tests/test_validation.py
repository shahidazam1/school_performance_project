import pytest
from pydantic import ValidationError

from school_performance_project.backend.app.core.security import hash_password, verify_password
from school_performance_project.backend.app.schemas.auth import RegisterRequest, ResetPasswordRequest


def test_password_hash_round_trip():
    hashed = hash_password("correct horse battery staple")
    assert hashed != "correct horse battery staple"
    assert verify_password("correct horse battery staple", hashed)
    assert not verify_password("wrong password", hashed)


def test_registration_rejects_mismatched_passwords():
    with pytest.raises(ValidationError):
        RegisterRequest(name="Example School", email="admin@example.com", password="password123", confirm_password="different123")


def test_reset_request_requires_matching_passwords():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="a" * 32, new_password="password123", confirm_password="different123")