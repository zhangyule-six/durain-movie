import Movie from "../models/movie.model.js";
import mongoose from "mongoose";
import {
  fetchComingList,
  fetchOnInfoList,
  fetchSearchMovies,
  fetchTopRated,
} from "../crawler/sources/maoyan.js";
import { crawlWmdbSearch } from "../crawler/index.js";

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

    let dbResult = await queryLocalWmdbLike({ q, actor, year, limit, skip });

    if (dbResult.total === 0) {
      const syncLimit = Math.min(Math.max(limit, 10), 50);
      try {
        await crawlWmdbSearch({
          q,
          actor,
          year,
          lang,
          limit: syncLimit,
          skip,
        });
        dbResult = await queryLocalWmdbLike({ q, actor, year, limit, skip });
      } catch (e) {
        console.error("wmdbSearch WMDB fallback failed:", e?.message || e);
      }
    }

    return res.json(dbResult);
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

export async function maoyanTopRated(req, res) {
  try {
    // 直连猫眼保持上游数组顺序；仅做字段映射，不再基于 Mongo/时间重排。
    const json = await fetchTopRated();
    const list = Array.isArray(json?.movieList)
      ? json.movieList
      : [];
    return res.json({
      title: "猫眼高分榜",
      movieList: list.map((m) => ({
        movieId: Number(m?.movieId ?? m?.id) || 0,
        poster: String(m?.poster ?? m?.img ?? ""),
        score: String(m?.score ?? m?.sc ?? 0),
        name: String(m?.name ?? m?.nm ?? ""),
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

export async function maoyanOnInfoList(req, res) {
  try {
    // 直连猫眼保持上游数组顺序；仅做字段映射，不再基于 Mongo/时间重排。
    const json = await fetchOnInfoList();
    const list = Array.isArray(json?.movieList) ? json.movieList : [];
    return res.json({
      total: list.length,
      movieList: list.map((m) => ({
        id: Number(m?.id ?? 0) || 0,
        img: String(m?.img ?? m?.poster ?? ""),
        nm: String(m?.nm ?? m?.name ?? ""),
        sc: typeof m?.sc === "number" ? m.sc : Number(m?.sc ?? 0) || 0,
        star: String(m?.star ?? ""),
        rt: String(m?.rt ?? ""),
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || "服务异常" });
  }
}

export async function maoyanComingList(req, res) {
  try {
    const ci = parseInt(String(req.query.ci ?? "1"), 10) || 1;
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1),
      50,
    );

    const json = await fetchComingList({ ci, limit });
    const list = Array.isArray(json?.coming)
      ? json.coming
      : Array.isArray(json?.movieList)
        ? json.movieList
        : [];

    return res.json({
      total: list.length,
      movieList: list.map((m) => ({
        id: Number(m?.id ?? m?.movieId ?? 0) || 0,
        img: String(m?.img ?? m?.poster ?? ""),
        nm: String(m?.nm ?? m?.name ?? ""),
        sc: typeof m?.sc === "number" ? m.sc : Number(m?.sc ?? 0) || 0,
        star: String(m?.star ?? ""),
        rt: String(m?.rt ?? m?.release ?? ""),
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
    const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? "20"), 10) || 20, 1),
      50,
    );

    if (!keyword) {
      return res.json({
        offset,
        limit,
        count: 0,
        hasMore: false,
        data: [],
      });
    }

    // 直连猫眼保持上游返回顺序；仅做字段映射，不再基于 Mongo/正则重排。
    const json = await fetchSearchMovies({ keyword, ci, offset, limit });
    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.movies)
        ? json.movies
        : [];

    const data = list.map((m) => ({
        id: Number(m?.id ?? 0) || 0,
        poster: String(m?.poster ?? m?.img ?? ""),
        name: String(m?.name ?? m?.nm ?? ""),
        version: "",
        wish: "",
        score:
          String(m?.score ?? m?.sc ?? 0),
        ename: String(m?.ename ?? m?.originalTitle ?? ""),
        catogary: String(m?.catogary ?? ""),
        release: String(m?.release ?? m?.rt ?? ""),
      }));

    return res.json({
      offset,
      limit,
      count: data.length,
      hasMore: data.length >= limit,
      data,
    });
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
      "title originalTitle poster summary genres filmLanguage country duration doubanId imdbId externalRatings cast releaseDate",
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
          language: m.filmLanguage || m.language || "",
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

    const y = year ? parseInt(String(year), 10) : NaN;
    const hasYear = Number.isFinite(y) && y > 0;
    const genreList = Array.isArray(genres) ? genres : [];

    let movie = await Movie.findOne({ title }).exec();

    if (movie) {
      movie.poster = poster || movie.poster || "";
      movie.summary = summary || movie.summary || "";
      movie.genres = genreList.length ? genreList : movie.genres || [];
      if (
        hasYear &&
        (!(movie.releaseDate instanceof Date) ||
          Number.isNaN(movie.releaseDate.valueOf()))
      ) {
        movie.releaseDate = new Date(`${y}-01-01`);
      }
      await movie.save();
    } else {
      movie = await Movie.findOneAndUpdate(
        { title },
        {
          $set: {
            poster: poster || "",
            summary: summary || "",
            genres: genreList,
          },
          $setOnInsert: {
            title,
            ...(hasYear ? { releaseDate: new Date(`${y}-01-01`) } : {}),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();
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
