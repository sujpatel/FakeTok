🎯 FakeTok

FakeTok is a tool that analyzes TikTok videos for false or misleading claims. It transcribes the audio, detects speech vs. music, and highlights factual inaccuracies with sourced explanations.

🚀 Features

- Paste a TikTok link
- Auto-transcribe speech using Whisper
- Classify as music, casual speech, or factual claims
- Detect verifiably false/misleading statements
- Show sourced explanations from trusted databases
- Hover tooltips with claim debunks and sources

🛠️ Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** FastAPI
- **ML:** Whisper (speech-to-text), OpenRouter (LLM)
- **APIs:** Google Fact Check, Semantic Scholar

🧪 How It Works

1. User pastes a TikTok URL
2. Backend downloads and transcribes video
3. LLM classifies and detects false claims
4. Related sources are pulled and shown
5. Transcript is rendered with interactive highlights