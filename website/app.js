const root = document.documentElement;
const body = document.body;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("chinky-theme", theme);
  const toggle = $("[data-theme-toggle]");
  if (toggle) toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101017" : "#f8f8fb");
}

const savedTheme = localStorage.getItem("chinky-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
setTheme(savedTheme || preferredTheme);

$("[data-theme-toggle]")?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

const header = $("[data-header]");
const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 16);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const menuToggle = $("[data-menu-toggle]");
const mobileMenu = $("[data-mobile-menu]");

function closeMenu() {
  menuToggle?.setAttribute("aria-expanded", "false");
  mobileMenu?.classList.remove("is-open");
  body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu?.classList.toggle("is-open", !isOpen);
  body.classList.toggle("menu-open", !isOpen);
});

$$('[data-mobile-menu] a').forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("resize", () => {
  if (window.innerWidth > 1050) closeMenu();
});

const revealElements = $$('[data-reveal]');
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.revealDelay || 0);
        window.setTimeout(() => entry.target.classList.add("is-visible"), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.13 },
  );
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const demoTabs = $$('[data-demo-tab]');
const demoPanels = $$('[data-demo-panel]');

function showDemo(name) {
  demoTabs.forEach((tab) => {
    const selected = tab.dataset.demoTab === name;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });

  demoPanels.forEach((panel) => {
    const selected = panel.dataset.demoPanel === name;
    panel.hidden = !selected;
    panel.classList.toggle("is-active", selected);
  });
}

demoTabs.forEach((tab) => tab.addEventListener("click", () => showDemo(tab.dataset.demoTab)));

const likeButton = $("[data-like-button]");
const likeIcon = $("[data-like-icon]");
const likeCount = $("[data-like-count]");
let liked = false;

likeButton?.addEventListener("click", () => {
  liked = !liked;
  likeButton.classList.toggle("is-liked", liked);
  likeIcon.textContent = liked ? "♥" : "♡";
  likeCount.textContent = liked ? "1,285 likes" : "1,284 likes";
  showToast(liked ? "Added to your likes" : "Removed from your likes");
});

const sparkPlay = $("[data-spark-play]");
sparkPlay?.addEventListener("click", () => {
  const playing = sparkPlay.classList.toggle("is-playing");
  sparkPlay.setAttribute("aria-label", playing ? "Pause Spark" : "Play Spark");
  showToast(playing ? "Spark playing" : "Spark paused");
});

const sparkLike = $("[data-spark-like]");
sparkLike?.addEventListener("click", () => {
  const isLiked = sparkLike.classList.toggle("is-liked");
  sparkLike.childNodes[0].nodeValue = isLiked ? "♥" : "♡";
  sparkLike.style.color = isLiked ? "#ff3d7f" : "white";
});

const chatForm = $("[data-chat-form]");
const chatInput = $("#chat-input");
const chatMessages = $("[data-chat-messages]");

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  const bubble = document.createElement("div");
  bubble.className = "bubble bubble--out";
  bubble.textContent = message;
  chatMessages.appendChild(bubble);
  chatInput.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  window.setTimeout(() => {
    const reply = document.createElement("div");
    reply.className = "bubble bubble--in";
    reply.textContent = "Love it — see you there! 💗";
    chatMessages.appendChild(reply);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 700);
});

const storyModal = $("[data-story-modal]");

function openStory() {
  storyModal.hidden = false;
  body.classList.add("modal-open");
  $("[data-story-close]", storyModal)?.focus();
}

function closeStory() {
  storyModal.hidden = true;
  body.classList.remove("modal-open");
}

$("[data-preview-button]")?.addEventListener("click", openStory);
$$('[data-story-close]').forEach((button) => button.addEventListener("click", closeStory));
storyModal?.addEventListener("click", (event) => {
  if (event.target === storyModal) closeStory();
});

