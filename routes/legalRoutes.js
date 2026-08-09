const router = require('express').Router();
const fs = require('fs');
const path = require('path');

router.get('/audio-policy', (_req, res) => {
  const file = path.join(__dirname, '..', 'audio-policy.md');
  try {
    const text = fs.readFileSync(file, 'utf8');
    res.type('text/plain; charset=utf-8').send(text);
  } catch (_) {
    res.status(500).send('Audio policy unavailable.');
  }
});

module.exports = router;
