# LexiScan System Architecture

Version 1.2.0 · Updated 11 August 2026

## 1. High-Level Architecture

LexiScan is a decoupled client-server system: a React Native (Expo SDK 57) mobile
app and a Laravel 13 API backend.

- **Mobile app** owns the interface, the camera, on-device OCR, all reading-comfort
  rendering, and speech. Everything that makes text easier to read runs locally, so
  it works without a network.
- **Backend** is an API gateway and processing hub. It holds the LLM keys, enforces
  quotas, caches answers, and persists reader accounts.
- **Deployment** - the backend runs on Railway (Docker image, `backend-api/railway.json`)
  against a Supabase PostgreSQL database. The app ships as an EAS build with over-the-air
  JavaScript updates on the `preview` channel.

The split is deliberate: a request only crosses the network when a *language model* is
genuinely needed. OCR, typography, syllable splitting, and text-to-speech never do.

## 2. Technology Stack

- **Mobile:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router (file-based),
  NativeWind v4, Zustand + `persist` (AsyncStorage) for global state.
- **Backend:** Laravel 13 (PHP 8.3+), Sanctum tokens, Filament admin panel at `/admin`.
- **Database:** Supabase PostgreSQL.
- **On-device ML:** `@react-native-ml-kit/text-recognition` (Google ML Kit OCR).
- **Speech:** `expo-speech` - the device TTS engine, with an explicitly selected voice.
- **LLM:** Gemini as primary, with a configurable fallback provider (OpenRouter).

**There is no TanStack Query.** State is Zustand plus plain `fetch` in `src/api/`.
**There is no OpenDyslexic.** The reading face is Atkinson Hyperlegible; the interface
face is Fredoka.

## 3. State & Persistence

`src/store/useStore.ts` holds reading preferences; `src/store/useAuthStore.ts` holds
the session. Two rules govern how preferences behave, and most bugs in this area come
from breaking one of them:

1. **A reading level is a starting point, not a lock.** Choosing a level applies a whole
   preset (typography, syllable splitting, voice, button speech). After that, any switch
   the user touches wins and is never overwritten again.
2. **`null` on the server means "never chosen", not "off".** Preference columns are
   nullable so the backend can tell an untouched setting from a deliberate `false`.
   Only the untouched ones may be re-applied by a preset.

Device-only settings - the chosen TTS voice identifier and speech rate - are never sent
to the server, because the available voices differ on every phone.

## 4. Feature Data Flow

### A. Smart OCR Scan (on-device)

1. `expo-camera` captures at full quality with EXIF disabled.
2. `src/utils/crop-frame.ts` maps the on-screen guide box into photo pixel coordinates,
   accounting for the preview's centre-crop. This is what makes the crop match what the
   user actually framed.
3. `expo-image-manipulator` crops; ML Kit extracts text locally.
4. The raw text goes to Zustand, then optionally to `POST /api/correct-typo`.

### B. Adaptive Typography (frontend rendering only)

`src/components/dyslexic-text.tsx` renders every paragraph:

- Atkinson Hyperlegible, line-height 1.85-2.4×, wide letter-spacing.
- **Visual fixation:** only the *first letter* of each word is bold - not the first
  40-50% of characters.
- **Syllable splitting:** `src/utils/syllables.ts` applies Indonesian KV/KVK rules with
  digraph handling (`ng`, `ny`, `sy`, `kh`) plus a small override table for words where
  the affix rule beats the phonological one. Syllables are joined with hyphens
  (`Mi-to-kon-dri-a`).
- **Bicolor Words** and **Reading Ruler** for line tracking.

Critically, splitting lives *only* in the render layer. The store keeps the original
text, so speech never pronounces syllables as separate words.

### C. AI Text Simplification

1. `POST /api/simplify-text` with the text, level (L2-L5), and language.
2. `AiTextService` builds a strict prompt, capping answer length by the reader's level.
3. `FallbackProvider` tries Gemini, then the configured backup.
4. The response carries a `footprint` block - estimated energy and CO₂e - which the app
   accumulates locally and shows in Settings.
5. Answers are cached server-side, so a repeated request emits nothing new.

### D. Focus Mode, Reading Ruler, Word Isolation

All frontend-only. Zustand tracks `activeParagraphIndex`; non-active paragraphs are
dimmed. The ruler tracks line positions from `onTextLayout` and is driven on the UI
thread by Reanimated shared values, so dragging stays smooth.

### E. AI Explain This

`POST /api/explain-word` with the term, its surrounding paragraph, and one of three
styles (`sederhana`, `analogi`, `nyata`). Answer length again follows the reading level.

### F. Text-to-Speech

`src/speech/` wraps `expo-speech`. Two details matter:

- **The voice is named explicitly.** Passing only a language is unreliable: expo-speech's
  Android module builds `Locale("id-ID")`, which Java reads as a single invalid language
  code, so the engine falls back to the phone's system language. `src/speech/voices.ts`
  picks a real voice identifier instead, matching both `id` and `in` - Java reports
  Indonesian using the legacy code `in`.
- **Button labels are spoken too.** `PressableScale` announces its `accessibilityLabel`
  on press, so a reader who cannot yet read learns what each control does.

## 5. Accounts

`readers` is a separate table from `users`; `users` are Filament administrators, and
every row there can open `/admin`. A reader account exists for one reason: to store the
reading level and school level that drive the app's adaptations across devices.

`POST /api/auth/register` takes name, username, password, reading level, and optional
school level. `PATCH /api/auth/preferences` updates display name and preferences -
never `username` or `password`, which need their own flow.

## 6. API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/ai/health` | Provider status, defaults, footprint constants |
| `POST` | `/api/auth/register` | Create a reader account |
| `POST` | `/api/auth/login` | Exchange credentials for a Sanctum token |
| `GET` | `/api/auth/me` | Current reader profile |
| `POST` | `/api/auth/logout` | Revoke the current token only |
| `PATCH` | `/api/auth/preferences` | Save name, reading level, and display preferences |
| `POST` | `/api/simplify-text` | Simplify a document to level L2-L5 |
| `POST` | `/api/explain-word` | Explain a term in one of three styles |
| `POST` | `/api/correct-typo` | Clean up OCR output |
| `POST` | `/api/feedback` | In-app problem reports |

## 7. Database

`readers`, `devices`, `ai_usage_logs`, `settings`, `feedback`, plus Laravel's own
`users`, `cache`, `jobs`, and `personal_access_tokens`.

`ai_usage_logs` records every model call with its token counts, which is what makes the
carbon-footprint estimate auditable rather than decorative.

## 8. Build & Release

`runtimeVersion.policy` is `appVersion`, so **the app version doubles as the OTA
compatibility key**. Pure JavaScript and asset changes ship instantly via
`eas update --channel preview --environment preview`. Adding a native module
(`expo-notifications` in 1.2.0, for example) requires bumping the version and building a
new APK - an OTA carrying new JS to an older binary would crash it.
