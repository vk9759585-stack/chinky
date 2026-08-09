const axios = require('axios');
const jwt = require('jsonwebtoken');

const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const APPLE_PROD_URL = 'https://api.storekit.itunes.apple.com';
const APPLE_SANDBOX_URL = 'https://api.storekit-sandbox.itunes.apple.com';

const cleanPrivateKey = (value) => String(value || '').replace(/\\n/g, '\n').trim();
const decodeBase64UrlJson = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

async function googleAccessToken() {
  const email = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL;
  const privateKey = cleanPrivateKey(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY);
  if (!email || !privateKey) throw new Error('Google Play server verification is not configured.');
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign({
    iss: email,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }, privateKey, { algorithm: 'RS256' });
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const response = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    timeout: 12000,
  });
  return response.data.access_token;
}

async function verifyGoogle({ productId, purchaseToken }) {
  if (!purchaseToken) throw new Error('Google Play purchase token is missing.');
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.chinky.social';
  const accessToken = await googleAccessToken();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await axios.get(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    timeout: 12000,
  });
  const data = response.data || {};
  if (Number(data.purchaseState) !== 0) throw new Error('Google Play purchase is not in purchased state.');
  return {
    platform: 'android',
    productId,
    purchaseToken,
    transactionId: String(data.orderId || purchaseToken),
    payload: data,
  };
}

function appleBearerToken() {
  const issuerId = process.env.APPLE_IAP_ISSUER_ID;
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const bundleId = process.env.APPLE_IAP_BUNDLE_ID;
  const privateKey = cleanPrivateKey(process.env.APPLE_IAP_PRIVATE_KEY);
  if (!issuerId || !keyId || !bundleId || !privateKey) {
    throw new Error('Apple App Store server verification is not configured.');
  }
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ iss: issuerId, iat: now, exp: now + 900, aud: 'appstoreconnect-v1', bid: bundleId }, privateKey, {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: keyId, typ: 'JWT' },
  });
}

async function fetchAppleTransaction(baseUrl, transactionId, token) {
  return axios.get(`${baseUrl}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
    headers: { authorization: `Bearer ${token}` },
    timeout: 12000,
  });
}

async function verifyApple({ productId, transactionId }) {
  if (!transactionId) throw new Error('Apple transaction id is missing.');
  const token = appleBearerToken();
  let response;
  try {
    response = await fetchAppleTransaction(APPLE_PROD_URL, transactionId, token);
  } catch (err) {
    if (err?.response?.status !== 404) throw err;
    response = await fetchAppleTransaction(APPLE_SANDBOX_URL, transactionId, token);
  }
  const signed = response.data?.signedTransactionInfo;
  if (typeof signed !== 'string' || signed.split('.').length !== 3) throw new Error('Apple transaction response is invalid.');
  const payload = decodeBase64UrlJson(signed.split('.')[1]);
  const expectedBundle = process.env.APPLE_IAP_BUNDLE_ID;
  if (String(payload.productId || '') !== productId) throw new Error('Apple product id does not match.');
  if (expectedBundle && String(payload.bundleId || '') !== expectedBundle) throw new Error('Apple bundle id does not match.');
  if (String(payload.transactionId || '') !== String(transactionId)) throw new Error('Apple transaction id does not match.');
  if (payload.revocationDate) throw new Error('Apple transaction was revoked.');
  return {
    platform: 'ios',
    productId,
    transactionId: String(payload.transactionId),
    purchaseToken: '',
    payload,
  };
}

async function verifyStorePurchase({ platform, productId, purchaseId, verificationData }) {
  if (platform === 'android') {
    // in_app_purchase sends the Google Play purchase token as server verification data.
    return verifyGoogle({ productId, purchaseToken: String(verificationData || '') });
  }
  if (platform === 'ios') {
    // StoreKit purchaseID is the transaction id used with App Store Server API.
    return verifyApple({ productId, transactionId: String(purchaseId || '') });
  }
  throw new Error('Unsupported store platform.');
}

module.exports = { verifyStorePurchase };
