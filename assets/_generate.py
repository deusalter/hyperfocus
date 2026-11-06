"""Generate the Hyperfocus brand assets.

The mark is the app's central idea drawn literally: the runner mid-stride with
a ghost of itself just behind. Same character as the in-app Sprite (round head,
sausage limbs, headband), posed harder so it survives being 60px wide.

Colours come from src/lib/theme.ts. Run `python3 assets/_generate.py` after
changing anything here. Drawn at 4x and downsampled for clean curves.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).parent
SS = 4

ACCENT = (69, 106, 144)  # palette.accent #456a90
ACCENT_TOP = (84, 126, 168)
ACCENT_BOTTOM = (53, 82, 114)
PAPER = (246, 248, 248)
WARM = (232, 151, 90)  # palette.accent2, lifted a touch to hold against blue


def seg(draw, points, width, fill):
    """A polyline with round caps and joins."""
    draw.line(points, fill=fill, width=int(width), joint="curve")
    r = width / 2
    for x, y in points:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def runner(draw, cx, cy, s, body, band=None, face=None):
    """Draw the runner, facing right. (cx, cy) is the hip; s is px per unit."""

    def p(x, y):
        return (cx + x * s, cy + y * s)

    def pts(*coords):
        return [p(x, y) for x, y in coords]

    # back arm and back leg sit behind the torso
    seg(draw, pts((-4, -34), (-25, -24), (-29, -5)), 9.5 * s, body)
    seg(draw, pts((-3, -3), (-14, 19), (-40, 25)), 12 * s, body)

    # torso, leaning into the stride
    seg(draw, pts((0, -3), (6, -34)), 25 * s, body)

    # front leg with the knee driving forward
    seg(draw, pts((4, -2), (27, 11), (20, 41)), 12 * s, body)

    # front arm
    seg(draw, pts((10, -35), (27, -22), (41, -34)), 9.5 * s, body)

    # head
    hx, hy, hr = 12, -61, 18.5
    x, y = p(hx, hy)
    r = hr * s
    draw.ellipse((x - r, y - r, x + r, y + r), fill=body)

    if band is not None:
        # tails stream behind, then the band wraps the head on top of them
        seg(draw, pts((hx - 16, hy - 6), (hx - 29, hy - 12)), 4.4 * s, band)
        seg(draw, pts((hx - 16, hy - 4), (hx - 26, hy + 3)), 4.4 * s, band)
        y0 = hy - 8
        y1 = hy - 2.2
        draw.rounded_rectangle(
            (*p(hx - hr + 0.2, y0), *p(hx + hr - 0.2, y1)),
            radius=2.2 * s,
            fill=band,
        )

    if face is not None:
        for ex in (hx + 2.5, hx + 11):
            ex_, ey_ = p(ex, hy + 3.5)
            er = 2.6 * s
            draw.ellipse((ex_ - er, ey_ - er, ex_ + er, ey_ + er), fill=face)
        draw.arc(
            (*p(hx + 1.5, hy + 3), *p(hx + 12, hy + 12.5)),
            start=25,
            end=155,
            fill=face,
            width=max(1, int(2.2 * s)),
        )


def ghost(size, cx, cy, s, color, alpha):
    """The past self, as its own layer so it composites cleanly."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    runner(ImageDraw.Draw(layer), cx, cy, s, color + (255,))
    faded = layer.getchannel("A").point(lambda v: int(v * alpha))
    layer.putalpha(faded)
    return layer


def gradient(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x * 0.25 + y * 0.75) / size
            px[x, y] = tuple(
                int(a + (b - a) * t) for a, b in zip(ACCENT_TOP, ACCENT_BOTTOM)
            )
    return img


