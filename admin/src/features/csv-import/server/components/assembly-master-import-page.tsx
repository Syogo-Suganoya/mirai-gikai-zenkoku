import "server-only";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { CsvImportClient } from "../../client/components/csv-import-client";
import {
  cancelAssemblyMasterCsv,
  commitAssemblyMasterCsv,
  uploadAssemblyMasterCsv,
} from "../actions/assembly-master-csv-actions";
import { loadCsvImportJobs } from "../loaders/load-csv-import-jobs";
import { CsvImportHistory } from "./csv-import-history";

/** 議会マスタの CSV 取り込み（/assemblies/import） */
export async function AssemblyMasterImportPage() {
  const jobs = await loadCsvImportJobs(null);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href={routes.home() as Route}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          議会一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          議会マスタの取り込み
        </h1>
        <p className="text-gray-600">
          議会そのもの（議会名・種類・都道府県・公式サイト）を CSV
          でまとめて登録・更新します。団体コードが同じ議会は更新し、削除はしません。
          スラッグを空にすると「lg-団体コード」になります。
        </p>
      </div>
      <CsvImportClient
        assemblyName={null}
        kinds={["assemblies"]}
        templateHref={`${routes.assemblyMasterImport()}/template`}
        actions={{
          upload: uploadAssemblyMasterCsv,
          commit: commitAssemblyMasterCsv,
          cancel: cancelAssemblyMasterCsv,
        }}
      />
      <CsvImportHistory jobs={jobs} />
    </div>
  );
}
