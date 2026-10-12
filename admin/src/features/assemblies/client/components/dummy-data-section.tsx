"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { removeAssemblyDummyData } from "../../server/actions/dummy-data-actions";
import {
  type DummyDataCounts,
  describeDummyCounts,
  hasDummyCounts,
} from "../../shared/utils/dummy-data-counts";

/** 議会設定の下に出す、ダミーデータの削除（設計 v3 8.5.4節） */
export function DummyDataSection({
  assemblySlug,
  assemblyName,
  counts,
}: {
  assemblySlug: string;
  assemblyName: string;
  counts: DummyDataCounts;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const hasDummy = hasDummyCounts(counts);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await removeAssemblyDummyData(assemblySlug);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-red-200 bg-white p-6">
      <div className="space-y-1">
        <p className="font-medium text-gray-900">ダミーデータ</p>
        <p className="text-sm text-gray-500">
          {hasDummy
            ? `画面の確認用に入れたダミー（${describeDummyCounts(counts)}）が残っています。実データを入れる前に削除してください。議案の解説・議決結果も一緒に消え、元に戻せません。`
            : "この議会にダミーデータはありません。"}
        </p>
      </div>
      {hasDummy && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? "削除中..." : "ダミーデータを削除"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {assemblyName}のダミーデータを削除しますか？
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {describeDummyCounts(counts)}
                  と、議案の解説・議決結果をまとめて削除します。公開サイトからも消え、元に戻せません。議会そのものと実データは残ります。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
