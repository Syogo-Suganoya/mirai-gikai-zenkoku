"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * 議会にダミーデータが残っているときに、実データを入れる前に出す確認（設計 v3 8.5.4節）。
 * 実データとダミーを同じ議会に並べないため、同意したらダミーをすべて消してから保存する。
 */
export function DummyDeletionDialog({
  open,
  assemblyName,
  actionLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  assemblyName: string;
  /** 例: 「この議案を登録します」 */
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ダミーデータを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {assemblyName}
                には、画面の確認用に入れたダミーの議案・会期・会派が残っています。
              </p>
              <p>
                実データとダミーを同じ議会に並べないため、ダミーをすべて削除してから
                {actionLabel}。削除したダミーは元に戻せません。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
          >
            ダミーを削除して続ける
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
