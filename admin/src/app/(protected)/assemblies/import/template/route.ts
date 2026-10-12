import { buildTemplateCsv } from "@mirai-gikai/shared/csv-import/templates";
import { CSV_IMPORT_KIND_LABELS } from "@mirai-gikai/shared/csv-import/types";
import { requireUser } from "@/features/auth/server/lib/session";

/** 議会マスタのテンプレート CSV（日本語の見出し＋記入例1行）。Excel で開けるよう BOM 付き UTF-8 */
export async function GET() {
  try {
    await requireUser();
  } catch {
    return new Response("権限がありません", { status: 403 });
  }
  const csv = `﻿${buildTemplateCsv("assemblies", [])}`;
  const fileName = encodeURIComponent(
    `${CSV_IMPORT_KIND_LABELS.assemblies}テンプレート.csv`
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
    },
  });
}
