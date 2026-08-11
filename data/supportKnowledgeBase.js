module.exports = Object.freeze([
  {
    id: "account_access",
    category: "account",
    priority: "high",
    title: "Account access and security",
    keywords: ["login", "password", "otp", "hacked", "hack", "account locked", "sign in", "device", "session", "username"],
    answer: "Account access ke liye Password & Security screen se password reset aur active devices check karein. Password, OTP, PIN ya recovery code kabhi support chat mein share na karein.",
    actions: ["Open Settings → Password & Security", "Remove unknown active sessions", "Use Forgot password if sign-in fails"]
  },
  {
    id: "payments",
    category: "payments",
    priority: "high",
    title: "Payments, coins and withdrawals",
    keywords: ["payment", "paid", "charged", "coins", "coin", "withdraw", "withdrawal", "upi", "refund", "purchase", "money", "paisa"],
    answer: "Payment aur coin issues verification ke bina auto-resolve nahi kiye jaate. Transaction ID, platform aur approximate time batayein, lekin full card/UPI PIN share na karein. Human support is ticket ko verify karega.",
    actions: ["Keep the store/UPI transaction ID ready", "Do not repeat payment until status is checked", "Human verification required"]
  },
  {
    id: "camera_gallery",
    category: "technical",
    priority: "normal",
    title: "Camera or gallery not working",
    keywords: ["camera", "gallery", "photo", "video not showing", "permission", "record", "black camera"],
    answer: "Phone Settings → Apps → Chinky → Permissions mein Camera, Photos/Videos aur Microphone allow karein. App ko completely close karke reopen karein. Problem rahe to phone model, Android/iOS version aur exact screen batayein.",
    actions: ["Check Camera, Photos/Videos and Microphone permissions", "Restart Chinky", "Send device model and OS version if it continues"]
  },
  {
    id: "performance",
    category: "technical",
    priority: "normal",
    title: "App slow or not loading",
    keywords: ["slow", "loading", "hang", "lag", "freeze", "crash", "not open", "network", "spinner"],
    answer: "Connection switch karke aur app restart karke check karein. Debug builds release app se slow hote hain. Issue continue ho to screen name, device model, OS version aur issue ka time bhejein.",
    actions: ["Try Wi-Fi and mobile data once", "Restart the app", "Share screen name, device and issue time"]
  },
  {
    id: "posting",
    category: "technical",
    priority: "normal",
    title: "Post, Spark or Vibes upload",
    keywords: ["post", "spark", "vibes", "upload", "publish", "caption", "stuck", "failed"],
    answer: "Upload progress Home screen par dikhna chahiye. Media file delete/move na karein jab tak upload complete na ho. Failed card par Retry tap karein aur enough storage/network confirm karein.",
    actions: ["Keep the source media on the device", "Tap Retry on the failed upload", "Check storage and connection"]
  },
  {
    id: "audio_copyright",
    category: "copyright",
    priority: "high",
    title: "Audio and copyright",
    keywords: ["copyright", "audio", "music", "song", "rights", "stolen", "copy", "dmca", "royalty"],
    answer: "Sirf owned, licensed, permitted ya CHINKY Original royalty-free audio use karein. Copyright ownership/dispute AI decide nahi karega; evidence ke saath human review zaroori hai.",
    actions: ["Include the content/audio link", "Describe your ownership or licence", "Human copyright review required"]
  },
  {
    id: "safety",
    category: "safety",
    priority: "urgent",
    title: "Safety, threats or harassment",
    keywords: ["threat", "harass", "harassment", "blackmail", "abuse", "unsafe", "suicide", "self harm", "minor", "child", "violence", "danger"],
    answer: "Agar immediate danger hai to local emergency services ya trusted person se abhi contact karein. Account/content ko report aur block karein. Safety tickets human team ko urgently escalate hote hain.",
    actions: ["Contact local emergency help for immediate danger", "Block and report the account/content", "Do not delete relevant evidence"]
  },
  {
    id: "privacy",
    category: "safety",
    priority: "high",
    title: "Privacy and impersonation",
    keywords: ["privacy", "impersonation", "fake account", "personal data", "leak", "dox", "photo misuse"],
    answer: "Fake account ya personal data misuse ko profile/content menu se report karein. Relevant username/link aur screenshots preserve karein; sensitive identity documents chat mein tab tak na bhejein jab tak human agent secure method na de.",
    actions: ["Report and block the account", "Keep usernames, links and screenshots", "Human safety review required"]
  },
  {
    id: "live",
    category: "technical",
    priority: "normal",
    title: "LIVE help",
    keywords: ["live", "stream", "host", "guest", "gift", "zego", "broadcast"],
    answer: "LIVE ke liye camera/microphone permission, stable network aur eligible account required hai. Exact error, host/viewer mode aur issue time share karein.",
    actions: ["Check camera and microphone permissions", "Try a stable connection", "Share the exact LIVE error"]
  },
  {
    id: "delete_account",
    category: "account",
    priority: "normal",
    title: "Account deletion",
    keywords: ["delete account", "remove account", "close account", "terminate account"],
    answer: "Account deletion Settings ke account controls se start hoti hai. Deletion permanent ho sakti hai; proceed karne se pehle important content/data save kar lein.",
    actions: ["Open Settings → Account controls", "Review the deletion warning", "Save any content you need first"]
  }
]);
