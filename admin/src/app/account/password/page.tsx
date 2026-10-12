import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/auth/client/components/change-password-form";
import { requireUserPage } from "@/features/auth/server/lib/session";

export default async function ChangePasswordPage() {
  const user = await requireUserPage({ allowMustChangePassword: true });

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            パスワードの変更
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {user.must_change_password
              ? "初期パスワードのままです。使い始める前に変更してください"
              : user.email}
          </p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
