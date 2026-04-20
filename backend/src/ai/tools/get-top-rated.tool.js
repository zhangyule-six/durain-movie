import { fetchTopRated } from "../../crawler/sources/maoyan.js";

export const definition = {
  type: "function",
  function: {
    name: "get_top_rated",
    description:
      '获取猫眼高分电影榜单，返回当前评分最高的电影列表。适合用户询问「有什么好看的电影」、「评分高的电影」等场景。',
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "返回数量上限，默认 10，最大 30",
        },
      },
    },
  },
};

export async function execute({ limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(limit || 10, 1), 30);
  const json = await fetchTopRated();
  const list = Array.isArray(json?.movieList) ? json.movieList : [];

  return list.slice(0, safeLimit).map((m) => ({
    title: String(m?.name || m?.nm || ""),
    poster: String(m?.poster || m?.img || ""),
    score: String(m?.score || m?.sc || ""),
    maoyanId: m?.movieId || m?.id,
  }));
}
