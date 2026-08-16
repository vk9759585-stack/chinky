# CHINKY Daily Rewarded Ads

Daily Rewards requires 5 completed rewarded video ads before the daily check-in reward unlocks.

- 5 videos/day.
- +3 CHINKY reward coins for each completed rewarded ad.
- Maximum ad reward: 15 coins/day.
- Closing/skipping before Google calls `onUserEarnedReward` gives no reward.
- Backend tracks progress and blocks daily check-in until all 5 are completed.
- Debug builds use Google's official rewarded test IDs.
- Production requires ADMOB_ANDROID_REWARDED_AD_UNIT_ID and/or ADMOB_IOS_REWARDED_AD_UNIT_ID.

For stronger anti-fraud protection, enable AdMob rewarded Server-Side Verification on the rewarded ad unit.
