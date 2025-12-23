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

# Check if sox is available (optional, for audio post-processing)
if ! command -v sox &> /dev/null; then
    echo "⚠️  sox not found - audio will be generated without post-processing"
    echo "   Install for better quality: sudo dnf install sox"
    echo "   Continuing without sox..."
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

# Function to generate voice audio with improved quality
generate_audio() {
    local text="$1"
    local filename="$2"
    local pitch="$3"  # Higher pitch = more calming/feminine
    local speed="$4"   # Slower = more calming

    echo "  Generating: $filename"

    # Use mbrola voice if available (much more natural), otherwise fall back to espeak-ng
    # mbrola voices are more natural but require separate installation
    # For now, optimize espeak-ng with better parameters for more natural sound
    espeak-ng -v en-us+f3 \
        -p "$pitch" \
        -s "$speed" \
        -a 100 \
        -g 2 \
        -k 1 \
        -w "$TEMP_DIR/${filename}.wav" \
        "$text"

    # Post-process with sox if available to add subtle reverb and EQ for warmth
    if command -v sox &> /dev/null; then
        sox "$TEMP_DIR/${filename}.wav" "$TEMP_DIR/${filename}_processed.wav" \
            gain -3 \
            reverb 10 50 50 \
            highpass 80 \
            lowpass 8000 \
            2>/dev/null || cp "$TEMP_DIR/${filename}.wav" "$TEMP_DIR/${filename}_processed.wav"
        cp "$TEMP_DIR/${filename}_processed.wav" "$OUTPUT_DIR/${filename}.wav"
    else
        cp "$TEMP_DIR/${filename}.wav" "$OUTPUT_DIR/${filename}.wav"
    fi

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
# Optimized for more natural, calming voice with better pacing

generate_breath_sfx "breathe_in" "2.2" "inhale"
generate_breath_sfx "breathe_out" "2.0" "exhale"

# More natural phrasing and pacing for better user experience
generate_audio "Hold your breath" "hold_breath" "65" "110"  # Slightly higher pitch, slower pace
generate_audio "Take a deep breath in, and hold" "recovery_breath" "65" "105"  # Calmer, more measured
generate_audio "Release" "release" "68" "115"  # Gentle, clear
generate_audio "Round complete" "round_complete" "65" "110"  # Calming completion cue

# Generate bell/chime for minute marker (880Hz A5 - pleasant, clear bell tone)
generate_bell "minute_marker" "2.0"

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
