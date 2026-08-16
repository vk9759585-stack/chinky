# CHINKY AI setup

CHINKY AI always has a built-in local support fallback. For model-backed answers, configure the backend only:

```
CHINKY_AI_PROVIDER=auto
CHINKY_AI_MODEL=gpt-5.6
OPENAI_API_KEY=<server-side key>
```

Do not put the API key in Flutter. If the provider is unavailable or times out, CHINKY AI falls back to the local CHINKY support knowledge base instead of failing the chat.
