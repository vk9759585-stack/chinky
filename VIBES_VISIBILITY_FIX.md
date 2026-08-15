# Vibes visibility fix

- Forced Vibes refresh is no longer swallowed by an older in-flight request.
- Home Vibes refreshes after publishing and after returning from own Vibes viewer.
- The user's own Vibes circle now uses their profile image and clearly shows whether Vibes content exists.
- The plus badge is shown only when the user has no active Vibes.
- The Vibes list refreshes from the server when opened.
- Temporary network failures fall back to the last usable Vibes cache.
- Current user's active Vibes are prioritized by the backend response so they cannot be pushed out by the result limit.
- Existing MongoDB Story model naming is retained internally only for backward compatibility with previously published Vibes.
