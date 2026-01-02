#!/bin/bash

# Audio Generation Script for Breathing App
# Generates high-quality audio using Edge TTS (neural voices) and procedural SFX

set -e

OUTPUT_DIR="android/app/src/main/res/raw"
TEMP_DIR="/tmp/breathing-audio"
SFX_SCRIPT="scripts/generate_sfx.py"
VOICE_SCRIPT="scripts/generate_voice.py"

echo "========================================="
echo "Breathing App - Audio Generation"
echo "========================================="
echo ""

# Check dependencies
check_dependencies() {
    local missing=0

    if ! command -v python3 &> /dev/null; then
        echo "❌ python3 is required"
        missing=1
    fi

    # Check for uv (preferred) for edge-tts
    if command -v uv &> /dev/null; then
        echo "✓ uv available (will use edge-tts neural voice)"
        USE_UV=1
        USE_EDGE_TTS=1
    elif python3 -c "import edge_tts" 2>/dev/null; then
        USE_UV=0
        USE_EDGE_TTS=1
        echo "✓ edge-tts available (neural voice)"
    else
        USE_UV=0
        USE_EDGE_TTS=0
        echo "⚠️  edge-tts not installed - will fall back to espeak-ng"
        echo "   Install with: uv pip install edge-tts"
    fi

    if ! command -v ffmpeg &> /dev/null && ! command -v sox &> /dev/null; then
        echo "⚠️  Neither ffmpeg nor sox found - some features may not work"
        echo "   Install: sudo dnf install ffmpeg sox"
    fi

    if ! command -v sox &> /dev/null; then
        echo "⚠️  sox not found - reverb effects will be skipped"
        echo "   Install for better quality: sudo dnf install sox"
    else
        echo "✓ sox available (audio effects)"
    fi

    if [ ! -f "$SFX_SCRIPT" ]; then
        echo "❌ Missing helper script: $SFX_SCRIPT"
        missing=1
    fi

    if [ ! -f "$VOICE_SCRIPT" ]; then
        echo "❌ Missing helper script: $VOICE_SCRIPT"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

check_dependencies
echo ""

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "Generating audio files..."
echo ""

# ==========================================
# Voice prompts (Edge TTS or espeak-ng fallback)
# ==========================================

generate_voice_prompts() {
    if [ "$USE_EDGE_TTS" -eq 1 ]; then
        echo "Using Edge TTS (neural voices)..."
        if [ "$USE_UV" -eq 1 ]; then
            uv run --with edge-tts python "$VOICE_SCRIPT" "$OUTPUT_DIR"
        else
            python3 "$VOICE_SCRIPT" "$OUTPUT_DIR"
        fi
    else
        echo "Using espeak-ng fallback..."
        generate_espeak_fallback
    fi
}

# Fallback to espeak-ng if edge-tts not available
generate_espeak_fallback() {
    if ! command -v espeak-ng &> /dev/null; then
        echo "❌ espeak-ng is not installed"
        echo "   Install: sudo dnf install espeak-ng"
        echo "   Or install edge-tts: pip install edge-tts"
        exit 1
    fi

    local prompts=(
        "Hold your breath:hold_breath:65:110"
        "Take a deep breath in, and hold:recovery_breath:65:105"
        "Release:release:68:115"
        "Round complete:round_complete:65:110"
    )

    for prompt in "${prompts[@]}"; do
        IFS=':' read -r text filename pitch speed <<< "$prompt"
        echo "  Generating: $filename (espeak-ng fallback)"

        espeak-ng -v en-us+f3 \
            -p "$pitch" \
            -s "$speed" \
            -a 100 \
            -g 2 \
            -k 1 \
            -w "$TEMP_DIR/${filename}.wav" \
            "$text"

        # Post-process with sox if available
        if command -v sox &> /dev/null; then
            sox "$TEMP_DIR/${filename}.wav" "$OUTPUT_DIR/${filename}.wav" \
                gain -3 \
                reverb 10 50 50 \
                highpass 80 \
                lowpass 8000 \
                2>/dev/null || cp "$TEMP_DIR/${filename}.wav" "$OUTPUT_DIR/${filename}.wav"
        else
            cp "$TEMP_DIR/${filename}.wav" "$OUTPUT_DIR/${filename}.wav"
        fi
    done
}

# ==========================================
# Sound effects (procedural generation)
# ==========================================

# Function to generate breath SFX
generate_breath_sfx() {
    local filename="$1"
    local duration="$2"
    local direction="$3"

    echo "  Generating: $filename ($direction SFX)"
    python3 "$SFX_SCRIPT" breath "$OUTPUT_DIR/${filename}.wav" "$duration" "$direction"
    echo "    ✓ Created: $OUTPUT_DIR/${filename}.wav"
}

# Function to generate Tibetan singing bowl for minute marker
generate_singing_bowl() {
    local filename="$1"
    local duration="$2"

    echo "  Generating: $filename (Tibetan singing bowl)"
    python3 "$SFX_SCRIPT" singing_bowl "$OUTPUT_DIR/${filename}.wav" "$duration"
    echo "    ✓ Created: $OUTPUT_DIR/${filename}.wav"
}

# ==========================================
# Generate all audio files
# ==========================================

echo "--- Generating voice prompts ---"
generate_voice_prompts
echo ""

echo "--- Generating sound effects ---"
# Breath sounds (gentle, ambient)
generate_breath_sfx "breathe_in" "2.2" "inhale"
generate_breath_sfx "breathe_out" "2.0" "exhale"

# Tibetan singing bowl for minute marker (D4, 3 seconds for long decay)
generate_singing_bowl "minute_marker" "3.0"
echo ""

# Cleanup
rm -rf "$TEMP_DIR"

echo "========================================="
echo "✅ Audio generation complete!"
echo "========================================="
echo ""

echo "Generated WAV files in: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR"/*.wav 2>/dev/null || echo "  (no files found)"

echo ""
echo "Audio files are now embedded in your app!"
echo "Rebuild the APK to include them: ./build-apk.sh"
echo ""
