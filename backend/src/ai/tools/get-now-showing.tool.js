import { fetchOnInfoList } from "../../crawler/sources/maoyan.js";

export const definition = {
  type: "function",
  function: {
    name: "get_now_showing",
    description:
      '获取当前正在影院热映的电影列表。适合用户询问「现在有什么电影在上映」、「最近热映的电影」等场景。',
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
  const json = await fetchOnInfoList();
  const list = Array.isArray(json?.movieList) ? json.movieList : [];

  return list.slice(0, safeLimit).map((m) => ({
    title: String(m?.nm || m?.name || ""),
    poster: String(m?.img || m?.poster || ""),
    score: typeof m?.sc === "number" ? m.sc : Number(m?.sc ?? 0) || 0,
    cast: String(m?.star || ""),
    releaseDate: String(m?.rt || ""),
    maoyanId: m?.id,
  }));
}
