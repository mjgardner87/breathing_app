# Audio files
Audio files belong in `android/app/src/main/res/raw/` as Android raw resources.

## Required files
- `breathe_in.wav`
- `breathe_out.wav`
- `hold_breath.wav`
- `recovery_breath.wav`
- `release.wav`
- `round_complete.wav`
- `minute_marker.wav`

## Naming rules (Android)
Raw resource filenames **must** be lowercase and may contain only `a-z`, `0-9`, and `_`.
Avoid documentation files in `res/raw/` (they get packaged as resources and can break builds).
