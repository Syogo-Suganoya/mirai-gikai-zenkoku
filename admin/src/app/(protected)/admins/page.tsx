import { InviteAdminForm } from "@/features/admins/client/components/invite-admin-form";
import { AdminList } from "@/features/admins/server/components/admin-list";
import { loadAdmins } from "@/features/admins/server/loaders/load-admins";
import { requireSuperAdminPage } from "@/features/auth/server/lib/auth-server";

export default async function AdminsPage() {
  const currentAdmin = await requireSuperAdminPage();

  const admins = await loadAdmins();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">アカウント管理</h1>
      <p className="mb-8 text-sm text-gray-600">
        管理画面のすべてのアカウントです。議会の確認者・編集者は、各議会の「担当者」タブから追加します。
      </p>

      {/* 管理者追加セクション */}
      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">全体管理者を追加</h2>
        <InviteAdminForm />
      </section>

      {/* 管理者一覧セクション */}
      <section className="rounded-lg border bg-white p-6">
        <AdminList admins={admins} currentAdminId={currentAdmin.id} />
      </section>
    </div>
  );
}
