import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findAssemblyWithSettingsBySlug } from "@/features/assemblies/server/repositories/assembly-repository";
import { findSessionsWithBillCount } from "@/features/sessions/server/repositories/session-repository";
import { jsonResult } from "../utils/json-result";

export function registerSessionsTools(server: McpServer): void {
  server.registerTool(
    "list_sessions",
    {
      title: "会期一覧を取得",
      description:
        "指定した議会の会期（定例会・臨時会）を新しい順に返す。議案作成時の session_id 指定に利用できる。",
      inputSchema: {
        assemblySlug: z.string().describe("議会のスラッグ（例: aichi-pref）"),
      },
    },
    async ({ assemblySlug }) => {
      const row = await findAssemblyWithSettingsBySlug(assemblySlug);
      if (!row) throw new Error(`議会 ${assemblySlug} がありません`);
      return jsonResult(await findSessionsWithBillCount(row.assembly.id));
    }
  );
}
