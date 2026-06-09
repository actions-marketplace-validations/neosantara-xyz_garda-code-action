import { describe, expect, it } from "vitest";
import { loadAndStartMcpServers } from "../src/mcp/client.js";

describe("MCP Client", () => {
  it("should return empty if .mcp.json does not exist", async () => {
    const { tools, stopAll } = await loadAndStartMcpServers(new Set());
    expect(tools).toEqual([]);
    await stopAll();
  });
});
