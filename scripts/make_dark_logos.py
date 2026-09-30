"""
Make light ("negative") versions of the partner logos for the dark home page.

    python scripts/make_dark_logos.py      (needs: pip install pillow numpy)

The source logos in public/images/ are dark marks on white. This writes
public/images/dark/<name>.png with a transparent background:

  * Tampere University, Research Council of Finland, T-Winning Spaces 2035:
    the one-colour mark becomes white.
  * Funded by the EU: the text becomes white, while the flag keeps its
    official colours and gets the thin white border that the EU emblem rules
    ask for on dark backgrounds (1/25 of the flag height).
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images"
OUT = SRC / "dark"
MAX_WIDTH = 1200  # plenty for the ~260 px wide cards on high-density screens


def on_white(path: Path) -> np.ndarray:
    """The logo as RGB on white paper (transparent areas become white)."""
    img = Image.open(path).convert("RGBA")
    return np.asarray(Image.alpha_composite(Image.new("RGBA", img.size, "white"), img).convert("RGB"))


def ink(rgb: np.ndarray) -> np.ndarray:
    """How far each pixel is from white, 0..255 (0 = white paper)."""
    return (255 - rgb.min(axis=2)).astype(float)


def to_white(rgb: np.ndarray, full_at: float) -> np.ndarray:
    """White mark whose opacity follows the ink (keeps anti-aliased edges)."""
    alpha = np.clip(ink(rgb) / full_at, 0, 1)
    out = np.zeros(rgb.shape[:2] + (4,), np.uint8)
    out[..., :3] = 255
    out[..., 3] = (alpha * 255).round().astype(np.uint8)
    return out


def flag_box(rgb: np.ndarray):
    """Bounding box of the EU flag: the large saturated blue block on the left."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    blue = (b > 120) & (r < 60) & (g < 110) & (b - r > 90)
    cols = np.where(blue.mean(axis=0) > 0.5)[0]
    rows = np.where(blue[:, cols.min() : cols.max() + 1].mean(axis=1) > 0.5)[0]
    return rows.min(), rows.max() + 1, cols.min(), cols.max() + 1


def crop_to_content(img: Image.Image, pad: int) -> Image.Image:
    box = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        return img
    l, t, r, b = box
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))


def save(img: Image.Image, name: str):
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / name, optimize=True)
    print(f"{name}: {img.width}x{img.height}")


def main():
    for name in ("Tampere_uni_logo.png", "logo2.png", "T-winning_logo_green.png"):
        rgb = on_white(SRC / name)
        full_at = np.percentile(ink(rgb)[ink(rgb) > 40], 50)  # the mark's own colour -> fully opaque
        save(crop_to_content(Image.fromarray(to_white(rgb, full_at)), pad=4), name)

    name = "logo1.png"
    rgb = np.asarray(Image.open(SRC / name).convert("RGB"))
    out = to_white(rgb, full_at=150)  # blue and grey text both become solid white
    t, b, l, r = flag_box(rgb)
    border = max(2, round((b - t) / 25))
    # white border, then the flag in its own colours
    out[max(0, t - border) : b + border, max(0, l - border) : r + border] = [255, 255, 255, 255]
    out[t:b, l:r, :3] = rgb[t:b, l:r]
    out[t:b, l:r, 3] = 255
    save(crop_to_content(Image.fromarray(out), pad=4), name)


if __name__ == "__main__":
    main()
