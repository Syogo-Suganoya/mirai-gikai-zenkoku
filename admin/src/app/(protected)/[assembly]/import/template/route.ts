import { buildTemplateCsv } from "@mirai-gikai/shared/csv-import/templates";
import { CSV_IMPORT_KIND_LABELS } from "@mirai-gikai/shared/csv-import/types";
import { requireAssemblyAction } from "@/features/assemblies/server/loaders/require-assembly";
import { findActiveFactionNames } from "@/features/csv-import/server/repositories/csv-import-repository";
import { ASSEMBLY_CSV_KINDS } from "@/features/csv-import/shared/types";

/** テンプレート CSV（日本語の見出し＋記入例1行）。Excel で開けるよう BOM 付き UTF-8 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assembly: string }> }
) {
  const kind = new URL(request.url).searchParams.get("kind");
  const match = ASSEMBLY_CSV_KINDS.find((k) => k === kind);
  if (!match) return new Response("種類が正しくありません", { status: 400 });

  let assemblyId: string;
  try {
    ({
      assembly: { id: assemblyId },
    } = await requireAssemblyAction((await params).assembly));
  } catch {
    return new Response("権限がありません", { status: 403 });
  }

  // 議決結果は、いま有効な会派の名前を列にして渡す（そのまま ○／× を書ける）
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const factionNames =
    match === "results" ? await findActiveFactionNames(assemblyId, today) : [];
  const csv = `﻿${buildTemplateCsv(match, factionNames)}`;
  const fileName = encodeURIComponent(
    `${CSV_IMPORT_KIND_LABELS[match]}テンプレート.csv`
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
    },
  });
}
