"use client";

import { KeyRound, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { deleteAdmin } from "../../server/actions/delete-admin";
import { reissuePassword } from "../../server/actions/reissue-password";
import type { Admin } from "../../shared/types";
import {
  type IssuedPassword,
  IssuedPasswordDialog,
} from "./issued-password-dialog";

type AdminItemProps = {
  admin: Admin;
  isCurrentUser: boolean;
};

export function AdminItem({ admin, isCurrentUser }: AdminItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReissuing, setIsReissuing] = useState(false);
  const [issued, setIssued] = useState<IssuedPassword | null>(null);

  const handleReissue = async () => {
    setIsReissuing(true);
    try {
      const result = await reissuePassword({ id: admin.id });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setIssued(result);
      }
    } catch (error) {
      console.error("Reissue password error:", error);
      toast.error("パスワードの再発行に失敗しました");
    } finally {
      setIsReissuing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteAdmin({ id: admin.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("アカウントを削除しました");
      }
    } catch (error) {
      console.error("Delete admin error:", error);
      toast.error("管理者の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{admin.email}</span>
          {isCurrentUser && <Badge variant="secondary">自分</Badge>}
          {admin.must_change_password && (
            <Badge variant="outline">初期パスワードのまま</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-gray-600">
        {formatDate(admin.created_at)}
      </TableCell>
      <TableCell className="text-gray-600">
        {formatDate(admin.last_login_at)}
      </TableCell>
      <TableCell className="flex items-center gap-1">
        {!isCurrentUser && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isReissuing}
                aria-label="初期パスワードを再発行"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>初期パスワードの再発行</AlertDialogTitle>
                <AlertDialogDescription>
                  「{admin.email}
                  」の今のパスワードを無効にし、新しい初期パスワードを発行しますか？ログイン中の端末もすべてログアウトされます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReissue}
                  disabled={isReissuing}
                >
                  {isReissuing ? "発行中..." : "再発行する"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <IssuedPasswordDialog issued={issued} onClose={() => setIssued(null)} />
        {isCurrentUser ? (
          <Button variant="ghost" size="sm" disabled className="text-gray-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>アカウントの削除</AlertDialogTitle>
                <AlertDialogDescription>
                  「{admin.email}
                  」を削除しますか？この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "削除中..." : "削除"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  );
}
