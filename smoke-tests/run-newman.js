const args = process.argv.slice(2);
const folderIndex = args.indexOf('--folder');
const folderName = folderIndex >= 0 ? args[folderIndex + 1] : null;

const baseUrl = (process.env.SMOKE_BASE_URL || process.env.BASE_URL || 'https://chinky.onrender.com')
  .replace(/\/+$/, '');
const login = process.env.SMOKE_LOGIN || '';
const password = process.env.SMOKE_PASSWORD || '';
const searchQuery = process.env.SMOKE_SEARCH_QUERY || 'test';

if (!folderName && (!login || !password)) {
  console.error('Missing credentials for full smoke run. Set SMOKE_LOGIN and SMOKE_PASSWORD.');
  process.exit(1);
}

const defaultHeaders = {
  Accept: 'application/json',
};

async function request(name, path, options = {}, allowed = [200]) {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (_) {
      body = text;
    }

    if (!allowed.includes(response.status)) {
      const detail = typeof body === 'string' ? body : JSON.stringify(body);
      throw new Error(`${name} failed with ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    console.log(`PASS ${name} -> ${response.status}`);
    return { response, body };
  } finally {
    clearTimeout(timeout);
  }
}

async function runHealthChecks() {
  await request('Root', '/', {}, [200, 301, 302]);
  await request('Health', '/health', {}, [200, 503]);
  const config = await request('Health Config', '/health/config', {}, [200, 503]);
  if (!config.body || typeof config.body !== 'object') {
    throw new Error('Health Config did not return a JSON object');
  }
}

async function runFullChecks() {
  const loginResult = await request(
    'Login',
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    },
    [200],
  );

  const token = loginResult.body?.token;
  if (!token) {
    throw new Error('Login response did not include token');
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  await request('Get Profile', '/api/profile', { headers: authHeaders }, [200]);
  await request('My Content', '/api/profile/content', { headers: authHeaders }, [200]);
  await request('Flow Feed', '/api/flow', { headers: authHeaders }, [200]);
  await request(
    'Search',
    `/api/search?query=${encodeURIComponent(searchQuery)}`,
    { headers: authHeaders },
    [200],
  );
  await request('Coins Checkout Config', '/api/payment/coins/config', { headers: authHeaders }, [200, 503]);
  await request('Spark Feed', '/api/spark', { headers: authHeaders }, [200]);
}

(async () => {
  try {
    if (folderName === 'Health') {
      await runHealthChecks();
    } else {
      await runHealthChecks();
      await runFullChecks();
    }
    process.exit(0);
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exit(1);
  }
})();
