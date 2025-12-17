#!/bin/bash

# Audio Generation Script for Breathing App
# Generates all required audio files using AI text-to-speech

set -e

OUTPUT_DIR="android/app/src/main/res/raw"
TEMP_DIR="/tmp/breathing-audio"
SFX_SCRIPT="scripts/generate_sfx.py"

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

# Ensure python is available for SFX generation
if ! command -v python3 &> /dev/null; then
    echo "❌ python3 is required to generate breath sounds"
    exit 1
fi

if [ ! -f "$SFX_SCRIPT" ]; then
    echo "❌ Missing helper script: $SFX_SCRIPT"
    exit 1
fi

echo ""

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "Generating audio files..."
echo ""

# Function to generate voice audio
generate_audio() {
    local text="$1"
    local filename="$2"
    local pitch="$3"  # Higher pitch = more calming/feminine
    local speed="$4"   # Slower = more calming

    echo "  Generating: $filename"

    espeak-ng -v en-us+f3 \
        -p "$pitch" \
        -s "$speed" \
        -a 100 \
        -w "$TEMP_DIR/${filename}.wav" \
        "$text"

    cp "$TEMP_DIR/${filename}.wav" "$OUTPUT_DIR/${filename}.wav"
    echo "    ✓ Created: $OUTPUT_DIR/${filename}.wav"
}

# Function to generate breath SFX
generate_breath_sfx() {
    local filename="$1"
    local duration="$2"
    local direction="$3"

    echo "  Generating: $filename ($direction SFX)"
    python3 "$SFX_SCRIPT" breath "$OUTPUT_DIR/${filename}.wav" "$duration" "$direction"
}

# Function to generate bell/chime for minute marker
generate_bell() {
    local filename="$1"
    local duration="$2"

    echo "  Generating: $filename (bell sound)"
    python3 "$SFX_SCRIPT" bell "$OUTPUT_DIR/${filename}.wav" "$duration"
}

# Generate all voice files
# Parameters: text, filename, pitch (30-99, higher=calmer), speed (80-450, lower=calmer)

generate_breath_sfx "breathe_in" "2.2" "inhale"
generate_breath_sfx "breathe_out" "2.0" "exhale"
generate_audio "Hold your breath" "hold_breath" "60" "130"
generate_audio "Take a deep breath in, and hold" "recovery_breath" "60" "120"
generate_audio "Release" "release" "65" "140"
generate_audio "Round complete" "round_complete" "60" "130"

# Generate bell/chime for minute marker
generate_bell "minute_marker" "1.5"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "========================================="
echo "✅ Audio generation complete!"
echo "========================================="
echo ""

echo "Generated WAV files in: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR"/*.wav

echo ""
echo "Audio files are now embedded in your app!"
echo "Rebuild the APK to include them: ./build-apk.sh"
echo ""
