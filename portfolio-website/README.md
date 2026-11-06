# Lianghok — Personal Portfolio Website

A modern, animated personal portfolio for Lianghok, a first-year Information Technology
student at the National University of Management (NUM), Cambodia. Built as a Flask
backend serving a single-page, responsive, dark-mode-aware frontend.

## Features

- **Hero** with typing effect (Typed.js), floating gradient blobs, and glassmorphism nav
- **About** section with an animated timeline and stat counters
- **Skills** with animated progress bars and a tool grid
- **Projects** with live search, technology filtering, and tech badges
- **Education** timeline
- **Certificates** gallery with category filters
- **Experience** cards (volunteer work, personal projects, hackathon goals, open source)
- **Contact form** with client-side + server-side (regex) validation, stored in SQLite
- **Resume page** with embedded PDF preview, download and print buttons
- Dark/light mode toggle with saved preference (`localStorage`)
- Scroll progress bar, scroll-spy navigation, back-to-top button
- Fully responsive: desktop, tablet, and mobile
- Custom 404 / 405 error pages
- Basic SEO: meta tags, Open Graph tags, `robots.txt`, `sitemap.xml`
- Accessible: keyboard-navigable, ARIA labels on icon buttons, `prefers-reduced-motion` support

## Tech stack

**Frontend:** HTML5, Tailwind CSS (CDN), vanilla JavaScript, AOS scroll animations,
Typed.js, Font Awesome icons.

**Backend:** Python, Flask, Flask Blueprints, Flask-Mail (optional email notifications),
SQLite, regex-based form validation, Python `logging`.

## Folder structure

```
portfolio-website/
├── app.py                 # App factory, DB init, blueprint registration, error handlers
├── config.py               # Configuration (secret key, mail, paths)
├── requirements.txt
├── README.md
│
├── database/
│   └── portfolio.db        # Created automatically on first run
│
├── routes/
│   ├── home.py              # Home page, resume page, CV download
│   ├── contact.py           # Contact form endpoint + validation + SQLite insert
│   └── api.py               # /api/stats, /api/messages (admin JSON)
│
├── templates/
│   ├── base.html            # Layout, nav, footer, CDN includes
│   ├── index.html           # All portfolio sections
│   ├── resume.html
│   ├── 404.html
│   └── 405.html
│
├── static/
│   ├── css/style.css
│   ├── js/main.js
│   ├── robots.txt
│   └── sitemap.xml
│
├── uploads/
│   └── resume.pdf           # Replace with your real CV
│
└── utils/
    └── validation.py        # Name / email / subject / message / phone regex validators
```

## Requirements

- Python 3.10+
- pip

## Run locally

```bash
# 1. Clone or unzip the project, then move into it
cd portfolio-website

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Optional) enable email notifications for contact form messages
export MAIL_USERNAME="you@gmail.com"
export MAIL_PASSWORD="your-app-password"

# 5. Run the app
python app.py
```

Visit **http://127.0.0.1:5000** in your browser. The SQLite database and the `uploads`
folder are created automatically if they don't exist.

Replace `uploads/resume.pdf` with your real CV, and update the placeholder GitHub/demo
links and social links in `templates/index.html` and `templates/base.html`.

## Deploy to GitHub

```bash
git init
git add .
git commit -m "Initial commit: portfolio website"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploy to Render

1. Push the project to GitHub (see above).
2. On [Render](https://render.com), create a **New Web Service** and connect the repo.
3. Set:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app` (add `gunicorn` to `requirements.txt` first)
4. Add `MAIL_USERNAME` / `MAIL_PASSWORD` as environment variables if you want email
   notifications for contact form submissions.
5. Deploy — Render will give you a live URL.

## Admin: viewing contact messages

Stored messages can be inspected via the JSON API while the app is running:

- `GET /api/messages` — list all messages, newest first
- `DELETE /api/messages/<id>` — delete a message
- `GET /api/stats` — total message count

(These are intentionally left unauthenticated for local/demo use — add login
protection before exposing them publicly.)

## 3D animated developer hero

The hero's right side shows a stylized 3D Lianghok (swept black hair, white shirt, red tie)
typing Python on a monitor at a desk. It is built with **Three.js from a CDN** — no Node build step.

| File | Job |
|---|---|
| `static/js/dev-hero.js` | Decides *if/when* to run: checks reduced-motion, low-power devices, WebGL; lazy-loads Three.js when the hero is near the viewport; pauses when off-screen/tab hidden; drops to the fallback if frames get slow. |
| `static/js/dev-scene.js` | Builds the room, desk, chair, monitor, character and all animation (typing, blinking, breathing, head movement, code typing on screen, light pulses). |
| `static/images/face-texture.png` | Your face cut-out, projected onto the 3D head. |
| `static/css/upgrade.css` (bottom) | `.dev-stage` panel, loader and fallback styles. |
| `templates/index.html` | Hero markup, import map and the module script tag. |

**Fallback:** if 3D can't run (old browser, no WebGL, low-power device, slow frames, load error) the
original portrait card is shown instead. With *reduced motion* on, one still frame is rendered.

**How the animation works:** each arm uses two-bone inverse kinematics, so the hands move over the
keyboard and the elbows follow naturally. Typing happens in bursts with pauses, fingers curl on
different rhythms, and the on-screen code types itself out and scrolls.

**Likeness:** your real face is used. `static/images/face-texture.png` is a cut-out of `profile.jpg`
(blue background and ears removed, soft edges) projected onto the front of the 3D head, so your eyes,
brows, nose and mouth are yours. The nose is a small 3D bump carrying the photo's nose so the 3/4 view
has a real profile, and blinking uses skin-toned eyelids. If the texture fails to load, a simple drawn
face is shown instead. To use a different photo, edit the measurements at the top of
`tools/make_face_texture.py` and run `python tools/make_face_texture.py`.

**Honest limitation:** the body is a stylized procedural character, and the face is a flat photo
projection (it can't change expression and looks best within about 45 degrees of front-on), not a
photo-realistic scan. A single
portrait cannot produce a fully rigged realistic 3D human. To upgrade to a true likeness:
1. Create an avatar from `static/images/profile.jpg` (e.g. Ready Player Me, or MetaPerson / Character Creator).
2. Export a rigged `.glb`, then add a seated typing clip from Mixamo (or animate in Blender).
3. Load it with `GLTFLoader` + `AnimationMixer` in `dev-scene.js` in place of the `CHARACTER` block.

Tweak the camera in `dev-scene.js` (`CAM_BASE`, `CAM_TARGET`), the screen code in `CODE`, and
colors in the `M` materials table. Pinned Three.js version: set in the import map in `index.html`.

## Notes & next steps

This build focuses on a clean, working core. Natural extensions if you want to keep
going: a live GitHub contributions graph via the GitHub API, a password-protected
admin dashboard for messages, Khmer-language toggle, and a proper image gallery once
real project screenshots are available.


## Latest upgrade

- New studio portrait used for the hero fallback card, About section, favicon and social share image (`static/images/og-image.jpg`).
- 3D hero character updated to match the photo (black shirt, no tie); face texture regenerated with `tools/make_face_texture.py`.
- New **Pay / KHQR** section (`#pay`): scannable ABA KHQR, "Pay with ABA" button, save-QR and copy-link buttons, tap-to-enlarge dialog.
