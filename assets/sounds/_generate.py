"""Generate the focus sounds. Everything here is synthesised, so there is nothing to license.

Each track is built in the frequency domain. An inverse FFT is periodic over its
own length by construction, so the last sample flows straight into the first and
the loop has no seam to hide. The one thing left to guard against is the player:
iOS restarts a looping file with a tiny gap, so both ends get a very short fade.
That turns what would be a click into a dip too small to notice, every 3 minutes.

Run: python3 assets/sounds/_generate.py  (needs numpy; encodes with macOS afconvert)
"""
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

OUT = Path(__file__).parent
RATE = 44100
SECONDS = 180
N = RATE * SECONDS
TARGET_RMS_DB = -20.0
SEAM_FADE_MS = 12


def shaped_noise(rng, curve):
    """White noise reshaped by `curve(freqs)`. Periodic over N samples."""
    freqs = np.fft.rfftfreq(N, 1 / RATE)
    spectrum = rng.normal(size=freqs.size) + 1j * rng.normal(size=freqs.size)
    spectrum *= curve(freqs)
    spectrum[0] = 0  # no DC offset
    return np.fft.irfft(spectrum, n=N)


def highpass(freqs, corner):
    """Gentle roll-off below `corner`: rumble below this is felt, not heard."""
    return 1 / np.sqrt(1 + (corner / np.maximum(freqs, 1e-3)) ** 4)


def lowpass(freqs, corner):
    return 1 / np.sqrt(1 + (freqs / corner) ** 4)


def brown_curve(freqs):
    # Power falling as 1/f^2 is what makes this deep and soft instead of hissy.
    return highpass(freqs, 28) / np.maximum(freqs, 1.0)


def pink_curve(freqs):
    # Equal energy per octave: the steady-rain sound. Top end eased off to reduce hiss.
    return highpass(freqs, 35) * lowpass(freqs, 11000) / np.sqrt(np.maximum(freqs, 1.0))


def body_curve(freqs):
    return highpass(freqs, 40) * lowpass(freqs, 900) / np.maximum(freqs, 1.0) ** 0.75


def foam_curve(freqs):
    return highpass(freqs, 1800) * lowpass(freqs, 8000) / np.sqrt(np.maximum(freqs, 1.0))


def waves(rng):
    """Slow swells. Whole numbers of cycles per loop keep the envelope periodic too."""
    phase = np.arange(N) / N
    long_swell = 0.5 + 0.5 * np.sin(2 * np.pi * 16 * phase)  # about 11s
    short_swell = 0.5 + 0.5 * np.sin(2 * np.pi * 23 * phase + 1.3)  # about 8s
    swell = (0.65 * long_swell + 0.35 * short_swell) ** 1.6

    body = shaped_noise(rng, body_curve)
    body /= np.std(body)
    foam = shaped_noise(rng, foam_curve)
    foam /= np.std(foam)
    # the hiss arrives just after the swell peaks, the way a wave breaks
    lagged = np.roll(swell, int(1.3 * RATE))
    return body * (0.35 + 0.65 * swell) + foam * 0.28 * lagged**3


def normalize(left, right):
    stereo = np.stack([left, right])
    rms = np.sqrt(np.mean(stereo**2))
    stereo *= 10 ** (TARGET_RMS_DB / 20) / rms
    peak = np.abs(stereo).max()
    if peak > 0.89:  # -1 dBFS leaves room for the encoder to overshoot
        stereo *= 0.89 / peak
    return stereo


def fade_seam(stereo):
    fade = int(RATE * SEAM_FADE_MS / 1000)
    ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fade))
    stereo[:, :fade] *= ramp
    stereo[:, -fade:] *= ramp[::-1]
    return stereo


def write_m4a(stereo, name):
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16).T
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / f"{name}.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(pcm.tobytes())
        subprocess.run(
            ["afconvert", str(wav_path), "-o", str(OUT / f"{name}.m4a"), "-f", "m4af", "-d", "aac", "-b", "64000", "-q", "127"],
            check=True,
        )


def main():
    tracks = {
        # separate seeds per channel: decorrelated ears sound wide, not inside your head
        "brown": lambda rng: shaped_noise(rng, brown_curve),
        "pink": lambda rng: shaped_noise(rng, pink_curve),
        "waves": waves,
    }
    for i, (name, make) in enumerate(tracks.items()):
        left = make(np.random.default_rng(1000 + i))
        right = make(np.random.default_rng(2000 + i))
        write_m4a(fade_seam(normalize(left, right)), name)
        print("wrote", name)


if __name__ == "__main__":
    main()
