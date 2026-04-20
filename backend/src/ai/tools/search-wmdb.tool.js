import { fetchWmdbSearch } from "../../crawler/sources/wmdb.js";
import { normalizeFromWmdbItem } from "../../crawler/normalize.js";

export const definition = {
  type: "function",
  function: {
    name: "search_wmdb",
    description:
      "通过 WMDB 搜索电影，支持按片名、演员、年份搜索。返回影片的详细信息包括简介、评分、演员、类型等。适合需要详细影片信息的搜索场景。",
    parameters: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "搜索关键词（片名、导演、演员等）",
        },
        actor: {
          type: "string",
          description: "按演员名筛选（可选）",
        },
        year: {
          type: "string",
          description: "按年份筛选，如 2024（可选）",
        },
        limit: {
          type: "number",
          description: "返回数量上限，默认 10，最大 20",
        },
      },
      required: ["keyword"],
    },
  },
};

export async function execute({ keyword, actor, year, limit = 10 }) {
  const safeLimit = Math.min(Math.max(limit || 10, 1), 20);
  const raw = await fetchWmdbSearch({
    q: keyword,
    actor,
    year,
    limit: safeLimit,
  });

  const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  return items.slice(0, safeLimit).map((item) => {
    const n = normalizeFromWmdbItem(item);
    return {
      title: n.title,
      originalTitle: n.originalTitle,
      genres: n.genres,
      summary: n.summary,
      cast: n.cast?.slice(0, 5),
      country: n.country,
      duration: n.duration,
      doubanRating: n.externalRatings?.douban,
      imdbRating: n.externalRatings?.imdb,
      year: n.releaseDate
        ? new Date(n.releaseDate).getUTCFullYear()
        : undefined,
      poster: n.poster,
    };
  });
}
