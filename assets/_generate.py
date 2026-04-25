"""Generate placeholder app assets in the Hyperfocus brand palette.

Brand: ink-black (#07070a) background, electric-lime (#c5f82a) accent dot —
the same motif as the period in "Focus." in the UI. Re-run this script after
tweaking the constants to refresh assets.
"""
from PIL import Image, ImageDraw
from pathlib import Path

INK = (7, 7, 10)
LIME = (197, 248, 42)
ASSETS = Path(__file__).parent


def dot_canvas(size: int, dot_ratio: float, with_alpha: bool, bg=INK) -> Image.Image:
    """Square canvas with a centered lime dot. dot_ratio = dot diameter / canvas size."""
    mode = "RGBA" if with_alpha else "RGB"
    bg_fill = (0, 0, 0, 0) if with_alpha else bg
    img = Image.new(mode, (size, size), bg_fill)
    draw = ImageDraw.Draw(img)
    diameter = int(size * dot_ratio)
    offset = (size - diameter) // 2
    draw.ellipse(
        (offset, offset, offset + diameter, offset + diameter),
        fill=LIME if not with_alpha else LIME + (255,),
    )
    return img


def main() -> None:
    # iOS app icon — 1024x1024, NO alpha (Apple requirement)
    dot_canvas(1024, 0.22, with_alpha=False).save(ASSETS / "icon.png", "PNG")

    # Splash — large square, INK bg, small dot. Expo scales via imageWidth in app.json
    dot_canvas(1024, 0.18, with_alpha=False).save(ASSETS / "splash.png", "PNG")

    # Android adaptive icon — alpha-on, dot kept inside the 66% safe zone
    dot_canvas(1024, 0.40, with_alpha=True, bg=INK).save(
        ASSETS / "adaptive-icon.png", "PNG"
    )

    # Web favicon
    dot_canvas(64, 0.30, with_alpha=False).save(ASSETS / "favicon.png", "PNG")

    print("wrote: icon.png, splash.png, adaptive-icon.png, favicon.png")


if __name__ == "__main__":
    main()
