import Movie from "../../models/movie.model.js";

export const definition = {
  type: "function",
  function: {
    name: "ensure_movie",
    description:
      "将推荐的电影写入本地数据库，确保该电影可以被用户收藏和评论。在推荐电影给用户时应调用此工具。",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "电影标题" },
        year: { type: "string", description: "上映年份，如 2024" },
        poster: { type: "string", description: "海报图片 URL" },
        summary: { type: "string", description: "电影简介" },
        genres: {
          type: "array",
          items: { type: "string" },
          description: "类型标签，如 ['剧情', '科幻']",
        },
      },
      required: ["title"],
    },
  },
};

export async function execute({ title, year, poster, summary, genres }) {
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

  return { movieId: movie._id.toString(), title: movie.title, poster: movie.poster };
}
