# Innerfire guided sessions

Approved scope: the recommendations in this chat, including retention body awareness, plus rebuilding, committing and pushing an installable Android update.

- [x] Bundle a calm Australian voice pack and pace-matched breath sounds. Use one player with speech priority, completion events, separate saved volumes and a working preview.
- [x] Drive audio, breath count and animation from one session sequence. Add preparation, a comfortable recovery inhale, countdown, settling and a quiet finish. Retention remains user-controlled.
- [x] Add Learn, Guided and Minimal guidance, optional body awareness and minute markers. Body awareness invites noticing support and softening the hands, without seeking tingling, movement or longer holds.
- [x] Add a distinct five-minute gentle breathing session without retention. Keep it separate from hold statistics and preserve existing records.
- [x] Improve mobile controls, phase copy, captions, interruption handling and completed-round saving. Retain the decimal formatting fixes from the previous turn.
- [ ] Check types, lint, audio packaging and Android compilation. No tests added or run, as requested. Commit and push the feature branch, build through the existing GitHub workflow, and download the APK.

Implementation stays on the existing React Native stack. Existing application ID and signing key stay unchanged so an update preserves on-device history. This machine has no Android SDK; use the repository's existing Android build workflow. No merge is required to deliver the APK.

Review: a separate read-only review identified preservation during settling, failed-audio timing and paused introduction skipping. All were corrected. No tests were added or run. Type checks, lint and Android JavaScript packaging passed. APK compilation remains in progress.
