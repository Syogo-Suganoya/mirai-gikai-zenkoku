import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { CsvImportClient } from "@/features/csv-import/client/components/csv-import-client";
import {
  cancelCsvImport,
  commitCsvImport,
  uploadCsv,
} from "@/features/csv-import/server/actions/csv-import-actions";
import { CsvImportHistory } from "@/features/csv-import/server/components/csv-import-history";
import { loadCsvImportJobs } from "@/features/csv-import/server/loaders/load-csv-import-jobs";
import { ASSEMBLY_CSV_KINDS } from "@/features/csv-import/shared/types";
import { routes } from "@/lib/routes";

export default async function AssemblyImportPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly } = await requireAssemblyPage((await params).assembly);
  const jobs = await loadCsvImportJobs(assembly.id);

  return (
    <div className="space-y-8">
      <CsvImportClient
        assemblyName={assembly.name}
        kinds={[...ASSEMBLY_CSV_KINDS]}
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
