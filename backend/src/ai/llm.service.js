import OpenAI from "openai";

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });
  }
  return client;
}

export async function chatStream(messages, { tools, model } = {}) {
  const params = {
    model: model || "deepseek-chat",
    messages,
    stream: true,
  };
  if (tools?.length) params.tools = tools;
  return getClient().chat.completions.create(params);
}

export async function chat(messages, { tools, model } = {}) {
  const params = {
    model: model || "deepseek-chat",
    messages,
  };
  if (tools?.length) params.tools = tools;
  const res = await getClient().chat.completions.create(params);
  return res.choices[0]?.message;
}
