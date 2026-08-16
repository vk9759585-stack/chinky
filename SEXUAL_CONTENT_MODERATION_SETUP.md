# CHINKY Sexual/Adult Content Auto-Moderation — Production Setup

The application code is fully wired for Post, Spark and Vibes image/video moderation.

## Already implemented in this ZIP
- Every new Post image/video requests Cloudinary moderation.
- Every new Spark video requests video moderation.
- Every new Vibe image/video requests moderation.
- Pending or rejected media is excluded from Home, Spark, Vibes and Profile queries.
- Immediate rejects are destroyed before publication.
- Asynchronous rejects are deleted from MongoDB by the moderation webhook and the Cloudinary asset is destroyed.
- The uploader gets a Content removed notification after an asynchronous rejection.
- When moderation is ON, a failed Spark safety scan cannot fall back to an unscanned local upload.
- Callback endpoint: POST /api/moderation/cloudinary
- Webhook endpoint is protected by CHINKY_MODERATION_WEBHOOK_TOKEN.

## Production environment
Set these on the backend host:

CHINKY_CONTENT_MODERATION=on
CHINKY_PUBLIC_API_URL=https://chinkyapp.com
CHINKY_MODERATION_WEBHOOK_TOKEN=<long-random-secret>
CHINKY_IMAGE_MODERATION=aws_rek:explicit_nudity:0.65:suggestive:0.82
CHINKY_VIDEO_MODERATION=aws_rek_video:explicit_nudity:0.65:suggestive:0.82

Existing Cloudinary variables must also be valid:
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

## One Cloudinary account-side step is still required
Log in to the SAME Cloudinary product environment used by the variables above and enable:
1. Rekognition AI Moderation (images)
2. Rekognition AI Video Moderation (videos)

This cannot be enabled safely from source code because it is a Cloudinary account subscription/add-on choice.

## Verification
After deployment:
1. Upload a normal test image and normal test video. They should become approved and appear normally.
2. Check backend logs for POST /api/moderation/cloudinary callbacks.
3. Confirm pending media never appears in public feeds.
4. Test rejection only with a safe moderation test asset or by temporarily using a stricter threshold. Do not upload illegal content.
5. Confirm the rejected database item and Cloudinary asset are removed.

Do not set CHINKY_CONTENT_MODERATION=off in production.
