"use client";

import { SESSION_TYPE_LABELS } from "@mirai-gikai/shared/bills/labels";
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
import {
  editSession,
  removeSession,
} from "../../server/actions/session-actions";
import type { SessionInput, SessionWithBillCount } from "../../shared/types";
import { SessionFields } from "./session-fields";

function toInput(session: SessionWithBillCount): SessionInput {
  return {
    session_key: session.session_key,
    name: session.name,
    type: session.type,
    start_date: session.start_date,
    end_date: session.end_date,
    slug: session.slug,
    source_url: session.source_url,
  };
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export function SessionItem({
  assemblySlug,
  session,
  canEdit,
}: {
  assemblySlug: string;
  session: SessionWithBillCount;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(() => toInput(session));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const result = await editSession(assemblySlug, session.id, value);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("会期を更新しました");
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const result = await removeSession(assemblySlug, session.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("会期を削除しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-lg border p-4">
        <SessionFields
          value={value}
          onChange={setValue}
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(toInput(session));
              setIsEditing(false);
            }}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 font-medium">
          {session.name}
          <Badge variant="outline">{SESSION_TYPE_LABELS[session.type]}</Badge>
          {session.is_dummy && <Badge variant="secondary">ダミー</Badge>}
        </div>
        <div className="text-sm text-gray-500">
          <span className="mr-2 font-mono">{session.session_key}</span>
          {formatDate(session.start_date)} 〜 {formatDate(session.end_date)}
          <span className="ml-2">議案 {session.billCount}件</span>
        </div>
        {session.source_url && (
          <a
            href={session.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            出典 ↗
          </a>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isSubmitting}
          >
            編集
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isSubmitting || session.billCount > 0}
                title={
                  session.billCount > 0
                    ? "議案が登録されている会期は削除できません"
                    : undefined
                }
              >
                削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>会期の削除</AlertDialogTitle>
                <AlertDialogDescription>
                  「{session.name}」を削除しますか？この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  削除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
