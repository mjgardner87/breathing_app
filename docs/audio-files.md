# Innerfire audio

All audio is bundled. Playback needs no network connection or speech service.

- Australian English neural voice with levelled volume and clean, dry speech.
- Learn explains the technique before breathing. Guided gives short reminders. Minimal keeps essential transitions.
- Optional retention body awareness invites softening the jaw and hands and noticing support or the fingertips, without trying to produce sensations. Retention ends whenever the person needs to breathe.
- Voice has priority over breath textures. Long narration does not get cut off by the next breath sound.
- Breath textures are generated for every supported pace, ending slightly before each phase boundary. Animation and cues follow the same session sequence.
- Recovery gives time to inhale before its comfortable hold, a spoken countdown, immediate early release and a settling pause.
- Voice volume, breath-sound volume, body-awareness prompts and minute information are saved separately. Settings includes a preview.
- Gentle breathing is a separate five-minute practice without holds. Its duration is logged separately from retention statistics.

## Regeneration

Run `./generate-audio.sh` from a machine with uv and ffmpeg installed. Generation uses Edge TTS once, while building the pack. The app never uses it at runtime.

Edit the original narration in `src/content/voice-prompts.json`. The generator writes WAV files to `src/assets/audio/`, copies them to Android raw resources and generates `src/constants/audio.ts` and `src/constants/audio.android.ts` with measured durations. Commit the recordings and both manifests together.

Android uses named raw resources, including in standalone debug APKs. iOS uses Metro assets. Intermediate MP3 recordings are kept in a temporary directory outside the repository.

## Content basis

The retention/recovery sequence follows the official breathing instructions: https://www.wimhofmethod.com/breathing-exercises

The optional sensory prompts are Innerfire's own attention cues, not a claimed part of the official method or a proven way to increase its effects. They never ask someone to chase tingling, move during retention or resist the urge to breathe. This app has no affiliation with Wim Hof or his organisation.
