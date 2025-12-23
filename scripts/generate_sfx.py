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


def generate_bell(path: Path, duration: float, frequency: float = 880.0) -> None:
    """Generate a realistic bell/chime sound with rich harmonics and natural decay."""
    total_samples = int(SAMPLE_RATE * duration)
    samples: list[float] = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE

        # Natural exponential decay envelope with slight attack
        attack_time = 0.05  # Quick attack
        if t < attack_time:
            attack_envelope = t / attack_time
        else:
            attack_envelope = 1.0
        decay_envelope = math.exp(-2.8 * t / duration) * attack_envelope

        # Rich harmonic series for bell-like timbre
        # Fundamental (880 Hz - A5 note, pleasant and clear)
        fundamental = math.sin(2 * math.pi * frequency * t)

        # Harmonic series typical of bells
        harmonic2 = 0.5 * math.sin(2 * math.pi * frequency * 2.0 * t)  # Octave
        harmonic3 = 0.35 * math.sin(2 * math.pi * frequency * 3.0 * t)  # Perfect fifth above octave
        harmonic4 = 0.25 * math.sin(2 * math.pi * frequency * 4.0 * t)  # Two octaves
        harmonic5 = 0.15 * math.sin(2 * math.pi * frequency * 5.76 * t)  # Slight detune for shimmer

        # Add subtle inharmonic partials for metallic character
        inharmonic1 = 0.12 * math.sin(2 * math.pi * frequency * 2.76 * t)
        inharmonic2 = 0.08 * math.sin(2 * math.pi * frequency * 4.24 * t)

        # Combine all components with natural decay
        sample = (
            fundamental +
            harmonic2 +
            harmonic3 +
            harmonic4 +
            harmonic5 +
            inharmonic1 +
            inharmonic2
        ) * decay_envelope * 0.65  # Slightly quieter for pleasant listening

        samples.append(sample)

    # Apply smooth fade to prevent clicks
    _apply_fade(samples, fade_seconds=0.15)
    _write_wav(path, samples)


def _print_usage() -> None:
    print(
        "Usage:\n"
        "  python scripts/generate_sfx.py breath <output_path> <duration_seconds> <direction>\n"
        "  python scripts/generate_sfx.py bell <output_path> <duration_seconds> [frequency_hz]",
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
        frequency = float(sys.argv[4]) if len(sys.argv) > 4 else 880.0
        generate_bell(output, duration, frequency)
        print(f"Created bell sound: {output}")
        return 0

    _print_usage()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())






