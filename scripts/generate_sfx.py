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


def generate_bell(path: Path, duration: float, frequency: float) -> None:
    total_samples = int(SAMPLE_RATE * duration)
    samples: list[float] = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        envelope = math.exp(-3.5 * t / duration)
        fundamental = math.sin(2 * math.pi * frequency * t)
        harmonic = 0.4 * math.sin(2 * math.pi * frequency * 2.01 * t)
        shimmer = 0.2 * math.sin(2 * math.pi * frequency * 2.51 * t)
        sample = (fundamental + harmonic + shimmer) * envelope * 0.7
        samples.append(sample)

    _apply_fade(samples, fade_seconds=0.2)
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
        frequency = float(sys.argv[4]) if len(sys.argv) > 4 else 432.0
        generate_bell(output, duration, frequency)
        print(f"Created bell sound: {output}")
        return 0

    _print_usage()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
