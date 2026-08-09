const router = require('express').Router();

router.get('/version', (_req, res) => {
  res.json({
    success: true,
    latestVersion: process.env.APP_LATEST_VERSION || '',
    latestBuild: Number(process.env.APP_LATEST_BUILD || 0),
    androidUrl: process.env.PLAY_STORE_URL || '',
    iosUrl: process.env.APP_STORE_URL || '',
  });
});

module.exports = router;
