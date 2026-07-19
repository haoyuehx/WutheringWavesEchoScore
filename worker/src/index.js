const KURO_ORIGIN = "https://api.kurobbs.com";
const ALLOWED_ORIGINS = new Set([
  "https://haoyuehx.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);
const ALLOWED_PATHS = new Set([
  "/gamer/role/list",
  "/aki/roleBox/akiBox/refreshData",
  "/aki/roleBox/akiBox/roleData",
  "/aki/roleBox/requestToken",
  "/aki/roleBox/akiBox/getRoleDetail",
  "/aki/calculator/refreshData",
  "/aki/calculator/queryOwnedRole",
  "/aki/calculator/listRole",
]);
const MAX_BODY_BYTES = 64 * 1024;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "wuthering-waves-echo-proxy" }, 200, origin);
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ code: 403, msg: "请求来源不受信任" }, 403, "");
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST" || !ALLOWED_PATHS.has(url.pathname)) {
      return json({ code: 404, msg: "接口不在代理白名单中" }, 404, origin);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ code: 413, msg: "请求体过大" }, 413, origin);
    }
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return json({ code: 413, msg: "请求体过大" }, 413, origin);
    }

    const upstreamHeaders = new Headers({
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      "source": "h5",
      "devCode": randomString(32),
    });
    copyBoundedHeader(request.headers, upstreamHeaders, "token", 4096);
    copyBoundedHeader(request.headers, upstreamHeaders, "b-at", 4096);

    try {
      const upstream = await fetch(`${KURO_ORIGIN}${url.pathname}`, {
        method: "POST",
        headers: upstreamHeaders,
        body,
        redirect: "manual",
      });
      const headers = corsHeaders(origin);
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
      headers.set("Cache-Control", "no-store");
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      return json({ code: 502, msg: "库街区上游请求失败" }, 502, origin);
    }
  },
};

function copyBoundedHeader(source, target, name, maximumLength) {
  const value = source.get(name);
  if (value && value.length <= maximumLength) target.set(name, value);
}

function corsHeaders(origin) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, token, b-at",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  if (ALLOWED_ORIGINS.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function json(value, status, origin) {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(value), { status, headers });
}

function randomString(length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
