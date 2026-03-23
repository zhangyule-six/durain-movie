import { fetchTopRated, fetchOnInfoList, fetchSearchMovies } from "./sources/maoyan.js";
import { fetchWmdbSearch } from "./sources/wmdb.js";
import {
  normalizeFromMaoyanTopRated,
  normalizeFromMaoyanOnInfoList,
  normalizeFromMaoyanSearch,
  normalizeFromWmdbItem,
} from "./normalize.js";
import { upsertMovie } from "./upsertMovie.js";

export async function crawlMaoyanTopRated({ limit = 50 } = {}) {
  const json = await fetchTopRated();
  const list = Array.isArray(json?.movieList) ? json.movieList : [];
  const sliced = list.slice(0, Math.max(1, Math.min(limit, 200)));
  const results = [];
  for (const item of sliced) {
    const doc = normalizeFromMaoyanTopRated(item);
    if (!doc?.title) continue;
    const saved = await upsertMovie(doc);
    if (saved) results.push(saved);
  }
  return { total: sliced.length, saved: results.length };
}

export async function crawlMaoyanOnInfoList({ limit = 50 } = {}) {
  const json = await fetchOnInfoList();
  const list = Array.isArray(json?.movieList) ? json.movieList : [];
  const sliced = list.slice(0, Math.max(1, Math.min(limit, 200)));
  const results = [];
  for (const item of sliced) {
    const doc = normalizeFromMaoyanOnInfoList(item);
    if (!doc?.title) continue;
    const saved = await upsertMovie(doc);
    if (saved) results.push(saved);
  }
  return { total: sliced.length, saved: results.length };
}

export async function crawlMaoyanSearch({ keyword, ci = 1, limit = 50 } = {}) {
  const json = await fetchSearchMovies({ keyword, ci });
  const list = Array.isArray(json) ? json : Array.isArray(json?.movies) ? json.movies : [];
  const sliced = list.slice(0, Math.max(1, Math.min(limit, 200)));
  const results = [];
  for (const item of sliced) {
    const doc = normalizeFromMaoyanSearch(item);
    if (!doc?.title) continue;
    const saved = await upsertMovie(doc);
    if (saved) results.push(saved);
  }
  return { total: sliced.length, saved: results.length };
}

/** WMDB 单次 search 通常最多返回约 100 条；需要大于 100 时自动用 skip 分页拉取 */
const WMDB_SEARCH_PAGE_SIZE = 100;

export async function crawlWmdbSearch(query) {
  const requested = Math.max(
    1,
    Math.min(
      parseInt(String(query?.limit ?? 50), 10) || 50,
      5000,
    ),
  );
  const skipStart = Math.max(parseInt(String(query?.skip ?? 0), 10) || 0, 0);

  const collected = [];
  let nextSkip = skipStart;
  while (collected.length < requested) {
    const remaining = requested - collected.length;
    const pageLimit = Math.min(WMDB_SEARCH_PAGE_SIZE, remaining);
    const json = await fetchWmdbSearch({
      ...query,
      limit: pageLimit,
      skip: nextSkip,
    });
    const batch = Array.isArray(json?.data) ? json.data : [];
    if (batch.length === 0) break;
    collected.push(...batch);
    nextSkip += batch.length;
    if (batch.length < pageLimit) break;
  }

  const list = collected.slice(0, requested);
  const results = [];
  let skippedNoTitle = 0;
  let skippedOnSaveError = 0;
  for (const item of list) {
    const doc = normalizeFromWmdbItem(item);
    if (!doc?.title) {
      skippedNoTitle += 1;
      continue;
    }
    try {
      const saved = await upsertMovie(doc);
      if (saved) results.push(saved);
    } catch (e) {
      // 单条写库失败不应中断整批回退，避免详情页在三方有数据时仍返回空。
      skippedOnSaveError += 1;
      console.error(
        "[crawlWmdbSearch] skip one item due to save error:",
        e?.message || e,
      );
    }
  }
  return {
    total: list.length,
    saved: results.length,
    skippedNoTitle,
    skippedOnSaveError,
  };
}

