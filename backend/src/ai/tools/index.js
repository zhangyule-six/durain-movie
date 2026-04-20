import * as searchWmdb from "./search-wmdb.tool.js";
import * as searchMaoyan from "./search-maoyan.tool.js";
import * as getTopRated from "./get-top-rated.tool.js";
import * as getNowShowing from "./get-now-showing.tool.js";
import * as getComingSoon from "./get-coming-soon.tool.js";
import * as ensureMovie from "./ensure-movie.tool.js";

const tools = [searchWmdb, searchMaoyan, getTopRated, getNowShowing, getComingSoon, ensureMovie];

export const toolDefinitions = tools.map((t) => t.definition);

const executorMap = Object.fromEntries(
  tools.map((t) => [t.definition.function.name, t.execute]),
);

export async function executeTool(name, args) {
  const fn = executorMap[name];
  if (!fn) throw new Error(`未知工具: ${name}`);
  return await fn(typeof args === "string" ? JSON.parse(args) : args);
}

export function getToolNames() {
  return tools.map((t) => t.definition.function.name);
}
