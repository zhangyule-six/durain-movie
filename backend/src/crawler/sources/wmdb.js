const WMDB_BASE = "https://api.wmdb.tv/";

async function fetchJson(url) {
  if (typeof fetch !== "function") {
    throw new Error("Node 环境缺少 fetch，请使用 Node 18+");
  }
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("上游 WMDB 返回非 JSON");
  }
  if (!res.ok) {
    const msg = json?.message || `上游 WMDB 请求失败: ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export async function fetchWmdbSearch({ q, actor, year, lang = "Cn", limit = 10, skip = 0 }) {
  if (!q) throw new Error("缺少参数 q");
  const url = new URL("/api/v1/movie/search", WMDB_BASE);
  url.searchParams.set("q", String(q));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("skip", String(skip));
  if (lang) url.searchParams.set("lang", String(lang));
  if (actor) url.searchParams.set("actor", String(actor));
  if (year) url.searchParams.set("year", String(year));
  return await fetchJson(url.toString());
}

