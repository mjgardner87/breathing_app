# Audio Files

The Breathing App comes with **bundled audio files** located in `android/app/src/main/res/raw/`.

These files are compiled into the app (APK) at build time. No runtime loading or external file copying is required by the user.

## Bundled Files

The following files are included in the source code and the release APK:

- `breathe_in.wav`
- `breathe_out.wav`
- `hold_breath.wav`
- `recovery_breath.wav`
- `release.wav`
- `round_complete.wav`
- `minute_marker.wav`

## Changing the Audio (Developers Only)

If you want to change the voice or sounds:

1. Replace the files in `android/app/src/main/res/raw/` with your own `.wav` or `.mp3` files.
2. **Rebuild the app** (`npm run android` or `./gradlew assembleRelease`).

### Filename Rules (Android Resources)
- Filenames **must** be lowercase.
- Filenames **must** match the list above exactly.
- Filenames may only contain `a-z`, `0-9`, and `_`.
- Do not put documentation or other files in the `res/raw/` directory.
