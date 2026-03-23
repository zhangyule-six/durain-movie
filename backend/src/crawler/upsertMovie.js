import Movie from "../models/movie.model.js";

/** MongoDB 全文索引会把字段名 `language` 当作索引语言覆盖，值必须是受支持的语言代码；WMDB 常返回「汉语普通话」等自由文本，会触发 17262。统一写入 filmLanguage。 */
function normalizeDocLanguageField(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const next = { ...doc };
  if (next.language != null && next.filmLanguage == null) {
    next.filmLanguage = String(next.language);
  }
  delete next.language;
  return next;
}

function buildMatchFilter(doc) {
  const or = [];
  if (doc?.maoyanId) or.push({ maoyanId: doc.maoyanId });
  if (doc?.doubanId) or.push({ doubanId: doc.doubanId });
  if (doc?.imdbId) or.push({ imdbId: doc.imdbId });
  if (doc?.tmdbId) or.push({ tmdbId: doc.tmdbId });

  // 弱匹配兜底：title + 年份
  if (doc?.title && doc?.releaseDate instanceof Date && !Number.isNaN(doc.releaseDate.valueOf())) {
    const year = doc.releaseDate.getUTCFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    or.push({
      title: doc.title,
      releaseDate: { $gte: start, $lt: end },
    });
  } else if (doc?.title) {
    or.push({ title: doc.title });
  }

  return or.length ? { $or: or } : null;
}

function mergeExternalRatings(next, prev) {
  const a = prev && typeof prev === "object" ? prev : {};
  const b = next && typeof next === "object" ? next : {};
  return {
    douban: typeof b.douban === "number" && b.douban > 0 ? b.douban : a.douban,
    imdb: typeof b.imdb === "number" && b.imdb > 0 ? b.imdb : a.imdb,
    maoyan: typeof b.maoyan === "number" && b.maoyan > 0 ? b.maoyan : a.maoyan,
  };
}

export async function upsertMovie(doc) {
  doc = normalizeDocLanguageField(doc);
  const filter = buildMatchFilter(doc);
  if (!filter) return null;

  const existing = await Movie.findOne(filter).exec();
  if (!existing) {
    const created = await Movie.create(doc);
    return created;
  }

  const update = normalizeDocLanguageField({ ...doc });
  // 不覆盖已有更好的数据
  if (existing.poster && !update.poster) delete update.poster;
  if (existing.summary && !update.summary) delete update.summary;

  update.externalRatings = mergeExternalRatings(update.externalRatings, existing.externalRatings);

  // genres/cast 追加去重
  if (Array.isArray(existing.genres) || Array.isArray(update.genres)) {
    const merged = Array.from(
      new Set([...(existing.genres || []), ...(update.genres || [])].map((s) => String(s).trim()).filter(Boolean)),
    );
    update.genres = merged;
  }
  if (Array.isArray(existing.cast) || Array.isArray(update.cast)) {
    const merged = Array.from(
      new Set([...(existing.cast || []), ...(update.cast || [])].map((s) => String(s).trim()).filter(Boolean)),
    ).slice(0, 50);
    update.cast = merged;
  }

  Object.assign(existing, update);
  await existing.save();
  return existing;
}

