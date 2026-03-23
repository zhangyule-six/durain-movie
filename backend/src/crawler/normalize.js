/**
 * 将不同来源的数据归一到 Movie 模型字段。
 * 说明：这里不做“网页爬虫解析”，而是支持从上游 JSON（现有三方接口）采集并落库，
 * 后续如需真正爬网页，可在 sources 内替换实现而不影响落库逻辑。
 */

function safeNumber(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseGenresFromWmdb(item) {
  const first = Array.isArray(item?.data) ? item.data[0] : undefined;
  const raw = typeof first?.genre === "string" ? first.genre : "";
  return raw
    .split(/[,/|，、\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickSummaryFromWmdb(item) {
  const first = Array.isArray(item?.data) ? item.data[0] : undefined;
  return typeof first?.description === "string" ? first.description : "";
}

function pickPosterFromWmdb(item) {
  const first = Array.isArray(item?.data) ? item.data[0] : undefined;
  return typeof first?.poster === "string" ? first.poster : "";
}

function pickLanguageFromWmdb(item) {
  const first = Array.isArray(item?.data) ? item.data[0] : undefined;
  return typeof first?.language === "string" ? first.language : "";
}

function pickCountryFromWmdb(item) {
  const first = Array.isArray(item?.data) ? item.data[0] : undefined;
  return typeof first?.country === "string" ? first.country : "";
}

function pickCastFromWmdb(item) {
  const wrappers = Array.isArray(item?.actor) ? item.actor : [];
  const persons = wrappers.flatMap((w) =>
    Array.isArray(w?.data) ? w.data : [],
  );
  return persons
    .map((p) => String(p?.name || "").trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function normalizeFromMaoyanTopRated(rawItem) {
  // 目标字段对齐：frontend/src/api/types.ts -> TopRatedMovieItem
  const maoyanId = rawItem?.movieId ?? rawItem?.id;
  const title = String(rawItem?.name || rawItem?.nm || "").trim();
  const poster = String(rawItem?.poster || rawItem?.img || "").trim();
  const scoreRaw = rawItem?.score ?? rawItem?.sc ?? "";
  const score = safeNumber(scoreRaw, 0);

  return {
    title,
    poster,
    maoyanId: maoyanId != null ? String(maoyanId) : undefined,
    externalRatings: { maoyan: score },
  };
}

export function normalizeFromMaoyanOnInfoList(rawItem) {
  // 目标字段对齐：frontend/src/api/types.ts -> MovieOnInfoListItem
  const maoyanId = rawItem?.id;
  const title = String(rawItem?.nm || "").trim();
  const poster = String(rawItem?.img || "").trim();
  const score = safeNumber(rawItem?.sc, 0);
  const star = String(rawItem?.star || "").trim();
  const release = String(rawItem?.rt || "").trim();

  return {
    title,
    poster,
    maoyanId: maoyanId != null ? String(maoyanId) : undefined,
    release,
    cast: star ? star.split(/[,/|，、\s]+/g).map((s) => s.trim()).filter(Boolean) : [],
    externalRatings: { maoyan: score },
  };
}

export function normalizeFromMaoyanSearch(rawItem) {
  const maoyanId = rawItem?.id;
  const title = String(rawItem?.name || "").trim();
  const poster = String(rawItem?.poster || "").trim();
  const catogary = String(rawItem?.catogary || "").trim();
  const release = String(rawItem?.release || "").trim();
  const score = safeNumber(rawItem?.score, 0);
  const originalTitle = String(rawItem?.ename || "").trim();

  return {
    title,
    originalTitle,
    poster,
    maoyanId: maoyanId != null ? String(maoyanId) : undefined,
    catogary,
    release,
    externalRatings: { maoyan: score },
    // catogary 是字符串，genres 尽量拆一下，拆不出来也不强求
    genres: catogary
      ? catogary
          .split(/[,/|，、\s]+/g)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  };
}

export function normalizeFromWmdbItem(item) {
  // WMDB 常见：片名在 data[0].name，顶层 name 可能为空
  const firstDetail = Array.isArray(item?.data) ? item.data[0] : undefined;
  const title = String(
    firstDetail?.name || item?.originalName || item?.name || "",
  ).trim();
  const originalTitle = String(
    item?.originalName || firstDetail?.name || item?.name || "",
  ).trim();
  const yearStr = String(item?.year || "").trim();
  const releaseDate =
    yearStr && /^\d{4}$/.test(yearStr) ? new Date(`${yearStr}-01-01`) : undefined;

  return {
    title,
    originalTitle,
    poster: pickPosterFromWmdb(item),
    summary: pickSummaryFromWmdb(item),
    genres: parseGenresFromWmdb(item),
    filmLanguage: pickLanguageFromWmdb(item),
    country: pickCountryFromWmdb(item),
    duration: safeNumber(item?.duration, 0),
    cast: pickCastFromWmdb(item),
    doubanId: item?.doubanId ? String(item.doubanId) : undefined,
    imdbId: item?.imdbId ? String(item.imdbId) : undefined,
    externalRatings: {
      douban: safeNumber(item?.doubanRating, 0),
      imdb: safeNumber(item?.imdbRating, 0),
    },
    releaseDate,
  };
}

