"use client";

import { Pencil, UserMinus } from "lucide-react";
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
  type IssuedPassword,
  IssuedPasswordDialog,
} from "@/features/admins/client/components/issued-password-dialog";
import {
  addAssemblyMember,
  editAssemblyMember,
  removeAssemblyMember,
} from "../../server/actions/assembly-member-actions";
import { ASSEMBLY_MEMBER_ROLE_LABELS } from "../../shared/constants/labels";
import type { AssemblyMember } from "../../shared/types";
import { AssemblyMemberForm, EMPTY_MEMBER_INPUT } from "./assembly-member-form";

interface AssemblyMembersProps {
  assemblySlug: string;
  assemblyName: string;
  members: AssemblyMember[];
}

/** 議会の担当者（確認者・編集者）の追加・変更・解除。全体管理者だけが使う */
export function AssemblyMembers({
  assemblySlug,
  assemblyName,
  members,
}: AssemblyMembersProps) {
  const [issued, setIssued] = useState<IssuedPassword | null>(null);

  const handleAdd = async (values: typeof EMPTY_MEMBER_INPUT) => {
    const result = await addAssemblyMember(assemblySlug, values);
    if ("error" in result) {
      toast.error(result.error);
      return false;
    }
    if (result.issued) {
      setIssued(result.issued);
    } else {
      toast.success(
        `${values.email} を${assemblyName}の担当に加えました（既存のアカウント）`
      );
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-md border bg-white p-6">
        <h2 className="font-semibold text-gray-900">担当者を追加</h2>
        <p className="text-sm text-gray-500">
          アカウントが無いメールアドレスなら作成し、初期パスワードを1度だけ表示します。
          ほかの議会で担当しているアカウントなら、この議会の担当にも加えます。
        </p>
        <AssemblyMemberForm
          initialValues={EMPTY_MEMBER_INPUT}
          submitLabel="追加"
          submittingLabel="追加中..."
          onSubmit={handleAdd}
        />
      </section>

      <section className="rounded-md border bg-white">
        <h2 className="border-b px-6 py-4 font-semibold text-gray-900">
          担当者（{members.length}人）
        </h2>
        {members.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            担当者はまだいません。全体管理者だけがこの議会を扱えます。
          </p>
        ) : (
          <ul className="divide-y">
            {members.map((member) => (
              <MemberRow
                key={member.user_id}
                assemblySlug={assemblySlug}
                member={member}
              />
            ))}
          </ul>
        )}
      </section>

      <IssuedPasswordDialog issued={issued} onClose={() => setIssued(null)} />
    </div>
  );
}

function MemberRow({
  assemblySlug,
  member,
}: {
  assemblySlug: string;
  member: AssemblyMember;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (values: typeof EMPTY_MEMBER_INPUT) => {
    const result = await editAssemblyMember(
      assemblySlug,
      member.user_id,
      values
    );
    if ("error" in result) {
      toast.error(result.error);
      return false;
    }
    toast.success("担当者を更新しました");
    setIsEditing(false);
    return false;
  };

  const handleRemove = async () => {
    const result = await removeAssemblyMember(assemblySlug, member.user_id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(`${member.email} を担当から外しました`);
    }
  };

  if (isEditing) {
    return (
      <li className="px-6 py-4">
        <AssemblyMemberForm
          initialValues={{
            email: member.email,
            role: member.role,
            display_name: member.display_name,
            affiliation: member.affiliation,
          }}
          emailReadOnly
          submitLabel="保存"
          submittingLabel="保存中..."
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">
            {member.display_name}
          </span>
          <span className="text-sm text-gray-500">{member.affiliation}</span>
          <Badge variant={member.role === "reviewer" ? "default" : "outline"}>
            {ASSEMBLY_MEMBER_ROLE_LABELS[member.role]}
          </Badge>
          {member.must_change_password && (
            <Badge variant="outline">初期パスワードのまま</Badge>
          )}
        </div>
        <p className="truncate text-sm text-gray-500">
          {member.email}
          {" ・ "}
          最終ログイン:{" "}
          {member.last_login_at
            ? new Date(member.last_login_at).toLocaleString("ja-JP")
            : "なし"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Pencil className="h-4 w-4" />
          編集
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserMinus className="h-4 w-4" />
              担当から外す
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>担当から外しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                {member.email}{" "}
                はこの議会を扱えなくなります。アカウントは残ります（削除は「担当者」画面から）。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove}>
                担当から外す
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