const legalContent = {
  privacy: `
    <h2>Privacy policy</h2>
    <p>CHINKY respects your privacy. We may collect details such as your name, email address, phone number, profile picture, posts, and messages when you use the service.</p>
    <h3>How information is used</h3>
    <ul><li>Login, registration, and account recovery</li><li>OTP verification and user support</li><li>Improving security and service reliability</li></ul>
    <p>CHINKY does not sell user data. For privacy questions or account-deletion requests, email <a href="mailto:appchinky@gmail.com">appchinky@gmail.com</a>.</p>
  `,
  terms: `
    <h2>Terms of service</h2>
    <p>By creating an account or using CHINKY, you agree to use the service lawfully and responsibly.</p>
    <h3>Your account and content</h3>
    <ul><li>Keep your login credentials secure and provide accurate account information.</li><li>Only upload content you have the right to share.</li><li>Do not post illegal, abusive, deceptive, or harmful content.</li></ul>
    <p>You keep ownership of your content while granting CHINKY the permissions needed to host, process, display, and deliver it through the service. Features may change as CHINKY improves.</p>
    <p>Contact: <a href="mailto:appchinky@gmail.com">appchinky@gmail.com</a></p>
  `,
  audio: `
    <h2>Audio policy</h2>
    <p>Upload only audio you created, own, licensed, or otherwise have permission to use.</p>
    <ul><li>Original audio from a public Spark may be saved and reused when marked reusable.</li><li>The original creator remains credited on reused audio.</li><li>Saving audio does not transfer copyright or ownership.</li><li>Reported or restricted audio may be blocked or removed.</li><li>Do not reuse a person's voice in a misleading, impersonating, or harmful way.</li></ul>
    <p>Report audio or copyright concerns at <a href="mailto:appchinky@gmail.com">appchinky@gmail.com</a>.</p>
  `,
};

const legalDialog = $("[data-legal-dialog]");
const dialogContent = $("[data-dialog-content]");

$$('[data-legal]').forEach((button) => {
  button.addEventListener("click", () => {
    dialogContent.innerHTML = legalContent[button.dataset.legal];
    legalDialog.showModal();
  });
});

$("[data-dialog-close]")?.addEventListener("click", () => legalDialog.close());
legalDialog?.addEventListener("click", (event) => {
  const box = legalDialog.getBoundingClientRect();
  const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  if (outside) legalDialog.close();
});

const toast = $("[data-toast]");
let toastTimer;
function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

$("[data-waitlist-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const input = $("input", event.currentTarget);
  const submit = $('button[type="submit"]', form);
  const valid = input.validity.valid;
  input.classList.toggle("is-invalid", !valid);
  if (!valid) {
    showToast("Please enter a valid email address");
    input.focus();
    return;
  }
  submit.disabled = true;
  submit.textContent = "Joining…";
  try {
    const response = await fetch("/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: input.value.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.message || "Could not join the waitlist");
    showToast(data.message || "You are on the CHINKY waitlist!");
    form.reset();
  } catch (error) {
    showToast(error.message || "Could not join the waitlist. Please try again.");
  } finally {
    submit.disabled = false;
    submit.innerHTML = "Notify me <span>↗</span>";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!storyModal?.hidden) closeStory();
  closeMenu();
});

$("[data-year]").textContent = new Date().getFullYear();


// =========================
// Secure website authentication
// =========================
const authDialog = $("[data-auth-dialog]");
const authError = $("[data-auth-error]");
const authButtons = $$('[data-auth-open]');
const accountDialog = $("[data-account-dialog]");
const accountStatus = $("[data-account-status]");
const accountTabs = $$('[data-account-tab]');
const accountPanels = $$('[data-account-panel]');
let currentUser = null;
let dashboardLoaded = false;

function setAuthError(message = "") {
  if (authError) authError.textContent = message;
}

function setAuthenticated(user) {
  currentUser = user || null;
  authButtons.forEach((button) => {
    button.textContent = currentUser?.username ? `@${currentUser.username}` : currentUser ? "Account" : "Log in";
    button.setAttribute("aria-label", currentUser ? "Open your CHINKY account" : "Log in to CHINKY");
  });
  if (!currentUser) dashboardLoaded = false;
}

function openAuth() {
  closeMenu();
  setAuthError();
  if (accountDialog?.open) accountDialog.close();
  if (authDialog && !authDialog.open) authDialog.showModal();
  window.setTimeout(() => authDialog?.querySelector('input[name="login"]')?.focus(), 0);
}

