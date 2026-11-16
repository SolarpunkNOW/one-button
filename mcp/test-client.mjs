// Drives the server over stdio the way an assistant would: lists the tools and reads two things.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const t = new StdioClientTransport({ command: "node", args: [new URL("./server.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")] });
const c = new Client({ name: "test", version: "0" }, { capabilities: {} });
await c.connect(t);
const tools = await c.listTools(); console.log("tools:", tools.tools.map((x) => x.name).join(", "));
const sp = await c.callTool({ name: "one_button_spaces", arguments: {} }); console.log("spaces:", JSON.parse(sp.content[0].text).spaces.length);
const ts = await c.callTool({ name: "one_button_tasks", arguments: { text: "dishcloth" } }); console.log("tasks:", ts.content[0].text.slice(0, 160).replace(/\s+/g, " "));
await c.close(); process.exit(0);
