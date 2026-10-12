import { requireUserPage } from "@/features/auth/server/lib/session";
import { AssemblyMasterImportPage } from "@/features/csv-import/server/components/assembly-master-import-page";

export default async function AssemblyMasterImportRoute() {
  await requireUserPage();
  return <AssemblyMasterImportPage />;
}
