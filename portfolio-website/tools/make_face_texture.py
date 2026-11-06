"""
Regenerates static/images/face-texture.png from a portrait (default: static/images/profile.jpg).

The 3D head projects this texture onto its front, so the crop must match the head's
proportions. The numbers below were measured for profile.jpg (640x640, eyes at y~191,
face centre x~320, 0.00129 m per pixel). For a NEW photo, re-measure these:
  - CROP = (left, top, right, bottom) in pixels. Width/height should be ~equal;
    left/right are +-132 px from the face centre, top is ~73 px above the eye line,
    bottom is ~193 px below it.
  - OUTLINE_* = per-row face edge (x) in photo pixels, EXCLUDING ears, from forehead to chin.
Run:  python tools/make_face_texture.py [photo.jpg]
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "static/images/profile.jpg"
OUT = "static/images/face-texture.png"
CROP = (193, 111, 437, 329)
# (y, left_x) / (y, right_x) pairs along the face edge, top to bottom
OUTLINE_L = [(111,238),(120,232),(134,225),(162,222),(199,222),(235,226),(254,226),(272,231),(291,238),(300,250),(306,275),(310,300),(312,317)]
OUTLINE_R = [(111,390),(120,396),(134,401),(162,406),(199,406),(235,404),(254,403),(272,397),(291,390),(300,380),(306,358),(310,335),(312,320)]

x0, y0, x1, y1 = CROP
crop = Image.open(SRC).convert("RGB").crop(CROP)
W, H = crop.size
pts = [(x - x0, y - y0) for y, x in OUTLINE_L] + [(x - x0, y - y0) for y, x in reversed(OUTLINE_R)]
mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask).polygon(pts, fill=255)
a = np.asarray(mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(4))).astype(float) / 255

# remove blue background spill (a studio-blue backdrop is assumed)
rgb = np.asarray(crop).astype(int)
blue = ((rgb[..., 2] > rgb[..., 0] + 50) & (rgb[..., 2] > rgb[..., 1] + 5)).astype("uint8") * 255
blue = np.asarray(Image.fromarray(blue).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))).astype(float) / 255
a *= 1 - blue
a *= np.clip(np.arange(H) / 18.0, 0, 1)[:, None]
a *= np.clip((H - 1 - np.arange(H)) / 10.0, 0, 1)[:, None]  # soften the chin edge  # fade the top so it blends into the 3D hair

out = np.dstack([rgb.astype("uint8"), (a * 255).astype("uint8")])
Image.fromarray(out, "RGBA").resize((512, 512), Image.LANCZOS).save(OUT, optimize=True)
print("wrote", OUT)
