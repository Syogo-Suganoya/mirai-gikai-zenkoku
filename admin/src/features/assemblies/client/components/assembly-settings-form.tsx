"use client";

import { BILL_PUBLISH_LEVEL_LABELS } from "@mirai-gikai/shared/bills/labels";
import { VOTE_GRANULARITY_LABELS } from "@mirai-gikai/shared/csv-import/types";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveAssemblySettings } from "../../server/actions/assembly-settings-actions";
import type {
  AssemblySettings,
  AssemblySettingsDataCounts,
  AssemblySettingsInput,
  PublishLevel,
  VoteGranularity,
} from "../../shared/types";
import {
  type FeatureVisibility,
  featureVisibility,
} from "../../shared/utils/validate-assembly-settings";

interface AssemblySettingsFormProps {
  assemblySlug: string;
  settings: AssemblySettings;
  hasMiraiMember: boolean;
  counts: AssemblySettingsDataCounts;
}

/** 議会設定（設計 v2 2.7節） */
export function AssemblySettingsForm({
  assemblySlug,
  settings,
  hasMiraiMember,
  counts,
}: AssemblySettingsFormProps) {
  const confirmId = useId();
  const [values, setValues] = useState<AssemblySettingsInput>({
    show_ai_chat: settings.show_ai_chat,
    show_interview: settings.show_interview,
    show_mirai_stance: settings.show_mirai_stance,
    vote_granularity: settings.vote_granularity,
    default_publish_level: settings.default_publish_level,
    interview_recipient_confirmed: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof AssemblySettingsInput>(
    key: K,
    value: AssemblySettingsInput[K]
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  // インタビューを新しく出すときだけ、届け先の確認を求める
  const needsInterviewConfirm =
    values.show_interview && !settings.show_interview;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveAssemblySettings(assemblySlug, values);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("議会設定を保存しました");
        set("interview_recipient_confirmed", false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-md border bg-white p-6">
      <SettingRow
        title="AIチャット"
        description="議会トップ・議案ページに AI チャットを出します"
        visibility={featureVisibility(
          values.show_ai_chat,
          counts.publishedBills
        )}
      >
        <Switch
          checked={values.show_ai_chat}
          onCheckedChange={(checked) => set("show_ai_chat", checked)}
        />
      </SettingRow>

      <SettingRow
        title="AIインタビュー"
        description="意見の届け先（意見を受け取る議員）がいる議会だけ出してください"
        visibility={featureVisibility(
          values.show_interview,
          counts.publicInterviews
        )}
      >
        <Switch
          checked={values.show_interview}
          onCheckedChange={(checked) => set("show_interview", checked)}
        />
      </SettingRow>
      {needsInterviewConfirm && (
        <div className="-mt-3 flex items-start gap-3 rounded-md bg-amber-50 p-3">
          <Checkbox
            id={confirmId}
            checked={values.interview_recipient_confirmed}
            onCheckedChange={(checked) =>
              set("interview_recipient_confirmed", checked === true)
            }
          />
          <Label htmlFor={confirmId} className="text-sm text-amber-800">
            集めた意見を受け取る議員がいることを確認しました
          </Label>
        </div>
      )}

      <SettingRow
        title="チームみらいのスタンス"
        description={
          hasMiraiMember
            ? "議案ページにチームみらいのスタンスを出します"
            : "チームみらいの議員がいない議会では出せません"
        }
        visibility={featureVisibility(
          values.show_mirai_stance,
          counts.publishedStances
        )}
      >
        <Switch
          checked={values.show_mirai_stance}
          disabled={!hasMiraiMember}
          onCheckedChange={(checked) => set("show_mirai_stance", checked)}
        />
      </SettingRow>

      <SettingRow
        title="議決結果の粒度"
        description="議案ページで議決結果をどこまで細かく出すか。CSV 取り込みでもこの粒度より細かい列は使いません"
      >
        <Select
          value={values.vote_granularity}
          onValueChange={(value) =>
            set("vote_granularity", value as VoteGranularity)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VOTE_GRANULARITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        title="新しい議案の掲載のしかた"
        description="CSV で取り込んだ議案に使う既定値です"
      >
        <Select
          value={values.default_publish_level}
          onValueChange={(value) =>
            set("default_publish_level", value as PublishLevel)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BILL_PUBLISH_LEVEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}

const VISIBILITY_BADGES: Record<FeatureVisibility, ReactNode> = {
  shown: <Badge variant="secondary">表示中</Badge>,
  hidden_no_data: <Badge variant="outline">データ0件のため非表示</Badge>,
  off: null,
};

function SettingRow({
  title,
  description,
  visibility,
  children,
}: {
  title: string;
  description: string;
  visibility?: FeatureVisibility;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{title}</p>
          {visibility && VISIBILITY_BADGES[visibility]}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
