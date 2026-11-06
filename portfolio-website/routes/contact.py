"""
Contact form handling: validates input, stores it in SQLite, and
optionally sends a confirmation email if mail credentials are configured.
"""

import logging
import sqlite3

from flask import Blueprint, current_app, jsonify, request

from utils.validation import validate_contact_form

logger = logging.getLogger(__name__)

contact_bp = Blueprint("contact", __name__)


def get_db_connection():
    conn = sqlite3.connect(current_app.config["DATABASE_PATH"])
    conn.row_factory = sqlite3.Row
    return conn


@contact_bp.route("/api/contact", methods=["POST"])
def submit_contact():
    data = request.get_json(silent=True) or request.form.to_dict()

    errors = validate_contact_form(data)
    if errors:
        logger.info("Contact form validation failed: %s", errors)
        return jsonify({"success": False, "errors": errors}), 400

    name = data["name"].strip()
    email = data["email"].strip()
    subject = data["subject"].strip()
    message = data["message"].strip()

    try:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
            (name, email, subject, message),
        )
        conn.commit()
        conn.close()
        logger.info("New contact message stored from %s <%s>", name, email)
    except sqlite3.Error:
        logger.exception("Failed to store contact message")
        return jsonify({"success": False, "errors": {"_general": "Something went wrong. Please try again later."}}), 500

    _maybe_send_email(name, email, subject, message)

    return jsonify({"success": True, "message": "Thanks for reaching out! I'll get back to you soon."})


def _maybe_send_email(name, email, subject, message):
    """Sends a confirmation email only if MAIL_USERNAME/MAIL_PASSWORD are configured."""
    if not current_app.config.get("MAIL_USERNAME") or not current_app.config.get("MAIL_PASSWORD"):
        logger.info("Mail not configured — skipping email notification.")
        return

    try:
        from flask_mail import Message

        mail = current_app.extensions.get("mail")
        if mail is None:
            return
        msg = Message(
            subject=f"New portfolio message: {subject}",
            recipients=[current_app.config["CONTACT_RECEIVER"]],
            body=f"From: {name} <{email}>\n\n{message}",
        )
        mail.send(msg)
    except Exception:
        logger.exception("Failed to send confirmation email")
