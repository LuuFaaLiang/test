"""
Public-facing pages: the one-page portfolio plus the resume viewer.
"""

import logging
import os

from flask import Blueprint, current_app, render_template, send_from_directory

logger = logging.getLogger(__name__)

home_bp = Blueprint("home", __name__)

PROJECTS = [
    {
        "title": "Student Grade Management System",
        "description": "A desktop-style app for teachers to record, calculate and export student grades, with automatic GPA calculation.",
        "tech": ["Python", "SQLite", "Tkinter"],
        "github": "#",
        "demo": "#",
        "image": "grade-system.svg",
    },
    {
        "title": "KASI Agriculture Marketplace",
        "description": "A concept marketplace connecting Cambodian farmers directly with buyers, with listings, search and simple messaging.",
        "tech": ["Flask", "SQLite", "Tailwind"],
        "github": "#",
        "demo": "#",
        "image": "kasi-marketplace.svg",
    },
    {
        "title": "Library Management System",
        "description": "Book catalogue, borrowing/return tracking and overdue reminders for a small school library.",
        "tech": ["Python", "MySQL"],
        "github": "#",
        "demo": "#",
        "image": "library-system.svg",
    },
    {
        "title": "Happy Birthday Website",
        "description": "A playful animated birthday page with confetti, music and a countdown, built to learn CSS animation.",
        "tech": ["HTML", "CSS", "JavaScript"],
        "github": "#",
        "demo": "#",
        "image": "birthday-site.svg",
    },
    {
        "title": "Habit Tracker",
        "description": "A minimal daily habit tracker with streak counting and local storage, no backend required.",
        "tech": ["JavaScript", "HTML", "CSS"],
        "github": "#",
        "demo": "#",
        "image": "habit-tracker.svg",
    },
    {
        "title": "Student Attendance System",
        "description": "QR-code based attendance logging for classrooms, with a teacher dashboard and CSV export.",
        "tech": ["Flask", "SQLite", "Python"],
        "github": "#",
        "demo": "#",
        "image": "attendance-system.svg",
    },
    {
        "title": "Kampong Thom Tourism Website",
        "description": "An informational site showcasing attractions, food and travel tips for Kampong Thom province.",
        "tech": ["HTML", "CSS", "JavaScript"],
        "github": "#",
        "demo": "#",
        "image": "tourism-site.svg",
    },
]

CERTIFICATES = [
    {"title": "Python Programming Fundamentals", "category": "Programming", "issuer": "Self-paced course"},
    {"title": "Responsive Web Design", "category": "Design", "issuer": "Self-paced course"},
    {"title": "Introduction to Networking", "category": "Networking", "issuer": "Self-paced course"},
    {"title": "English for IT Professionals", "category": "Languages", "issuer": "Self-paced course"},
]


@home_bp.route("/")
def index():
    return render_template(
        "index.html",
        projects=PROJECTS,
        certificates=CERTIFICATES,
    )


@home_bp.route("/resume")
def resume():
    return render_template("resume.html")


@home_bp.route("/download-cv")
def download_cv():
    logger.info("CV download requested")
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    filename = "resume.pdf"
    if not os.path.exists(os.path.join(upload_dir, filename)):
        logger.warning("resume.pdf not found in uploads folder")
    return send_from_directory(upload_dir, filename, as_attachment=True)
