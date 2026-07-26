# LexiScan System Architecture (Solo Dev MVP Edition)

## 1. High-Level Architecture
LexiScan utilizes a decoupled client-server architecture consisting of a React Native (Expo) frontend and a Laravel 12 API backend. 
- **Frontend** is responsible for the user interface, hardware interaction (Camera), local state management, and executing on-device machine learning (OCR).
- **Backend** acts as an API gateway and processing hub, securely managing API keys, handling external LLM requests, and managing data persistence.
- **Environment:** Entire stack runs locally for the MVP presentation (Expo Go/Dev Build + `php artisan serve`).

## 2. Technology Stack & Boundaries
- **Mobile Frontend:** Expo SDK, TypeScript, NativeWind v4, Zustand (Global State), TanStack Query.
- **Backend API:** Laravel 12 (PHP 8.3+), Sanctum.
- **Database:** PostgreSQL.
- **AI/ML:** `@react-native-ml-kit/text-recognition` (Frontend OCR), Gemini API (Backend LLM).

## 3. Core Feature Data Flow (The 5 Pillars)

### A. Smart OCR Scan (On-Device Processing)
1. User captures an image of a document via Expo Camera on the `ScannerScreen`.
2. The image URI is passed directly to the ML Kit text recognition module.
3. ML Kit extracts raw text locally (Zero latency, no backend request needed).
4. Raw text payload is dispatched to the Zustand store for immediate availability.

### B. Adaptive Typography Engine (Frontend Logic)
1. The `ReaderScreen` retrieves the raw text from the Zustand store.
2. Text is processed through a local utility function `applyVisualFixation(text)`.
3. The algorithm tokenizes the text into words and applies a bold style to the first 40-50% of characters in each word.
4. The UI renders the final text using the `OpenDyslexic` custom font with explicitly increased `lineHeight` and `letterSpacing` via NativeWind classes.

### C. AI Text Simplification (Client-Server-LLM Flow)
1. User activates the "Easy Read Mode" toggle on the UI.
2. Frontend triggers a TanStack Query mutation, sending the raw text via `POST /api/simplify-text` to the Laravel Backend.
3. Laravel controller validates the request and constructs a strict prompt asking for simplified language.
4. Laravel sends the prompt to the Gemini API securely.
5. Gemini returns the simplified string. Laravel formats it into a JSON response.
6. Frontend receives the response, TanStack Query caches it, and the UI updates seamlessly.

### D. Focus Reading Mode (Frontend UI Rendering)
1. In the `ReaderScreen`, text is split into an array of paragraphs (or sentences).
2. Zustand tracks the `activeParagraphIndex`.
3. The renderer maps over the array. If `index === activeParagraphIndex`, the block receives `opacity-100`. Otherwise, it receives `opacity-30` and `blur-sm`.
4. User interactions (tapping a paragraph) update the active index in Zustand, causing an immediate UI re-render.

### E. AI Explain This (Contextual API Flow)
1. User highlights a specific difficult word or phrase in the `ReaderScreen`.
2. A context menu or Bottom Sheet Modal appears with a "Jelaskan" (Explain) button.
3. Frontend sends the selected text via `POST /api/explain-word` to the Laravel Backend.
4. Laravel formats a prompt for Gemini asking for a simple, real-world analogy of the selected word.
5. The explanation is returned as JSON and displayed in the frontend modal.