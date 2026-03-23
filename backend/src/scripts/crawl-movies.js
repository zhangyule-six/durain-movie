import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import {
  crawlMaoyanTopRated,
  crawlMaoyanOnInfoList,
  crawlMaoyanSearch,
  crawlWmdbSearch,
} from "../crawler/index.js";

function readArg(name, fallback = undefined) {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) return true;
  return value;
}

async function main() {
  const task = String(readArg("task", "maoyan:topRated"));
  const limitRaw = readArg("limit", "50");
  const parsed = Math.max(parseInt(String(limitRaw), 10) || 50, 1);
  // 猫眼任务沿用 200 上限；WMDB 支持更大批量（由 crawlWmdbSearch 内部分页请求上游）
  const maxLimit = task === "wmdb:search" ? 5000 : 200;
  const limit = Math.min(parsed, maxLimit);

  await connectDB();

  try {
    if (task === "maoyan:topRated") {
      const r = await crawlMaoyanTopRated({ limit });
      console.log("[crawl] maoyan:topRated", r);
      return;
    }
    if (task === "maoyan:onInfoList") {
      const r = await crawlMaoyanOnInfoList({ limit });
      console.log("[crawl] maoyan:onInfoList", r);
      return;
    }
    if (task === "maoyan:search") {
      const keyword = String(readArg("keyword", "") || "");
      const ci = parseInt(String(readArg("ci", "1")), 10) || 1;
      if (!keyword) throw new Error("maoyan:search 需要 --keyword");
      const r = await crawlMaoyanSearch({ keyword, ci, limit });
      console.log("[crawl] maoyan:search", r);
      return;
    }
    if (task === "wmdb:search") {
      const q = String(readArg("q", "") || "");
      const actor = readArg("actor", undefined);
      const year = readArg("year", undefined);
      const lang = readArg("lang", "Cn");
      const skip = parseInt(String(readArg("skip", "0")), 10) || 0;
      if (!q) throw new Error("wmdb:search 需要 --q");
      const r = await crawlWmdbSearch({ q, actor, year, lang, limit, skip });
      console.log("[crawl] wmdb:search", r);
      return;
    }

    throw new Error(`未知 task: ${task}`);
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

