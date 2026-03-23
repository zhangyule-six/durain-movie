const MAOYAN_BASE = "https://apis.netstart.cn/maoyan/";

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
    throw new Error("上游返回非 JSON");
  }
  if (!res.ok) {
    const msg = json?.message || `上游请求失败: ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export async function fetchTopRated() {
  const url = new URL("index/topRatedMovies", MAOYAN_BASE);
  return await fetchJson(url.toString());
}

export async function fetchOnInfoList() {
  const url = new URL("index/movieOnInfoList", MAOYAN_BASE);
  return await fetchJson(url.toString());
}

export async function fetchComingList({ ci = 1, limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 50);
  const url = new URL("index/comingList", MAOYAN_BASE);
  url.searchParams.set("ci", String(ci));
  url.searchParams.set("limit", String(safeLimit));
  return await fetchJson(url.toString());
}

export async function fetchSearchMovies({ keyword, ci = 1, offset, limit }) {
  const url = new URL("search/movies", MAOYAN_BASE);
  if (keyword) url.searchParams.set("keyword", String(keyword));
  url.searchParams.set("ci", String(ci));
  if (Number.isFinite(offset)) url.searchParams.set("offset", String(offset));
  if (Number.isFinite(limit)) url.searchParams.set("limit", String(limit));
  return await fetchJson(url.toString());
}

