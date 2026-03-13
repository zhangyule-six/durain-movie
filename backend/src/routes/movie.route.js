import express from "express";
import {
  wmdbSearch,
  maoyanTopRated,
  maoyanOnInfoList,
  maoyanSearchMovies,
} from "../controllers/movie.controller.js";

const router = express.Router();

router.get("/wmdb/search", wmdbSearch);
router.get("/maoyan/topRated", maoyanTopRated);
router.get("/maoyan/onInfoList", maoyanOnInfoList);
router.get("/maoyan/search", maoyanSearchMovies);

export default router;
