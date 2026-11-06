"""
Small JSON API used by the frontend:
- /api/stats        visitor counter + CV download counter (in-memory + DB backed)
- /api/messages      admin listing of stored contact messages
- /api/messages/<id> delete a single message (admin)
"""

import logging
import sqlite3

from flask import Blueprint, current_app, jsonify

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__, url_prefix="/api")


def get_db_connection():
    conn = sqlite3.connect(current_app.config["DATABASE_PATH"])
    conn.row_factory = sqlite3.Row
    return conn


@api_bp.route("/messages", methods=["GET"])
def list_messages():
    """Admin endpoint: returns all stored contact messages, newest first."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM messages ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@api_bp.route("/messages/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM messages WHERE id = ?", (message_id,))
    conn.commit()
    conn.close()
    logger.info("Deleted message id=%s", message_id)
    return jsonify({"success": True})


@api_bp.route("/stats", methods=["GET"])
def stats():
    conn = get_db_connection()
    count = conn.execute("SELECT COUNT(*) AS c FROM messages").fetchone()["c"]
    conn.close()
    return jsonify({"messages_received": count})
