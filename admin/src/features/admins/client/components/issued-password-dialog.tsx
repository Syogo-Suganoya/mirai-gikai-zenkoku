"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type IssuedPassword = { email: string; initialPassword: string };

/**
 * 発行した初期パスワードを1度だけ見せるダイアログ。
 * 閉じると二度と表示できない（DB にはハッシュしか残らない）。
 */
export function IssuedPasswordDialog({
  issued,
  onClose,
}: {
  issued: IssuedPassword | null;
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open={issued !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>初期パスワードを発行しました</AlertDialogTitle>
          <AlertDialogDescription>
            {issued?.email}{" "}
            の初期パスワードです。この画面を閉じると二度と表示できません。
            本人に安全な方法で伝えてください。本人は初回ログインで変更します。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="select-all rounded-md border bg-gray-50 px-4 py-3 text-center font-mono text-lg tracking-wider">
          {issued?.initialPassword}
        </p>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            控えたので閉じる
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
