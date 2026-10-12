"use client";

import { SESSION_TYPE_LABELS } from "@mirai-gikai/shared/bills/labels";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SessionInput, SessionType } from "../../shared/types";

export const EMPTY_SESSION_INPUT: SessionInput = {
  session_key: "",
  name: "",
  type: "regular",
  start_date: "",
  end_date: "",
  slug: null,
  source_url: null,
};

/** 会期の入力欄（追加と編集で共通） */
export function SessionFields({
  value,
  onChange,
  disabled,
}: {
  value: SessionInput;
  onChange: (value: SessionInput) => void;
  disabled: boolean;
}) {
  const id = useId();
  const set = <K extends keyof SessionInput>(key: K, v: SessionInput[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field id={`${id}-name`} label="会期名">
          <Input
            id={`${id}-name`}
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="例: 令和8年9月定例会"
            disabled={disabled}
          />
        </Field>
        <Field id={`${id}-key`} label="会期キー（CSV の突き合わせに使う）">
          <Input
            id={`${id}-key`}
            value={value.session_key}
            onChange={(e) => set("session_key", e.target.value)}
            placeholder="例: 2026-09"
            disabled={disabled}
          />
        </Field>
        <Field id={`${id}-type`} label="種類">
          <Select
            value={value.type}
            onValueChange={(v) => set("type", v as SessionType)}
            disabled={disabled}
          >
            <SelectTrigger id={`${id}-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SESSION_TYPE_LABELS).map(([type, label]) => (
                <SelectItem key={type} value={type}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id={`${id}-start`} label="開会日">
          <Input
            id={`${id}-start`}
            type="date"
            value={value.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            disabled={disabled}
          />
        </Field>
        <Field id={`${id}-end`} label="閉会日">
          <Input
            id={`${id}-end`}
            type="date"
            value={value.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            disabled={disabled}
          />
        </Field>
        <Field id={`${id}-slug`} label="スラッグ（URL 用・任意）">
          <Input
            id={`${id}-slug`}
            value={value.slug ?? ""}
            onChange={(e) => set("slug", e.target.value || null)}
            placeholder="例: 2026-09"
            disabled={disabled}
          />
        </Field>
      </div>
      <Field id={`${id}-source`} label="出典（議会サイトの会期のページ・任意）">
        <Input
          id={`${id}-source`}
          type="url"
          value={value.source_url ?? ""}
          onChange={(e) => set("source_url", e.target.value || null)}
          placeholder="https://..."
          disabled={disabled}
        />
      </Field>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
