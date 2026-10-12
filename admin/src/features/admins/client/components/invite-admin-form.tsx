"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdmin } from "../../server/actions/invite-admin";
import {
  type IssuedPassword,
  IssuedPasswordDialog,
} from "./issued-password-dialog";

export function InviteAdminForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issued, setIssued] = useState<IssuedPassword | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAdmin({ email });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setIssued(result);
        setEmail("");
      }
    } catch (error) {
      console.error("Create admin error:", error);
      toast.error("アカウントの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor={emailId}>メールアドレス</Label>
            <Input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "作成中..." : "作成して初期パスワードを発行"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          管理者として作成します（すべての議会・機能を扱えます）。初期パスワードは作成後に1度だけ表示されます。
        </p>
      </form>
      <IssuedPasswordDialog issued={issued} onClose={() => setIssued(null)} />
    </>
  );
}
