import Movie from "../models/movie.model.js";
import mongoose from "mongoose";
import {
  crawlMaoyanOnInfoList,
  crawlMaoyanSearch,
  crawlMaoyanTopRated,
  crawlWmdbSearch,
} from "../crawler/index.js";

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
    const { q, actor, year, lang, limit, skip } = pickWmdbQuery(req);
    if (!q) return res.status(400).json({ message: "缺少参数 q" });

    // 先从本地库检索；若结果不足，自动从上游拉取并入库，再次查询（缓存穿透）
    const dbResult = await queryLocalWmdbLike({ q, actor, year, limit, skip });
    if (dbResult.data.length >= Math.min(limit, 5)) {
      return res.json(dbResult);
    }

    // 触发一次采集（基于原查询条件），然后再读库返回
    try {
      await crawlWmdbSearch({ q, actor, year, lang, limit, skip });
    } catch {
      // 采集失败不阻断：继续返回本地已有数据
    }

    const refreshed = await queryLocalWmdbLike({ q, actor, year, limit, skip });
    return res.json(refreshed);
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

export async function maoyanTopRated(req, res) {
  try {
    const limit = 50;
    const list = await Movie.find({
      $or: [
        { "externalRatings.maoyan": { $gt: 0 } },
        { maoyanId: { $exists: true, $ne: "" } },
      ],
    })
      .sort({
        "externalRatings.maoyan": -1,
        createdAt: -1,
      })
      .limit(limit)
      .select("title poster externalRatings maoyanId")
      .lean();

    if (list.length === 0) {
      try {
        await crawlMaoyanTopRated({ limit: 50 });
      } catch {
        // ignore
      }
    }

    const refreshed = list.length
      ? list
      : await Movie.find({
          $or: [
            { "externalRatings.maoyan": { $gt: 0 } },
            { maoyanId: { $exists: true, $ne: "" } },
          ],
        })
          .sort({
            "externalRatings.maoyan": -1,
            createdAt: -1,
          })
          .limit(limit)
          .select("title poster externalRatings maoyanId")
          .lean();

    return res.json({
      title: "猫眼高分榜",
      movieList: refreshed.map((m) => ({
        movieId: Number(m.maoyanId) || 0,
        poster: m.poster || "",
        score:
          typeof m.externalRatings?.maoyan === "number"
            ? String(m.externalRatings.maoyan)
            : "0",
        name: m.title,
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

export async function maoyanOnInfoList(req, res) {
  try {
    const limit = 50;
    const list = await Movie.find({
      $or: [{ release: { $exists: true, $ne: "" } }, { releaseDate: { $exists: true } }],
    })
      .sort({ releaseDate: -1, createdAt: -1 })
      .limit(limit)
      .select("title poster externalRatings cast release maoyanId")
      .lean();

    if (list.length === 0) {
      try {
        await crawlMaoyanOnInfoList({ limit: 50 });
      } catch {
        // ignore
      }
    }

    const refreshed = list.length
      ? list
      : await Movie.find({
          $or: [{ release: { $exists: true, $ne: "" } }, { releaseDate: { $exists: true } }],
        })
          .sort({ releaseDate: -1, createdAt: -1 })
          .limit(limit)
          .select("title poster externalRatings cast release maoyanId")
          .lean();

    return res.json({
      total: refreshed.length,
      movieList: refreshed.map((m) => ({
        id: Number(m.maoyanId) || 0,
        img: m.poster || "",
        nm: m.title,
        sc: typeof m.externalRatings?.maoyan === "number" ? m.externalRatings.maoyan : 0,
        star: Array.isArray(m.cast) ? m.cast.slice(0, 6).join(", ") : "",
        rt: m.release || "",
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

export async function maoyanSearchMovies(req, res) {
  try {
    const keyword =
      typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
    const ci = parseInt(String(req.query.ci ?? "1"), 10) || 1;

    if (!keyword) return res.json([]);

    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    let list = await Movie.find({
      $or: [{ title: regex }, { originalTitle: regex }],
    })
      .limit(30)
      .select("title originalTitle poster externalRatings maoyanId catogary release")
      .lean();

    if (list.length === 0) {
      try {
        await crawlMaoyanSearch({ keyword, ci, limit: 50 });
      } catch {
        // ignore
      }
      list = await Movie.find({
        $or: [{ title: regex }, { originalTitle: regex }],
      })
        .limit(30)
        .select("title originalTitle poster externalRatings maoyanId catogary release")
        .lean();
    }

    return res.json(
      list.map((m) => ({
        id: Number(m.maoyanId) || 0,
        poster: m.poster || "",
        name: m.title,
        version: "",
        wish: "",
        score:
          typeof m.externalRatings?.maoyan === "number"
            ? String(m.externalRatings.maoyan)
            : "0",
        ename: m.originalTitle || "",
        catogary: m.catogary || "",
        release: m.release || "",
      })),
    );
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

async function queryLocalWmdbLike({ q, actor, year, limit, skip }) {
  const and = [];

  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    and.push({
      $or: [{ title: regex }, { originalTitle: regex }, { summary: regex }],
    });
  }
  if (actor) {
    const regex = new RegExp(actor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    and.push({ cast: { $elemMatch: { $regex: regex } } });
  }
  if (year && /^\d{4}$/.test(String(year))) {
    const y = parseInt(String(year), 10);
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y + 1, 0, 1));
    and.push({ releaseDate: { $gte: start, $lt: end } });
  }

  const filter = and.length ? { $and: and } : {};
  const total = await Movie.countDocuments(filter).exec();

  const list = await Movie.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "title originalTitle poster summary genres language country duration doubanId imdbId externalRatings cast releaseDate",
    )
    .lean();

  // 兼容前端的 MovieSearchResponse / MovieItem（字段缺失则给合理默认值）
  const data = list.map((m) => {
    const yearStr =
      m.releaseDate instanceof Date && !Number.isNaN(m.releaseDate.valueOf())
        ? String(m.releaseDate.getUTCFullYear())
        : "";
    const genreStr = Array.isArray(m.genres) ? m.genres.join(",") : "";

    return {
      originalName: m.originalTitle || m.title,
      imdbVotes: 0,
      imdbRating:
        typeof m.externalRatings?.imdb === "number"
          ? String(m.externalRatings.imdb)
          : "0",
      rottenRating: "0",
      rottenVotes: 0,
      year: yearStr,
      imdbId: m.imdbId || "",
      alias: "",
      doubanId: m.doubanId || "",
      type: genreStr,
      doubanRating:
        typeof m.externalRatings?.douban === "number"
          ? String(m.externalRatings.douban)
          : "0",
      doubanVotes: 0,
      duration: typeof m.duration === "number" ? m.duration : 0,
      episodes: 0,
      totalSeasons: 0,
      dateReleased: yearStr ? `${yearStr}-01-01` : "",
      data: [
        {
          poster: m.poster || "",
          name: m.title,
          genre: genreStr,
          description: m.summary || "",
          language: m.language || "",
          country: m.country || "",
          lang: "Cn",
        },
      ],
      writer: [],
      actor: [
        {
          data: (Array.isArray(m.cast) ? m.cast : []).slice(0, 20).map((name) => ({
            name,
            lang: "Cn",
          })),
        },
      ],
      director: [],
    };
  });

  const totalPages = limit ? Math.ceil(total / limit) : 0;
  const page = limit ? Math.floor(skip / limit) + 1 : 1;
  const hasMore = skip + data.length < total;

  return {
    total,
    page,
    limit,
    skip,
    count: data.length,
    totalPages,
    hasMore,
    data,
  };
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
