import mongoose from "mongoose";
const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: String, index: true, sparse: true }, // 外部API ID，用于数据同步，可为空
    title: { type: String, required: true, index: "text" }, // 建立文本索引支持搜索
    originalTitle: String,
    poster: String,
    backdrop: String, // 详情页大背景图
    releaseDate: Date,
    genres: [String],
    rating: {
      average: { type: Number, default: 0 }, // 系统内用户评分的平均值
      count: { type: Number, default: 0 }, // 系统内评价人数
    },
    summary: String,
    // 三方接口对齐字段
    doubanId: String,
    imdbId: String,
    maoyanId: { type: String, index: true },
    duration: Number, // 片长（分钟）
    country: String,
    /** 对白/语言说明（勿用字段名 language：会与 MongoDB 全文索引的 language 覆盖冲突） */
    filmLanguage: String,
    externalRatings: {
      douban: Number,
      imdb: Number,
      maoyan: Number,
    },
    cast: [String], // 主演
    release: String, // 上映日期字符串（猫眼）
    catogary: String, // 类型字符串（猫眼）
  },
  { timestamps: true },
);
movieSchema.index({ genres: 1 });

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;