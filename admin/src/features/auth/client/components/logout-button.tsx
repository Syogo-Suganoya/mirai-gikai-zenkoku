"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "../../server/actions/logout";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="text-gray-600 hover:text-gray-900"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isPending ? "ログアウト中..." : "ログアウト"}
    </Button>
  );
}
