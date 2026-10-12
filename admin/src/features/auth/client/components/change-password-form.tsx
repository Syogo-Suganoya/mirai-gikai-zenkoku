"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ChangePasswordState,
  changePassword,
} from "../../server/actions/change-password";
import { FormError } from "./login-form";

const initialState: ChangePasswordState = { error: null };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <PasswordField
        name="currentPassword"
        label="今のパスワード"
        autoComplete="current-password"
        disabled={isPending}
      />
      <PasswordField
        name="newPassword"
        label="新しいパスワード"
        autoComplete="new-password"
        disabled={isPending}
      />
      <PasswordField
        name="confirmation"
        label="新しいパスワード（確認）"
        autoComplete="new-password"
        disabled={isPending}
      />

      {state.error && <FormError message={state.error} />}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "変更中..." : "パスワードを変更する"}
      </Button>
    </form>
  );
}

function PasswordField({
  name,
  label,
  autoComplete,
  disabled,
}: {
  name: string;
  label: string;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        disabled={disabled}
      />
    </div>
  );
}
