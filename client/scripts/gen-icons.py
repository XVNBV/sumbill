"""Generate PWA icons (192 & 512) from public/logo.png.

Usage (from client/):
    python scripts/gen-icons.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "logo.png"
OUT_DIR = ROOT / "public" / "icons"
SIZES = (192, 512)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGBA")
    for size in SIZES:
        icon = src.resize((size, size), Image.LANCZOS)
        dest = OUT_DIR / f"icon-{size}.png"
        icon.save(dest, format="PNG", optimize=True)
        print(f"wrote {dest.relative_to(ROOT)} ({size}x{size})")


if __name__ == "__main__":
    main()
