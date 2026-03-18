import express from "express";
import {
  wmdbSearch,
  maoyanTopRated,
  maoyanOnInfoList,
  maoyanSearchMovies,
  ensureMovie,
  topRatedMovies,
  recommendByGenres,
} from "../controllers/movie.controller.js";

const router = express.Router();

router.get("/wmdb/search", wmdbSearch);
router.get("/maoyan/topRated", maoyanTopRated);
router.get("/maoyan/onInfoList", maoyanOnInfoList);
router.get("/maoyan/search", maoyanSearchMovies);
router.post("/ensure", ensureMovie);
router.get("/top-rated", topRatedMovies);
router.post("/:movieId/recommend-by-genres", recommendByGenres);

export default router;
