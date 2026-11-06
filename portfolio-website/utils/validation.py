"""
Lightweight regex-based validation for the contact form.

Kept dependency-free (no external validator library) so the rules are
easy to read and adjust in one place.
"""

import re

NAME_RE = re.compile(r"^[A-Za-z\u1780-\u17FF\s'.-]{2,60}$")  # supports Latin + Khmer script
EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$")
PHONE_RE = re.compile(r"^[+]?[0-9\s\-()]{7,20}$")


def validate_name(name: str) -> str | None:
    if not name or not name.strip():
        return "Name is required."
    if not NAME_RE.match(name.strip()):
        return "Name must be 2-60 letters (no numbers or symbols)."
    return None


def validate_email(email: str) -> str | None:
    if not email or not email.strip():
        return "Email is required."
    if not EMAIL_RE.match(email.strip()):
        return "Please enter a valid email address."
    return None


def validate_subject(subject: str) -> str | None:
    if not subject or not subject.strip():
        return "Subject is required."
    if len(subject.strip()) < 3 or len(subject.strip()) > 120:
        return "Subject must be between 3 and 120 characters."
    return None


def validate_message(message: str) -> str | None:
    if not message or not message.strip():
        return "Message is required."
    if len(message.strip()) < 10 or len(message.strip()) > 2000:
        return "Message must be between 10 and 2000 characters."
    return None


def validate_phone(phone: str) -> str | None:
    if not phone:  # phone is optional
        return None
    if not PHONE_RE.match(phone.strip()):
        return "Please enter a valid phone number."
    return None


def validate_contact_form(data: dict) -> dict:
    """Validate the whole contact payload; returns a dict of field -> error message."""
    errors = {}
    for field, validator in (
        ("name", validate_name),
        ("email", validate_email),
        ("subject", validate_subject),
        ("message", validate_message),
    ):
        error = validator(data.get(field, ""))
        if error:
            errors[field] = error
    return errors
