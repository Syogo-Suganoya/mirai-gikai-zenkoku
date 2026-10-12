import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/client/components/login-form";
import { getCurrentUser } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";

export default async function LoginPage() {
  // ログイン済みならそのまま管理画面へ
  if (await getCurrentUser()) redirect(routes.home());

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ログイン
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            みらい議会＠全国地方議会 管理画面
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            アカウントは全体管理者が発行します。パスワードを忘れたときは全体管理者に再発行を依頼してください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
