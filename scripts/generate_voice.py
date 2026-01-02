#!/usr/bin/env python3
"""Generate high-quality voice prompts using Microsoft Edge TTS.

This script uses edge-tts, a free neural text-to-speech service that
produces natural, calm voices suitable for meditation apps.

Install: pip install edge-tts

Usage:
    python scripts/generate_voice.py <output_dir>
"""

from __future__ import annotations

import asyncio
import subprocess
import sys
from pathlib import Path


# Voice configuration for calm meditation style
# en-AU-NatashaNeural: Australian female, warm and calming
VOICE = "en-AU-NatashaNeural"
RATE = "-15%"   # Slower for calming effect
PITCH = "-5Hz"  # Slightly lower pitch

# Voice prompts to generate
PROMPTS = {
    "hold_breath": "Hold your breath",
    "recovery_breath": "Take a deep breath in, and hold",
    "release": "Release",
    "round_complete": "Round complete",
}


async def generate_voice_file(text: str, output_path: Path) -> bool:
    """Generate a voice file using edge-tts.

    Args:
        text: The text to speak
        output_path: Output WAV file path

    Returns:
        True if successful, False otherwise
    """
    try:
        # Import edge_tts inside the function to handle import errors gracefully
        import edge_tts

        communicate = edge_tts.Communicate(
            text,
            VOICE,
            rate=RATE,
            pitch=PITCH,
        )

        # Generate to a temporary MP3 first (edge-tts outputs MP3)
        mp3_path = output_path.with_suffix(".mp3")

        await communicate.save(str(mp3_path))

        # Convert MP3 to WAV using ffmpeg or sox
        if _convert_to_wav(mp3_path, output_path):
            mp3_path.unlink()  # Clean up MP3
            return True
        else:
            print(f"  Warning: Could not convert to WAV, keeping MP3: {mp3_path}")
            return False

    except ImportError:
        print("Error: edge-tts not installed. Run: pip install edge-tts")
        return False
    except Exception as e:
        print(f"Error generating voice for '{text}': {e}")
        return False


def _convert_to_wav(mp3_path: Path, wav_path: Path) -> bool:
    """Convert MP3 to WAV using ffmpeg or sox."""
    # Try ffmpeg first
    try:
        result = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(mp3_path),
                "-acodec",
                "pcm_s16le",
                "-ar",
                "44100",
                "-ac",
                "1",
                str(wav_path),
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            return True
    except FileNotFoundError:
        pass

    # Try sox as fallback
    try:
        result = subprocess.run(
            ["sox", str(mp3_path), str(wav_path)],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            return True
    except FileNotFoundError:
        pass

    print("  Warning: Neither ffmpeg nor sox found for MP3->WAV conversion")
    return False


def _apply_reverb(wav_path: Path) -> bool:
    """Apply subtle reverb to the voice file using sox."""
    try:
        temp_path = wav_path.with_suffix(".temp.wav")
        result = subprocess.run(
            [
                "sox",
                str(wav_path),
                str(temp_path),
                "reverb",
                "15",  # Reverberance (0-100)
                "50",  # HF damping (0-100)
                "50",  # Room scale (0-100)
                "gain",
                "-2",  # Reduce gain slightly to prevent clipping
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            temp_path.rename(wav_path)
            return True
    except FileNotFoundError:
        pass

    return False


async def main() -> int:
    """Generate all voice prompts."""
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate_voice.py <output_dir>")
        return 1

    output_dir = Path(sys.argv[1])
    output_dir.mkdir(parents=True, exist_ok=True)

    print("========================================")
    print("Generating voice prompts with Edge TTS")
    print(f"Voice: {VOICE}")
    print(f"Rate: {RATE}, Pitch: {PITCH}")
    print("========================================")
    print()

    success_count = 0

    for filename, text in PROMPTS.items():
        output_path = output_dir / f"{filename}.wav"
        print(f"  Generating: {filename}")
        print(f"    Text: \"{text}\"")

        if await generate_voice_file(text, output_path):
            # Apply reverb for more ambient feel
            if _apply_reverb(output_path):
                print(f"    Applied reverb")
            print(f"    Created: {output_path}")
            success_count += 1
        else:
            print(f"    FAILED: {output_path}")

    print()
    print("========================================")
    print(f"Generated {success_count}/{len(PROMPTS)} voice files")
    print("========================================")

    return 0 if success_count == len(PROMPTS) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