function openAccount() {
  closeMenu();
  if (!currentUser) return openAuth();
  if (accountDialog && !accountDialog.open) accountDialog.showModal();
  if (!dashboardLoaded) loadDashboard();
}

authButtons.forEach((button) => button.addEventListener("click", () => currentUser ? openAccount() : openAuth()));
$("[data-auth-close]")?.addEventListener("click", () => authDialog?.close());
$("[data-account-close]")?.addEventListener("click", () => accountDialog?.close());

authDialog?.addEventListener("click", (event) => {
  const box = authDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) authDialog.close();
});

accountDialog?.addEventListener("click", (event) => {
  const box = accountDialog.getBoundingClientRect();
  if (event.target === accountDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) accountDialog.close();
});

function showAccountStatus(message = "", error = false) {
  if (!accountStatus) return;
  accountStatus.hidden = !message;
  accountStatus.textContent = message;
  accountStatus.classList.toggle("is-error", error);
}

function countOf(value) {
  if (Array.isArray(value)) return value.length;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function compactCount(value) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(countOf(value));
}

function safeMediaUrl(value) {
  try {
    const url = new URL(String(value || ""), window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch (_) {
    return "";
  }
}

function initials(value) {
  const clean = String(value || "C").trim();
  return (clean[0] || "C").toUpperCase();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function userAvatar(user = {}, className = "web-post-user") {
  const avatar = document.createElement("span");
  avatar.className = className;
  const url = safeMediaUrl(user.profileImage);
  if (url) {
    const image = document.createElement("img");
    image.src = url;
    image.alt = "";
    image.loading = "lazy";
    avatar.appendChild(image);
  } else {
    avatar.textContent = initials(user.username || user.name);
  }
  return avatar;
}

function emptyState(message) {
  const empty = document.createElement("div");
  empty.className = "account-empty";
  empty.textContent = message;
  return empty;
}

async function accountRequest(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    setAuthenticated(null);
    if (accountDialog?.open) accountDialog.close();
    openAuth();
    throw new Error("Your session expired. Please log in again.");
  }
  if (!response.ok || !data.success) throw new Error(data.message || "Could not load this section");
  return data;
}

function showAccountPanel(name) {
  accountTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.accountTab === name));
  accountPanels.forEach((panel) => {
    const active = panel.dataset.accountPanel === name;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  $(".account-main", accountDialog)?.scrollTo({ top: 0, behavior: "smooth" });
}

accountTabs.forEach((tab) => tab.addEventListener("click", () => showAccountPanel(tab.dataset.accountTab)));
$$('[data-account-jump]').forEach((button) => button.addEventListener("click", () => showAccountPanel(button.dataset.accountJump)));

function renderProfile(profile = {}) {
  const name = profile.name || profile.username || currentUser?.name || "CHINKY user";
  const username = profile.username || currentUser?.username || "chinky";
  $("[data-account-name]").textContent = name;
  $("[data-account-username]").textContent = `@${username}`;
  $("[data-profile-display-name]").textContent = `Welcome, ${name}`;
  $("[data-profile-bio]").textContent = profile.bio || "Share something new or see what your people are creating.";
  $("[data-stat-posts]").textContent = compactCount(profile.postCount);
  $("[data-stat-sparks]").textContent = compactCount(profile.sparkCount);
  $("[data-stat-followers]").textContent = compactCount(profile.followersCount ?? profile.followers);
  $("[data-stat-following]").textContent = compactCount(profile.followingCount ?? profile.following);
  const avatarHost = $("[data-account-avatar]");
  avatarHost.replaceChildren(...userAvatar(profile, "account-avatar").childNodes);
  if (!avatarHost.children.length) avatarHost.textContent = initials(username);
}

function mediaElement(item, className) {
  const isVideo = item.mediaType === "video" || Boolean(item.video);
  const url = safeMediaUrl(item.video || item.image || item.media || item.thumbnail);
  if (!url) {
    const fallback = document.createElement("div");
    fallback.className = `${className} account-empty`;
    fallback.textContent = isVideo ? "Video unavailable" : "Media unavailable";
    return fallback;
  }
  const media = document.createElement(isVideo ? "video" : "img");
  media.className = className;
  media.src = url;
  if (isVideo) {
    media.controls = true;
    media.preload = "metadata";
    const poster = safeMediaUrl(item.thumbnail);
    if (poster) media.poster = poster;
  } else {
    media.alt = item.caption || "CHINKY post";
    media.loading = "lazy";
  }
  return media;
}

function actionButton(label, icon, action, id, active = false, count = null) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.dataset.webAction = action;
  button.dataset.itemId = id;
  button.classList.toggle("is-active", active);
  button.textContent = count === null ? icon : `${icon} ${compactCount(count)}`;
  return button;
}

function renderFeed(posts = []) {
  const host = $("[data-flow-content]");
  host.replaceChildren();
  $("[data-flow-count]").textContent = `${posts.length} latest`;
  if (!posts.length) return host.appendChild(emptyState("No Flow posts yet. Open CHINKY on mobile to create the first one."));
  posts.slice(0, 18).forEach((post) => {
    const owner = typeof post.user === "object" ? post.user : {};
    const username = owner.username || post.username || "chinky_user";
    const card = document.createElement("article");
    card.className = "web-post-card";
    const head = document.createElement("header");
    head.className = "web-post-head";
    head.appendChild(userAvatar(owner));
    const identity = document.createElement("div");
    const bold = document.createElement("b");
    bold.textContent = `@${username}`;
    const date = document.createElement("small");
    date.textContent = `${post.location || "CHINKY"} · ${formatDate(post.createdAt)}`;
    identity.append(bold, date);
    head.appendChild(identity);
    const actions = document.createElement("div");
    actions.className = "web-post-actions";
    actions.append(
      actionButton("Like post", post.liked ? "♥" : "♡", "flow-like", post._id || post.id, post.liked, post.likes),
      actionButton("Save post", post.saved ? "▣" : "▢", "flow-save", post._id || post.id, post.saved),
    );
    const caption = document.createElement("p");
    caption.className = "web-post-caption";
    const captionUser = document.createElement("b");
    captionUser.textContent = username;
    caption.append(captionUser, document.createTextNode(post.caption ? ` ${post.caption}` : " shared a new moment."));
    card.append(head, mediaElement(post, "web-post-media"), actions, caption);
    host.appendChild(card);
  });
}

function renderSparks(sparks = []) {
  const host = $("[data-sparks-content]");
  host.replaceChildren();
  $("[data-sparks-count]").textContent = `${sparks.length} latest`;
  if (!sparks.length) return host.appendChild(emptyState("No Sparks available right now."));
  sparks.slice(0, 18).forEach((spark) => {
    const owner = typeof spark.user === "object" ? spark.user : {};
    const id = spark._id || spark.id;
    const card = document.createElement("article");
    card.className = "web-spark-card";
    const media = mediaElement(spark, "web-spark-media");
    const info = document.createElement("div");
    info.className = "web-spark-info";
    const creator = document.createElement("b");
    creator.textContent = `@${owner.username || spark.username || "creator"}`;
    const caption = document.createElement("p");
    caption.textContent = spark.caption || spark.music || "Original Spark";
    const actions = document.createElement("div");
    actions.className = "web-spark-actions";
    actions.append(
      actionButton("Like Spark", spark.liked ? "♥" : "♡", "spark-like", id, spark.liked, spark.likes),
      actionButton("Save Spark", spark.saved ? "Saved" : "Save", "spark-save", id, spark.saved),
    );
    info.append(creator, caption, actions);
    card.append(media, info);
    host.appendChild(card);
  });
}

function renderMessages(conversations = []) {
  const host = $("[data-messages-content]");
  host.replaceChildren();
  $("[data-messages-count]").textContent = `${conversations.length} conversations`;
  if (!conversations.length) return host.appendChild(emptyState("No conversations yet. Start one in the CHINKY mobile app."));
  conversations.forEach((conversation) => {
    const row = document.createElement("article");
    row.className = "web-conversation";
    row.appendChild(userAvatar(conversation));
    const copy = document.createElement("div");
    const username = document.createElement("b");
    username.textContent = conversation.username || "CHINKY user";
    const message = document.createElement("p");
    message.textContent = conversation.lastMessage || "Media message";
    copy.append(username, message);
    const time = document.createElement("time");
    time.textContent = formatDate(conversation.createdAt);
    row.append(copy, time);
    host.appendChild(row);
  });
}

async function loadDashboard(force = false) {
  if (dashboardLoaded && !force) return;
  showAccountStatus("Loading your CHINKY space…");
  const requests = await Promise.allSettled([
    accountRequest("/web/profile"),
    accountRequest("/web/feed"),
    accountRequest("/web/sparks"),
    accountRequest("/web/conversations"),
  ]);
  const [profileResult, feedResult, sparksResult, messagesResult] = requests;
  if (profileResult.status === "fulfilled") renderProfile(profileResult.value.data || {});
  if (feedResult.status === "fulfilled") renderFeed(feedResult.value.data || []);
  else renderFeed([]);
  if (sparksResult.status === "fulfilled") renderSparks(sparksResult.value.data || []);
  else renderSparks([]);
  if (messagesResult.status === "fulfilled") renderMessages(messagesResult.value.data || []);
  else renderMessages([]);
  const failures = requests.filter((result) => result.status === "rejected");
  if (failures.length === requests.length) {
    showAccountStatus(failures[0].reason?.message || "Could not load your account", true);
    return;
  }
  dashboardLoaded = true;
  showAccountStatus(failures.length ? "Some account sections could not be loaded. Use refresh to try again." : "");
}

$("[data-account-refresh]")?.addEventListener("click", () => {
  dashboardLoaded = false;
  loadDashboard(true);
});

accountDialog?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-web-action]");
  if (!button || button.disabled) return;
  const endpoints = {
    "flow-like": [`/web/flow/${button.dataset.itemId}/like`, "POST"],
    "flow-save": [`/web/flow/${button.dataset.itemId}/save`, "POST"],
    "spark-like": [`/web/sparks/${button.dataset.itemId}/like`, "PUT"],
    "spark-save": [`/web/sparks/${button.dataset.itemId}/save`, "PUT"],
  };
  const config = endpoints[button.dataset.webAction];
  if (!config) return;
  button.disabled = true;
  try {
    const data = await accountRequest(config[0], { method: config[1], headers: { "Content-Type": "application/json" }, body: "{}" });
    const active = data.liked ?? data.saved ?? !button.classList.contains("is-active");
    button.classList.toggle("is-active", active);
    if (button.dataset.webAction.endsWith("like")) button.textContent = `${active ? "♥" : "♡"} ${compactCount(data.likes)}`;
    else button.textContent = active ? (button.dataset.webAction.startsWith("spark") ? "Saved" : "▣") : (button.dataset.webAction.startsWith("spark") ? "Save" : "▢");
  } catch (error) {
    showAccountStatus(error.message, true);
  } finally {
    button.disabled = false;
  }
});

$("[data-login-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthError();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const login = form.elements.login.value.trim();
  const password = form.elements.password.value;
  if (!login || !password) return setAuthError("Enter your login and password.");
  submit.disabled = true;
  submit.textContent = "Signing in…";
  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ login, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setAuthError(data.message || "Unable to sign in. Check your details and try again.");
      return;
    }
    form.reset();
    authDialog.close();
    showToast(`Welcome${data.user?.name ? `, ${data.user.name}` : ""}!`);
    setAuthenticated(data.user);
    dashboardLoaded = false;
    openAccount();
  } catch (_) {
    setAuthError("CHINKY is temporarily unavailable. Please try again.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Log in securely";
  }
});

async function logout() {
  try {
    await fetch("/auth/logout", { method: "POST", credentials: "same-origin" });
  } finally {
    setAuthenticated(null);
    accountDialog?.close();
    showToast("You have been logged out safely.");
  }
}

$$('[data-account-logout]').forEach((button) => button.addEventListener("click", logout));

(async () => {
  try {
    const response = await fetch("/auth/session", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.success && data.user) setAuthenticated(data.user);
  } catch (_) {}
})();
