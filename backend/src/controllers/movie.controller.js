const WMDB_BASE = "https://api.wmdb.tv/";
const MAOYAN_BASE = "https://apis.netstart.cn/maoyan/";
import Movie from "../models/movie.model.js";
import mongoose from "mongoose";

function pickWmdbQuery(req) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const actor =
    typeof req.query.actor === "string" ? req.query.actor : undefined;
  const year = typeof req.query.year === "string" ? req.query.year : undefined;
  const lang = typeof req.query.lang === "string" ? req.query.lang : "Cn";
  const limitRaw =
    typeof req.query.limit === "string" ? req.query.limit : undefined;
  const skipRaw =
    typeof req.query.skip === "string" ? req.query.skip : undefined;

  const limit = limitRaw
    ? Math.min(Math.max(parseInt(limitRaw, 10) || 10, 1), 50)
    : 10;
  const skip = skipRaw ? Math.max(parseInt(skipRaw, 10) || 0, 0) : 0;

  return { q, actor, year, lang, limit, skip };
}

export async function wmdbSearch(req, res) {
  try {
    if (typeof fetch !== "function") {
      return res
        .status(500)
        .json({ message: "Node 环境缺少 fetch，请使用 Node 18+ 运行后端" });
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
      return res
        .status(502)
        .json({ message: "上游 WMDB 返回非 JSON", raw: text?.slice?.(0, 200) });
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
      return res
        .status(500)
        .json({ message: "Node 环境缺少 fetch，请使用 Node 18+ 运行后端" });
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
      return res
        .status(502)
        .json({ message: "上游返回非 JSON", raw: text?.slice?.(0, 200) });
    }
    if (!upstream.ok) {
      return res
        .status(502)
        .json({
          message: "上游请求失败",
          status: upstream.status,
          upstream: json,
        });
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
      return res
        .status(500)
        .json({ message: "Node 环境缺少 fetch，请使用 Node 18+ 运行后端" });
    }
    const keyword =
      typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
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
      return res
        .status(502)
        .json({ message: "上游返回非 JSON", raw: text?.slice?.(0, 200) });
    }
    if (!upstream.ok) {
      return res
        .status(502)
        .json({
          message: "上游请求失败",
          status: upstream.status,
          upstream: json,
        });
    }
    return res.json(json);
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

// 根据外部影片信息查找或创建 Movie 文档
export async function ensureMovie(req, res) {
  try {
    const { title, year, poster, summary, genres } = req.body || {};

    if (!title) {
      return res.status(400).json({ message: "缺少影片标题 title" });
    }

    const query = {
      title,
    };
    if (year) {
      query.releaseDate = new Date(`${year}-01-01`);
    }

    let movie = await Movie.findOne({ title }).exec();

    if (!movie) {
      movie = await Movie.create({
        title,
        poster: poster || "",
        summary: summary || "",
        genres: Array.isArray(genres) ? genres : [],
      });
    }

    return res.json({
      _id: movie._id,
      title: movie.title,
      poster: movie.poster,
    });
  } catch (e) {
    console.error("Error in ensureMovie:", e);
    return res.status(500).json({ message: e?.message || "确保影片信息失败" });
  }
}

// 本地 Movie 模型高分榜单（按系统内评分排序）
export async function topRatedMovies(req, res) {
  try {
    const limitRaw =
      typeof req.query.limit === "string" ? req.query.limit : undefined;
    const limit = limitRaw
      ? Math.min(Math.max(parseInt(limitRaw, 10) || 10, 1), 50)
      : 10;

    const movies = await Movie.find({
      $or: [
        { "rating.count": { $gt: 0 } },
        { "rating.average": { $gt: 0 } },
      ],
    })
      .sort({
        "rating.average": -1,
        "rating.count": -1,
        createdAt: -1,
      })
      .limit(limit)
      // 同时选出简介 summary，供前端高分榜和推荐使用
      .select("title poster rating summary")
      .lean();

    const result = movies.map((m, index) => ({
      id: m._id,
      title: m.title,
      poster: m.poster || "",
      // 前端 NRate 使用 0-5，这里直接给 0-5 区间的数值；如未来改为 0-10，可在前端转换
      rating:
        typeof m.rating?.average === "number" ? m.rating.average : 0,
      rank: index + 1,
      // 为前端提供 Movie.summary 作为简介字段
      description: m.summary || "",
    }));

    return res.json(result);
  } catch (e) {
    console.error("Error in topRatedMovies:", e);
    return res
      .status(500)
      .json({ message: e?.message || "获取高分电影榜单失败" });
  }
}

// 基于标签重叠度的电影推荐（用于影片详情页相关推荐）
export async function recommendByGenres(req, res) {
  try {
    const { movieId } = req.params;
    const bodyGenres = Array.isArray(req.body?.genres) ? req.body.genres : [];
    const queryGenresRaw =
      typeof req.query.genres === "string" ? req.query.genres.split(",") : [];

    const labels = [...bodyGenres, ...queryGenresRaw]
      .map((g) => String(g || "").trim())
      .filter(Boolean);

    // 去重
    const uniqueLabels = Array.from(new Set(labels));

    if (!movieId || uniqueLabels.length === 0) {
      return res.json([]);
    }

    const movieObjectId = new mongoose.Types.ObjectId(movieId);

    const pipeline = [
      {
        $match: {
          _id: { $ne: movieObjectId },
          genres: { $in: uniqueLabels },
        },
      },
      {
        $addFields: {
          overlapCount: {
            $size: {
              $setIntersection: ["$genres", uniqueLabels],
            },
          },
        },
      },
      {
        $match: {
          overlapCount: { $gt: 0 },
        },
      },
      {
        $sort: {
          overlapCount: -1,
          "rating.average": -1,
          createdAt: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          title: 1,
          poster: 1,
          genres: 1,
        },
      },
    ];

    const movies = await Movie.aggregate(pipeline).exec();

    const result = movies.map((m) => ({
      id: m._id,
      title: m.title,
      poster: m.poster || "",
      genres: Array.isArray(m.genres) ? m.genres : [],
    }));

    return res.json(result);
  } catch (e) {
    console.error("Error in recommendByGenres:", e);
    return res
      .status(500)
      .json({ message: e?.message || "获取相关推荐影片失败" });
  }
}
