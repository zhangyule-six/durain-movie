import { fetchComingList } from "../../crawler/sources/maoyan.js";

export const definition = {
  type: "function",
  function: {
    name: "get_coming_soon",
    description:
      '获取即将在影院上映的电影列表。适合用户询问「最近有什么新片要上映」、「即将上映的电影」等场景。',
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
  const json = await fetchComingList({ limit: safeLimit });
  const list = Array.isArray(json?.coming)
    ? json.coming
    : Array.isArray(json?.movieList)
      ? json.movieList
      : [];

  return list.slice(0, safeLimit).map((m) => ({
    title: String(m?.nm || m?.name || ""),
    poster: String(m?.img || m?.poster || ""),
    score: typeof m?.sc === "number" ? m.sc : Number(m?.sc ?? 0) || 0,
    cast: String(m?.star || ""),
    releaseDate: String(m?.rt || m?.release || ""),
    maoyanId: m?.id || m?.movieId,
  }));
}
