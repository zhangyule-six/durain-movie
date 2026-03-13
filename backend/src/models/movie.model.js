import mongoose from "mongoose";
const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: String, unique: true, index: true }, // 外部API ID，用于数据同步
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
    language: String,
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
const Movie = mongoose.model("Movie", movieSchema);

export default Movie;