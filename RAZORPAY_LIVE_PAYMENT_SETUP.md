# CHINKY Razorpay Live Coin Payments

Coin purchase is now hard-locked to Razorpay Live Mode.

Required production environment:
RAZORPAY_KEY=rzp_live_xxxxxxxxx
RAZORPAY_SECRET=your_live_key_secret

Important:
- `rzp_test_...` keys are rejected for coin purchases.
- Creating an order never credits coins.
- A Checkout success callback alone never credits coins.
- The backend verifies Razorpay signature, order id, payment id, amount, INR currency, payment method and captured status.
- Only after that verification is the wallet credited.
- Google Play/App Store coin verification and Manual UPI coin-request endpoints are disabled for coin purchases.
- If Live Mode is not configured, the Buy Coins screen returns an error and cannot add coins.

Generate Live keys in the Razorpay Dashboard Live Mode after KYC/account activation.
