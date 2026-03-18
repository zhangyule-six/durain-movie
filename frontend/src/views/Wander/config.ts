export interface ReviewData {
  id: string
  movieName: string
  movieImage: string
  /** 0-5 区间，用于 NRate */
  rating: number
}
