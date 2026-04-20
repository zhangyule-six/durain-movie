import { fetchSearchMovies } from "../../crawler/sources/maoyan.js";

export const definition = {
  type: "function",
  function: {
    name: "search_maoyan",
    description:
      "通过猫眼搜索电影，返回电影名称、评分、类型、上映日期等基本信息。适合按片名快速搜索。",
    parameters: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "搜索关键词（电影名称）",
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

export async function execute({ keyword, limit = 10 }) {
  const safeLimit = Math.min(Math.max(limit || 10, 1), 20);
  const json = await fetchSearchMovies({ keyword, limit: safeLimit });
  const list = Array.isArray(json)
    ? json
    : Array.isArray(json?.movies)
      ? json.movies
      : [];

  return list.slice(0, safeLimit).map((m) => ({
    title: String(m?.name || m?.nm || ""),
    englishTitle: String(m?.ename || ""),
    poster: String(m?.poster || m?.img || ""),
    score: String(m?.score || m?.sc || ""),
    category: String(m?.catogary || ""),
    releaseDate: String(m?.release || m?.rt || ""),
    maoyanId: m?.id,
  }));
}
