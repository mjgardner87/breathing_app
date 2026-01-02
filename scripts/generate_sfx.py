#!/usr/bin/env python3
"""Generate lightweight audio cues for Innerfire.

Usage:
    python scripts/generate_sfx.py breath <output_path> <duration_seconds> <direction>
    python scripts/generate_sfx.py bell <output_path> <duration_seconds> [frequency_hz]
"""

from __future__ import annotations

import math
import random
import struct
import sys
import wave
from pathlib import Path

SAMPLE_RATE = 44100


def _write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(path.as_posix(), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            clipped = max(-1.0, min(1.0, sample))
            frames.extend(struct.pack("<h", int(clipped * 32767)))
        wav_file.writeframes(frames)


def _apply_fade(samples: list[float], fade_seconds: float = 0.08) -> None:
    fade_samples = int(min(len(samples) / 2, SAMPLE_RATE * fade_seconds))
    if fade_samples <= 0:
        return

    for i in range(fade_samples):
        factor = i / fade_samples
        samples[i] *= factor
        samples[-(i + 1)] *= factor


def generate_breath(path: Path, duration: float, direction: str) -> None:
    seed = 42 if direction == "inhale" else 84
    random.seed(seed)

    total_samples = int(SAMPLE_RATE * duration)
    smoothing = 0.92
    low_pass = 0.0
    samples: list[float] = []

    for i in range(total_samples):
        progress = i / total_samples if total_samples else 0.0
        envelope = (progress ** 0.55) if direction == "inhale" else ((1 - progress) ** 0.6)
        envelope = max(0.0, min(1.0, envelope))

        noise = random.uniform(-1, 1)
        low_pass = smoothing * low_pass + (1 - smoothing) * noise
        gentle_pulse = 0.12 * math.sin(progress * math.pi)
        sample = (low_pass * 0.85 + gentle_pulse) * envelope
        samples.append(sample * 0.8)

    _apply_fade(samples)
    _write_wav(path, samples)


def generate_singing_bowl(path: Path, duration: float, frequency: float = 293.66) -> None:
    """Generate a realistic Tibetan singing bowl sound.

    Tibetan singing bowls have distinctive non-harmonic partials that create
    their characteristic warm, meditative tone. The partials follow specific
    ratios based on actual bowl acoustic analysis.

    Args:
        path: Output WAV file path
        duration: Sound duration in seconds
        frequency: Fundamental frequency (default D4 = 293.66 Hz, common meditation bowl)
    """
    total_samples = int(SAMPLE_RATE * duration)
    samples: list[float] = []

    # Tibetan bowl characteristic partial ratios (based on acoustic analysis)
    # These are NOT harmonic - they create the distinctive "singing" quality
    f1 = frequency * 1.0     # Fundamental
    f2 = frequency * 2.71    # First partial (NOT octave)
    f3 = frequency * 4.45    # Second partial
    f4 = frequency * 6.26    # Third partial
    f5 = frequency * 8.05    # Fourth partial

    for i in range(total_samples):
        t = i / SAMPLE_RATE

        # Complex envelope with initial strike and long sustain
        attack = 0.003  # Very quick attack (3ms)
        if t < attack:
            envelope = t / attack
        else:
            # Multi-stage decay for realistic bowl sustain
            # Fast initial decay + slow sustain creates the "singing" effect
            decay1 = math.exp(-1.2 * (t - attack))   # Fast initial decay
            decay2 = math.exp(-0.25 * (t - attack))  # Slow sustain
            envelope = 0.3 * decay1 + 0.7 * decay2

        # Subtle frequency modulation (beating) - creates the "wobble" effect
        beat_rate = 0.5  # Hz - slow beating
        beat_depth = 0.003
        freq_mod = 1 + beat_depth * math.sin(2 * math.pi * beat_rate * t)

        # Combine partials with bowl-specific amplitudes
        # Lower partials are stronger, higher ones add shimmer
        sample = (
            1.0 * math.sin(2 * math.pi * f1 * freq_mod * t) +
            0.7 * math.sin(2 * math.pi * f2 * freq_mod * t) +
            0.5 * math.sin(2 * math.pi * f3 * t) +
            0.3 * math.sin(2 * math.pi * f4 * t) +
            0.15 * math.sin(2 * math.pi * f5 * t)
        ) * envelope * 0.4  # Keep volume gentle

        samples.append(sample)

    _apply_fade(samples, fade_seconds=0.02)
    _write_wav(path, samples)


def generate_bell(path: Path, duration: float, frequency: float = 293.66) -> None:
    """Generate a Tibetan singing bowl sound (alias for generate_singing_bowl)."""
    generate_singing_bowl(path, duration, frequency)


def _print_usage() -> None:
    print(
        "Usage:\n"
        "  python scripts/generate_sfx.py breath <output_path> <duration_seconds> <direction>\n"
        "  python scripts/generate_sfx.py bell <output_path> <duration_seconds> [frequency_hz]\n"
        "  python scripts/generate_sfx.py singing_bowl <output_path> <duration_seconds> [frequency_hz]",
        file=sys.stderr,
    )


def main() -> int:
    if len(sys.argv) < 4:
        _print_usage()
        return 1

    mode = sys.argv[1]
    output = Path(sys.argv[2])

    try:
        duration = float(sys.argv[3])
    except ValueError:
        print("Duration must be a number", file=sys.stderr)
        return 1

    if mode == "breath":
        if len(sys.argv) < 5:
            _print_usage()
            return 1
        direction = sys.argv[4].lower()
        if direction not in {"inhale", "exhale"}:
            print("Direction must be 'inhale' or 'exhale'", file=sys.stderr)
            return 1
        generate_breath(output, duration, direction)
        print(f"Created breath sound: {output}")
        return 0

    if mode == "bell":
        frequency = float(sys.argv[4]) if len(sys.argv) > 4 else 293.66
        generate_bell(output, duration, frequency)
        print(f"Created bell sound: {output}")
        return 0

    if mode == "singing_bowl":
        frequency = float(sys.argv[4]) if len(sys.argv) > 4 else 293.66
        generate_singing_bowl(output, duration, frequency)
        print(f"Created singing bowl sound: {output}")
        return 0

    _print_usage()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())






