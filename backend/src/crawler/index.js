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

export async function crawlWmdbSearch(query) {
  const json = await fetchWmdbSearch(query);
  const list = Array.isArray(json?.data) ? json.data : [];
  const results = [];
  for (const item of list) {
    const doc = normalizeFromWmdbItem(item);
    if (!doc?.title) continue;
    const saved = await upsertMovie(doc);
    if (saved) results.push(saved);
  }
  return { total: list.length, saved: results.length };
}