def icon(size=1024):
    S = size * SS
    img = Image.new("RGB", (S, S))
    img.paste(gradient(size).resize((S, S), Image.BILINEAR))

    unit = S / 1024 * 5.5
    hip_x, hip_y = S * 0.585, S * 0.575

    # the track both runners share
    track = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ty = hip_y + 47 * unit
    ImageDraw.Draw(track).rounded_rectangle(
        (S * 0.13, ty, S * 0.87, ty + 9 * SS), radius=5 * SS, fill=PAPER + (70,)
    )
    img.paste(track, (0, 0), track)

    past = ghost(S, hip_x - 45 * unit, hip_y, unit, PAPER, 0.26)
    img.paste(past, (0, 0), past)

    draw = ImageDraw.Draw(img)
    runner(draw, hip_x, hip_y, unit, PAPER, band=WARM, face=ACCENT)
    return img.resize((size, size), Image.LANCZOS)


def icon_dark(size=1024):
    """Same drawing on a dark ground, for the Home Screen in dark mode."""
    S = size * SS
    top, bottom = (39, 46, 54), (20, 24, 28)
    ground = Image.new("RGB", (size, size))
    px = ground.load()
    for y in range(size):
        for x in range(size):
            t = (x * 0.25 + y * 0.75) / size
            px[x, y] = tuple(int(a + (b - a) * t) for a, b in zip(top, bottom))
    img = ground.resize((S, S), Image.BILINEAR)

    body = (143, 180, 218)  # dark theme accent
    unit = S / 1024 * 5.5
    hip_x, hip_y = S * 0.585, S * 0.575
    past = ghost(S, hip_x - 45 * unit, hip_y, unit, body, 0.26)
    img.paste(past, (0, 0), past)
    runner(ImageDraw.Draw(img), hip_x, hip_y, unit, body, band=WARM, face=(16, 22, 28))
    return img.resize((size, size), Image.LANCZOS)


def icon_tinted(size=1024):
    """Greyscale on black. iOS applies the user's tint colour to it."""
    S = size * SS
    img = Image.new("RGB", (S, S), (0, 0, 0))
    unit = S / 1024 * 5.5
    hip_x, hip_y = S * 0.585, S * 0.575
    past = ghost(S, hip_x - 45 * unit, hip_y, unit, (255, 255, 255), 0.3)
    img.paste(past, (0, 0), past)
    runner(ImageDraw.Draw(img), hip_x, hip_y, unit, (255, 255, 255), band=(150, 150, 150), face=(0, 0, 0))
    return img.resize((size, size), Image.LANCZOS)


def transparent_runner(size, fit, body, band=None, face=None, past_alpha=None):
    """Runner on transparency. `fit` is the fraction of the canvas it may use."""
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # the figure is roughly 125 units tall
    unit = S * fit / 125
    hip_x, hip_y = S * 0.52, S * 0.555
    if past_alpha is not None:
        hip_x += 12 * unit
        past = ghost(S, hip_x - 45 * unit, hip_y, unit, body, past_alpha)
        img.alpha_composite(past)
    draw = ImageDraw.Draw(img)
    runner(
        draw,
        hip_x,
        hip_y,
        unit,
        body + (255,),
        band=(band + (255,)) if band else None,
        face=(face + (255,)) if face else None,
    )
    return img.resize((size, size), Image.LANCZOS)


def main():
    # App Store icon: 1024x1024 with no alpha channel, or App Store Connect rejects it.
    icon().convert("RGB").save(ASSETS / "icon.png", "PNG")
    icon_dark().convert("RGB").save(ASSETS / "icon-dark.png", "PNG")
    icon_tinted().convert("RGB").save(ASSETS / "icon-tinted.png", "PNG")

    # Splash mark on a transparent canvas. The background comes from app.json,
    # so launch hands straight off to the app's ground colour with no flash.
    transparent_runner(1024, 0.78, ACCENT, band=WARM, face=PAPER, past_alpha=0.2).save(
        ASSETS / "splash-icon.png", "PNG"
    )

    # Android adaptive foreground: launchers crop to the centre 66%.
    transparent_runner(1024, 0.52, PAPER, band=WARM, face=ACCENT, past_alpha=0.26).save(
        ASSETS / "adaptive-icon.png", "PNG"
    )

    icon(64).convert("RGB").save(ASSETS / "favicon.png", "PNG")
    print("wrote: icon.png, icon-dark.png, icon-tinted.png, splash-icon.png, adaptive-icon.png, favicon.png")


if __name__ == "__main__":
    main()
