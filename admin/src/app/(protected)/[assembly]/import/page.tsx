import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { hasAssemblyRole } from "@/features/assemblies/shared/utils/assembly-role";
import { CsvImportClient } from "@/features/csv-import/client/components/csv-import-client";
import {
  cancelCsvImport,
  commitCsvImport,
  uploadCsv,
} from "@/features/csv-import/server/actions/csv-import-actions";
import { CsvImportHistory } from "@/features/csv-import/server/components/csv-import-history";
import { loadCsvImportJobs } from "@/features/csv-import/server/loaders/load-csv-import-jobs";
import { ASSEMBLY_CSV_KINDS } from "@/features/csv-import/shared/types";
import { requiredRoleForCsvKind } from "@/features/csv-import/shared/utils/required-role";
import { routes } from "@/lib/routes";

export default async function AssemblyImportPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly, role } = await requireAssemblyPage((await params).assembly);
  const jobs = await loadCsvImportJobs(assembly.id);
  // 役割で取り込めない種類は選択肢に出さない
  const kinds = ASSEMBLY_CSV_KINDS.filter((kind) =>
    hasAssemblyRole(role, requiredRoleForCsvKind(kind))
  );

  return (
    <div className="space-y-8">
      <CsvImportClient
        assemblyName={assembly.name}
        kinds={kinds}
        templateHref={`${routes.assemblyImport(assembly.slug)}/template`}
        actions={{
          upload: uploadCsv.bind(null, assembly.slug),
          commit: commitCsvImport.bind(null, assembly.slug),
          cancel: cancelCsvImport.bind(null, assembly.slug),
        }}
      />
      <CsvImportHistory jobs={jobs} />
    </div>
  );
}
