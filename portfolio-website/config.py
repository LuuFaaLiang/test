"""
Application configuration.

Reads sensitive values from environment variables so real credentials
never need to be committed to the repository. Sensible local defaults
are provided for everything else.
"""

import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    DEBUG = os.environ.get("FLASK_DEBUG", "1") == "1"

    # Database
    DATABASE_PATH = os.path.join(BASE_DIR, "database", "portfolio.db")

    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    ALLOWED_RESUME_EXTENSIONS = {"pdf"}

    # Flask-Mail (optional — only used if MAIL_USERNAME / MAIL_PASSWORD are set)
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_USERNAME")
    CONTACT_RECEIVER = os.environ.get("CONTACT_RECEIVER", MAIL_USERNAME)

    # Site info (used across templates)
    SITE_NAME = "Lianghok — Portfolio"
    OWNER_NAME = "Lianghok"
    OWNER_TITLES = ["IT Student", "Python Developer", "Frontend Developer", "Future Software Engineer"]
