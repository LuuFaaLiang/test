"""
Application entry point.

Run locally with:
    python app.py
"""

import logging
import os
import sqlite3

from flask import Flask, render_template

from config import Config


def init_db(app: Flask) -> None:
    """Creates the SQLite database and messages table if they don't exist yet."""
    os.makedirs(os.path.dirname(app.config["DATABASE_PATH"]), exist_ok=True)
    conn = sqlite3.connect(app.config["DATABASE_PATH"])
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    init_db(app)

    # Optional Flask-Mail setup (only activates if credentials are present)
    if app.config.get("MAIL_USERNAME") and app.config.get("MAIL_PASSWORD"):
        from flask_mail import Mail

        Mail(app)

    # Blueprints
    from routes.home import home_bp
    from routes.contact import contact_bp
    from routes.api import api_bp

    app.register_blueprint(home_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(api_bp)

    @app.errorhandler(404)
    def not_found(_e):
        return render_template("404.html"), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        return render_template("405.html"), 405

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])
