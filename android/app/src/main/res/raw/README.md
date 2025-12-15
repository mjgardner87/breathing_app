# Audio Files

Place the following audio files in this directory (`android/app/src/main/res/raw/`):

## Required Audio Files

- `breathe_in.mp3` - "Breathe in" voice cue (~1 second)
- `breathe_out.mp3` - "Breathe out" voice cue (~1 second)
- `hold_breath.mp3` - "Hold your breath" voice cue (~2 seconds)
- `recovery_breath.mp3` - "Take a deep breath in and hold" voice cue (~3 seconds)
- `release.mp3` - "Release" voice cue (~1 second)
- `round_complete.mp3` - "Round complete" voice cue (~2 seconds)
- `minute_marker.mp3` - Bell or voice notification for minute milestones during breath holds (~1 second)

## Minute Marker Feature

The `minute_marker.mp3` sound plays every 60 seconds during the breath hold phase to help users track their progress. This can be:
- A gentle bell sound
- A voice saying "One minute", "Two minutes", etc. (though just a consistent bell is recommended)
- Any clear but non-jarring sound

## Audio File Requirements

- Format: MP3
- Sample rate: 44.1 kHz or 48 kHz
- Bit rate: 128 kbps or higher
- Channels: Mono or stereo
- Volume: Normalised to avoid clipping

## How to Generate Audio Files

You can use several methods to create these audio files:

1. **Text-to-Speech Tools:**
   - Google Text-to-Speech: https://cloud.google.com/text-to-speech
   - Amazon Polly: https://aws.amazon.com/polly/
   - Online TTS: https://ttsmp3.com/

2. **Record Your Own:**
   - Use a smartphone voice recorder app
   - Use Audacity (free audio editor)
   - Keep recordings clear and concise

3. **Royalty-Free Sound Libraries:**
   - For bell sounds: Freesound.org, Zapsplat.com
   - Search for "meditation bell" or "chime" sounds

## Testing

After placing audio files in this directory:

1. Rebuild the app: `npx react-native run-android`
2. Start a session and verify audio plays at correct times
3. Check that minute markers sound every 60 seconds during breath holds
