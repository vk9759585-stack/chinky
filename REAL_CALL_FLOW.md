# CHINKY real call flow

This build no longer depends on a Home-screen-only incoming call listener.

Flow:
1. Caller creates a backend call record.
2. Backend sends the incoming call through Socket.IO immediately.
3. Backend also sends a high-priority FCM incoming-call notification for background/socket fallback.
4. A global Flutter call host listens across the signed-in app.
5. Receiver gets IncomingCallScreen with caller name/photo and foreground ring/vibration.
6. Reject updates backend and caller receives reject state.
7. Accept updates backend first.
8. Caller detects acceptance by socket plus backend status polling.
9. Only after acceptance do both users join the ZEGOCLOUD RTC call room.
10. Unanswered calls become missed; hangup is synced to both sides.

For true OS-level lock-screen calling while the app is killed, ZEGOCLOUD Call Invitation
Service + zego_uikit_signaling_plugin and platform push configuration are the next layer.
This source currently provides real foreground/background app calling with FCM fallback
using the existing dependencies in this ZIP.
