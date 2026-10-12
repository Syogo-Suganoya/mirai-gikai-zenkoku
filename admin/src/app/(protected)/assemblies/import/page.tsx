import { notFound } from "next/navigation";
import { requireUserPage } from "@/features/auth/server/lib/session";
import { AssemblyMasterImportPage } from "@/features/csv-import/server/components/assembly-master-import-page";

export default async function AssemblyMasterImportRoute() {
  const user = await requireUserPage();
  // 議会マスタは全体管理者だけが扱う（設計 v3 6.2節）
  if (!user.is_super_admin) notFound();
  return <AssemblyMasterImportPage />;
}
