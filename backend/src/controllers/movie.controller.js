const WMDB_BASE = "https://api.wmdb.tv/";
const MAOYAN_BASE = "https://apis.netstart.cn/maoyan/";

function pickWmdbQuery(req) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const actor = typeof req.query.actor === "string" ? req.query.actor : undefined;
  const year = typeof req.query.year === "string" ? req.query.year : undefined;
  const lang = typeof req.query.lang === "string" ? req.query.lang : "Cn";
  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : undefined;
  const skipRaw = typeof req.query.skip === "string" ? req.query.skip : undefined;

  const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 10, 1), 50) : 10;
  const skip = skipRaw ? Math.max(parseInt(skipRaw, 10) || 0, 0) : 0;

  return { q, actor, year, lang, limit, skip };
}

export async function wmdbSearch(req, res) {
  try {
    if (typeof fetch !== "function") {
      return res.status(500).json({ message: "Node 环境缺少 fetch，请使用 Node 18+ 运行后端" });
    }

    const { q, actor, year, lang, limit, skip } = pickWmdbQuery(req);
    if (!q) return res.status(400).json({ message: "缺少参数 q" });

    const url = new URL("/api/v1/movie/search", WMDB_BASE);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("skip", String(skip));
    if (lang) url.searchParams.set("lang", lang);
    if (actor) url.searchParams.set("actor", actor);
    if (year) url.searchParams.set("year", year);

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const text = await upstream.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return res.status(502).json({ message: "上游 WMDB 返回非 JSON", raw: text?.slice?.(0, 200) });
    }

    if (!upstream.ok) {
      return res.status(502).json({
        message: "上游 WMDB 请求失败",
        status: upstream.status,
        upstream: json,
      });
    }

    return res.json(json);
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

async function proxyMaoyan(path, req, res) {
  try {
    if (typeof fetch !== "function") {
      return res.status(500).json({ message: "Node 环境缺少 fetch，请使用 Node 18+ 运行后端" });
    }
    const url = new URL(path, MAOYAN_BASE);
    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await upstream.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      return res.status(502).json({ message: "上游返回非 JSON", raw: text?.slice?.(0, 200) });
    }
    if (!upstream.ok) {
      return res.status(502).json({ message: "上游请求失败", status: upstream.status, upstream: json });
    }
    return res.json(json);
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

export async function maoyanTopRated(req, res) {
  return proxyMaoyan("index/topRatedMovies", req, res);
}

export async function maoyanOnInfoList(req, res) {
  return proxyMaoyan("index/movieOnInfoList", req, res);
}

export async function maoyanSearchMovies(req, res) {
  try {
    if (typeof fetch !== "function") {
      return res.status(500).json({ message: "Node 环境缺少 fetch，请使用 Node 18+ 运行后端" });
    }
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
    const ci = typeof req.query.ci !== "undefined" ? req.query.ci : 1;
    const url = new URL("search/movies", MAOYAN_BASE);
    if (keyword) url.searchParams.set("keyword", keyword);
    url.searchParams.set("ci", String(ci));

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await upstream.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : [];
    } catch {
      return res.status(502).json({ message: "上游返回非 JSON", raw: text?.slice?.(0, 200) });
    }
    if (!upstream.ok) {
      return res.status(502).json({ message: "上游请求失败", status: upstream.status, upstream: json });
    }
    return res.json(json);
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}
