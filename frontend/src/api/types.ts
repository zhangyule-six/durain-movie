export interface AuthUser {
  _id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  stats?: {
    following: number
    followers: number
    reviews: number
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  username: string
  email: string
  password: string
}

export interface MovieSearchParams {
  q?: string // 搜索关键词（片名、原名、别名、简介），支持模糊匹配
  actor?: string // 主演名称，支持模糊匹配
  year?: string // 年份，例如 "1986"
  limit?: number // 分页限制，每页返回条数
  skip?: number // 跳过的条数（偏移量）
  lang?: 'Cn' | 'En' // 语言设定，默认通常为 Cn
}

export interface TopRatedMovieItem {
  movieId: number
  poster: string
  score: string
  name: string
}

export interface TopRatedMoviesResponse {
  title: string
  movieList: TopRatedMovieItem[]
}

export interface MovieOnInfoListItem {
  id: number
  img: string
  nm: string
  sc: number
  star: string
  rt: string
}

export interface MovieOnInfoListResponse {
  total: number
  movieList: MovieOnInfoListItem[]
}

export interface ComingListItem {
  id: number
  img: string
  nm: string
  sc: number
  star: string
  rt: string
}

export interface ComingListResponse {
  total: number
  movieList: ComingListItem[]
}

export interface MaoyanSearchMovieItem {
  id: number
  poster: string
  name: string
  version: string
  wish: string
  score: string
  ename: string
  catogary: string
  release: string
}

export interface MaoyanSearchPageResponse {
  offset: number
  limit: number
  count: number
  hasMore: boolean
  data: MaoyanSearchMovieItem[]
}

/**
 * 基础名称项（用于演员、导演、编剧等）
 */
export interface PersonInfo {
  name: string
  lang: string
}

export interface PersonDataWrapper {
  data: PersonInfo[]
}

/**
 * 电影详细描述信息（对应返回结果中的内部 data 数组）
 */
export interface MovieDetail {
  poster: string
  name: string
  genre: string
  description: string
  language: string
  country: string
  lang: string
}

/**
 * 单条电影数据核心对象
 */
export interface MovieItem {
  originalName: string
  imdbVotes: number
  imdbRating: string
  rottenRating: string
  rottenVotes: number
  year: string
  imdbId: string
  alias: string
  doubanId: string
  type: string
  doubanRating: string
  doubanVotes: number
  duration: number
  episodes: number
  totalSeasons: number
  dateReleased: string
  data: MovieDetail[] // 电影详情（海报、简介等）
  writer: PersonDataWrapper[] // 编剧列表
  actor: PersonDataWrapper[] // 演员列表
  director: PersonDataWrapper[] // 导演列表
}

/**
 * API 完整返回结构
 */
export interface MovieSearchResponse {
  total: number
  page: number
  limit: number
  skip: number
  count: number
  totalPages: number
  hasMore: boolean
  data: MovieItem[]
}

// 本地 Movie 高分榜单
export interface TopRankMovie {
  id: string
  title: string
  poster: string
  /** 用于 NRate 展示的评分，0-5 区间 */
  rating: number
  rank: number
  /** 首页推荐使用的简介文案（可选），来自 Movie.summary */
  description?: string
}

// Film detail & cast types (used by FilmDetail page and others)

export interface FilmDetailBase {
  /** 用于路由参数的唯一标识（路由 name） */
  name: string
  /** 展示用标题 */
  displayName: string
  poster: string
  rating: number
  ratingCount: number
  year: number
  duration: string
  region: string
  genres: string[]
  summary: string
}

export interface CastMember {
  id: number
  name: string
  role: string
  avatar: string
}

export interface ReviewBuzz {
  id: number
  nickname: string
  avatar: string
  score: number
  quote: string
}

/** POST /api/movie/:movieId/recommend-by-genres 原始返回；详情页推荐区直接使用该结构展示 */
export interface RecommendByGenresItem {
  id: string
  title: string
  poster: string
  genres: string[]
}

export interface FilmDetailFull {
  base: FilmDetailBase
  cast: CastMember[]
  buzz: ReviewBuzz[]
  recommendations: RecommendByGenresItem[]
}
