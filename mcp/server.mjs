#!/usr/bin/env node
/* One Button as a tool for assistants (MCP, the Model Context Protocol).
 *
 * Reads only, for now: tasks, projects, conversations and their words, shared spaces and their
 * words, and a whole space as a bundle. Every call goes through the same server the app uses,
 * with a key that names one person, so an assistant can only see what that person can see.
 * Writes come later, with per-agent keys and consent holds, and every write will say which
 * agent made it.
 *
 * Config (environment, never in a chat):
 *   ONE_BUTTON_KEY_FILE  path to a file holding the key (default ~/.one-button-signing/api-key.txt)
 *   ONE_BUTTON_KEY       the key itself, if no file
 *   ONE_BUTTON_API       the server base (default https://one-button-jay.web.app/api)
 *
 * Register for Claude Code:
 *   claude mcp add one-button --scope user -- node C:/Users/thatc/one-button/mcp/server.mjs
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const API = (process.env.ONE_BUTTON_API || "https://one-button-jay.web.app/api").replace(/\/$/, "");
function key() {
  if (process.env.ONE_BUTTON_KEY) return process.env.ONE_BUTTON_KEY.trim();
  const f = process.env.ONE_BUTTON_KEY_FILE || path.join(os.homedir(), ".one-button-signing", "api-key.txt");
  try { return fs.readFileSync(f, "utf8").trim(); } catch { return ""; }
}
async function call(route, body = {}) {
  const k = key();
  if (!k) throw new Error("no One Button key: set ONE_BUTTON_KEY_FILE or ONE_BUTTON_KEY");
  const r = await fetch(API + route, { method: "POST", headers: { "content-type": "application/json", "x-ob-key": k }, body: JSON.stringify(body) });
  const text = await r.text();
  let d; try { d = JSON.parse(text); } catch { d = { raw: text.slice(0, 2000) }; }
  if (!r.ok) throw new Error((d && d.error) || ("server said " + r.status));
  return d;
}
const SLUG = /^[a-z0-9-]{3,40}$/, ID = /^[\w-]{1,80}$/;
const light = (t) => ({ id: t.id, text: t.text, cat: t.cat, done: !!t.done, due: t.due || "", place: t.place || "", project: t.project || "", from: t.from || "", by: t.by || "", prov: t.prov || null, hold: !!t.hold });

const TOOLS = [
  { name: "one_button_tasks", description: "List this person's tasks. open_only (default true) leaves out done and deleted ones; project filters by project id; text filters by a word.",
    inputSchema: { type: "object", properties: { open_only: { type: "boolean" }, project: { type: "string" }, text: { type: "string" } } } },
  { name: "one_button_projects", description: "List the projects this person stewards, with status and whether each sits on the main screen.", inputSchema: { type: "object", properties: {} } },
  { name: "one_button_conversations", description: "List recorded conversations (title, date, who was in it, summary, key points, actions). No transcripts here; use one_button_transcript.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
  { name: "one_button_transcript", description: "The full words of one recorded conversation, by its id from one_button_conversations.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "one_button_spaces", description: "List the shared spaces: who each is with, how many conversations and tasks, when the other person last opened it, what is new.", inputSchema: { type: "object", properties: {} } },
  { name: "one_button_space", description: "Read one shared space by slug (for example jay-simon): people, conversations with summaries, tasks, projects, highlights, with who wrote each and where it came from.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "one_button_space_transcript", description: "The words and timings of one conversation inside a shared space.",
    inputSchema: { type: "object", properties: { slug: { type: "string" }, conv: { type: "string" } }, required: ["slug", "conv"] } },
  { name: "one_button_export_space", description: "The whole shared space as one bundle: conversations with their words, tasks, projects, highlights. The portable copy.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
];

async function run(name, a = {}) {
  switch (name) {
    case "one_button_tasks": {
      const all = await call("/sync", { changes: [] });
      let ts = (all.tasks || []).filter((t) => !t.deleted);
      if (a.open_only !== false) ts = ts.filter((t) => !t.done);
      if (a.project) ts = ts.filter((t) => t.project === a.project);
      if (a.text) { const w = String(a.text).toLowerCase(); ts = ts.filter((t) => String(t.text || "").toLowerCase().includes(w)); }
      return ts.map(light);
    }
    case "one_button_projects": {
      const d = await call("/project/list");
      return (d.projects || []).map((p) => ({ id: p.id, name: p.name, status: p.status, kind: p.kind || "", main: !!p.main, parent: p.parent || "", about: p.about || "" }));
    }
    case "one_button_conversations": {
      const d = await call("/interview/list");
      return (d.interviews || []).slice(0, Math.max(1, Math.min(200, Number(a.limit) || 60))).map((i) => ({ id: i.id, title: i.title || i.name, created: i.created, people: i.people || [], summary: i.summary || "", points: i.points || [], actions: i.actions || [], status: i.status }));
    }
    case "one_button_transcript": {
      if (!ID.test(String(a.id || ""))) throw new Error("bad id");
      return await call("/interview/transcript", { id: a.id });
    }
    case "one_button_spaces": return await call("/space/list");
    case "one_button_space": {
      if (!SLUG.test(String(a.slug || ""))) throw new Error("bad slug");
      return await call("/space/get", { slug: a.slug });
    }
    case "one_button_space_transcript": {
      if (!SLUG.test(String(a.slug || "")) || !ID.test(String(a.conv || ""))) throw new Error("bad request");
      return await call("/space/transcript", { slug: a.slug, conv: a.conv });
    }
    case "one_button_export_space": {
      if (!SLUG.test(String(a.slug || ""))) throw new Error("bad slug");
      return await call("/space/export", { slug: a.slug });
    }
    default: throw new Error("unknown tool " + name);
  }
}

const server = new Server({ name: "one-button", version: "0.1.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try { const out = await run(req.params.name, req.params.arguments || {}); return { content: [{ type: "text", text: JSON.stringify(out, null, 1) }] }; }
  catch (e) { return { isError: true, content: [{ type: "text", text: String((e && e.message) || e) }] }; }
});
await server.connect(new StdioServerTransport());
