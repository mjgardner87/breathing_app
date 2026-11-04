#!/usr/bin/env bash
# Generate the bundled voice recordings, breath textures and platform manifests.
set -euo pipefail
cd "$(dirname "$0")"
uv run --with edge-tts python scripts/build_audio.py
