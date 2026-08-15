# CHINKY Originality / Brand Reference Audit

This source cleanup was performed to reduce unnecessary third-party brand and copying risk.

## Cleaned
- Removed Facebook-specific friend discovery UI/link and replaced it with CHINKY's generic profile invite flow.
- Removed TikTok comparison wording from monetization comments.
- Removed old `/api/reels` compatibility route.
- Replaced user-facing `Reel/Reels` wording with CHINKY `Spark`.
- Replaced user-facing `Stories` wording with CHINKY `Vibes`.
- Removed Twitter/X-specific social-card metadata from the bundled CHINKY website.
- Renamed the backend Spark schema variable from legacy `reelSchema` to `sparkSchema`.
- No Instagram/Facebook/TikTok/Twitter brand logo/icon asset references remain in CHINKY user-facing source.
- A legacy MongoDB field named `reel` remains inside Spark comment storage for backward compatibility with existing database records. It is not shown to users and was not renamed because doing so without a data migration could break existing comments.

## Third-party dependencies
Package-manager files and imports for libraries actually used by CHINKY are intentionally retained.
Their package names, licenses, and required attribution must not be stripped merely to make the source
look original. This audit does not claim ownership of third-party dependencies.

## Important
This is a source/code hygiene audit, not a legal guarantee that no third party can ever make a claim.
CHINKY's own brand assets, screenshots, music, uploaded media, fonts, store-listing images, and other
non-source assets should also be reviewed before release.
