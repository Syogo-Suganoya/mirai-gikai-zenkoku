"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSEMBLY_MEMBER_ROLE_DESCRIPTIONS,
  ASSEMBLY_MEMBER_ROLE_LABELS,
} from "../../shared/constants/labels";
import type {
  AssemblyMemberInput,
  AssemblyMemberRole,
} from "../../shared/types";

export const EMPTY_MEMBER_INPUT: AssemblyMemberInput = {
  email: "",
  role: "reviewer",
  display_name: "",
  affiliation: "",
};

interface AssemblyMemberFormProps {
  initialValues: AssemblyMemberInput;
  /** 編集のときはメールアドレスを変えられない（アカウントの変更は「担当者」画面で） */
  emailReadOnly?: boolean;
  submitLabel: string;
  submittingLabel: string;
  /** true を返したら入力を空に戻す */
  onSubmit: (values: AssemblyMemberInput) => Promise<boolean>;
  onCancel?: () => void;
}

/** 担当者の追加・編集の入力欄 */
export function AssemblyMemberForm({
  initialValues,
  emailReadOnly = false,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: AssemblyMemberFormProps) {
  const ids = {
    email: useId(),
    role: useId(),
    displayName: useId(),
    affiliation: useId(),
  };
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof AssemblyMemberInput>(
    key: K,
    value: AssemblyMemberInput[K]
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (await onSubmit(values)) setValues(initialValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={ids.email}>メールアドレス</Label>
          <Input
            id={ids.email}
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="reviewer@example.com"
            readOnly={emailReadOnly}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={ids.role}>役割</Label>
          <Select
            value={values.role}
            onValueChange={(value) => set("role", value as AssemblyMemberRole)}
            disabled={isSubmitting}
          >
            <SelectTrigger id={ids.role}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ASSEMBLY_MEMBER_ROLE_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {ASSEMBLY_MEMBER_ROLE_DESCRIPTIONS[values.role]}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={ids.displayName}>表示名</Label>
          <Input
            id={ids.displayName}
            value={values.display_name}
            onChange={(e) => set("display_name", e.target.value)}
            placeholder="例: 山田花子"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={ids.affiliation}>所属</Label>
          <Input
            id={ids.affiliation}
            value={values.affiliation}
            onChange={(e) => set("affiliation", e.target.value)}
            placeholder="例: ◯◯県議会議員"
            disabled={isSubmitting}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        表示名と所属は、確認した議案の公開ページに「◯◯が確認」として出ます。
      </p>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
