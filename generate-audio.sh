#!/bin/bash

# Audio Generation Script for Breathing App
# Generates all required audio files using AI text-to-speech

set -e

OUTPUT_DIR="android/app/src/main/res/raw"
TEMP_DIR="/tmp/breathing-audio"

echo "========================================="
echo "Breathing App - Audio Generation"
echo "========================================="
echo ""

# Check if espeak-ng is available
if ! command -v espeak-ng &> /dev/null; then
    echo "❌ espeak-ng is not installed"
    echo "   Install: sudo dnf install espeak-ng"
    exit 1
fi

# Check if ffmpeg is available
HAS_FFMPEG=false
if command -v ffmpeg &> /dev/null; then
    HAS_FFMPEG=true
    echo "✅ ffmpeg found - will generate MP3 files"
else
    echo "⚠️  ffmpeg not found - will generate WAV files"
    echo "   For MP3: sudo dnf install ffmpeg"
fi

echo ""

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "Generating audio files..."
echo ""

# Function to generate audio
generate_audio() {
    local text="$1"
    local filename="$2"
    local pitch="$3"  # Higher pitch = more calming/feminine
    local speed="$4"   # Slower = more calming

    echo "  Generating: $filename"

    # Generate WAV with espeak-ng (calming voice settings)
    espeak-ng -v en-us+f3 \
        -p "$pitch" \
        -s "$speed" \
        -a 100 \
        -w "$TEMP_DIR/${filename}.wav" \
        "$text"

    # Convert to MP3 if ffmpeg available, otherwise copy WAV
    if [ "$HAS_FFMPEG" = true ]; then
        ffmpeg -i "$TEMP_DIR/${filename}.wav" \
            -codec:a libmp3lame \
            -q:a 4 \
            -ar 44100 \
            "$OUTPUT_DIR/${filename}.mp3" \
            -y -loglevel error
        echo "    ✓ Created: $OUTPUT_DIR/${filename}.mp3"
    else
        cp "$TEMP_DIR/${filename}.wav" "$OUTPUT_DIR/${filename}.wav"
        echo "    ✓ Created: $OUTPUT_DIR/${filename}.wav"
    fi
}

# Function to generate bell/chime for minute marker
generate_bell() {
    local filename="$1"

    echo "  Generating: $filename (bell sound)"

    if [ "$HAS_FFMPEG" = true ]; then
        # Generate a pleasant bell tone using ffmpeg
        # 432 Hz sine wave (calming frequency) with fade
        ffmpeg -f lavfi \
            -i "sine=frequency=432:duration=1.5" \
            -af "afade=t=in:st=0:d=0.1,afade=t=out:st=1.3:d=0.2,volume=0.6" \
            -ar 44100 \
            "$OUTPUT_DIR/${filename}.mp3" \
            -y -loglevel error
        echo "    ✓ Created: $OUTPUT_DIR/${filename}.mp3"
    else
        # Fallback: use espeak to generate a simple tone
        espeak-ng -v en-us+f4 \
            -p 80 \
            -s 300 \
            -a 80 \
            -w "$OUTPUT_DIR/${filename}.wav" \
            "ding"
        echo "    ✓ Created: $OUTPUT_DIR/${filename}.wav (fallback)"
    fi
}

# Generate all voice files
# Parameters: text, filename, pitch (30-99, higher=calmer), speed (80-450, lower=calmer)

generate_audio "Breathe in" "breathe_in" "65" "140"
generate_audio "Breathe out" "breathe_out" "65" "140"
generate_audio "Hold your breath" "hold_breath" "60" "130"
generate_audio "Take a deep breath in, and hold" "recovery_breath" "60" "120"
generate_audio "Release" "release" "65" "140"
generate_audio "Round complete" "round_complete" "60" "130"

# Generate bell/chime for minute marker
generate_bell "minute_marker"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "========================================="
echo "✅ Audio generation complete!"
echo "========================================="
echo ""

if [ "$HAS_FFMPEG" = true ]; then
    echo "Generated MP3 files in: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR"/*.mp3
else
    echo "Generated WAV files in: $OUTPUT_DIR/"
    echo ""
    echo "⚠️  WAV files are larger than MP3."
    echo "To convert to MP3:"
    echo "  1. Install ffmpeg: sudo dnf install ffmpeg"
    echo "  2. Run this script again: ./generate-audio.sh"
    ls -lh "$OUTPUT_DIR"/*.wav
fi

echo ""
echo "Audio files are now embedded in your app!"
echo "Rebuild the APK to include them: ./build-apk.sh"
echo ""
