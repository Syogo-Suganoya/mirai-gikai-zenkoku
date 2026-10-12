"use client";

import {
  BILL_CATEGORY_LABELS,
  BILL_PUBLISH_LEVEL_LABELS,
  BILL_STATUS_LABELS,
} from "@mirai-gikai/shared/bills/labels";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import type { Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Session } from "@/features/sessions/shared/types";
import type { BillFormValues } from "../../shared/types";
import { shouldAutoCloseInterviewOnBillStatus } from "../../shared/utils/should-auto-close-interview";
import { ThumbnailUpload } from "./thumbnail-upload";

type Option = { value: string; label: string };
const toOptions = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

interface BillFormFieldsProps {
  control: Control<BillFormValues>;
  billId?: string;
  sessions: Session[];
}

/** 議案の入力欄（設計 v3 6.1節）。作成と編集で共通 */
export function BillFormFields({
  control,
  billId,
  sessions,
}: BillFormFieldsProps) {
  return (
    <>
      <Section title="基本">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="session_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>会期 *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="会期を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}（{session.start_date}〜{session.end_date}
                        ）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sessions.length === 0 && (
                  <FormDescription>
                    会期がありません。先に「会期」の画面で追加してください
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <TextField
            control={control}
            name="bill_number"
            label="議案番号 *"
            placeholder="例: 議案第52号"
            description="会期の中で重ならない番号にしてください"
          />
        </div>

        <TextField
          control={control}
          name="official_name"
          label="正式名称 *"
          placeholder="例: ◯◯県手数料条例の一部を改正する条例案"
        />
        <TextField
          control={control}
          name="name"
          label="表示用タイトル"
          description="公開サイトに出すわかりやすい件名です。空なら正式名称を使います（最大200文字）。ふりがなは保存時に自動で付けます"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectField
            control={control}
            name="category"
            label="種類 *"
            options={toOptions(BILL_CATEGORY_LABELS)}
          />
          <TextField
            control={control}
            name="submitter"
            label="提出者"
            placeholder="例: 知事"
          />
          <FormField
            control={control}
            name="submitted_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>提出日</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <TextField
            control={control}
            name="committee_name"
            label="付託委員会"
            placeholder="例: 総務企画委員会"
          />
        </div>
      </Section>

      <Section title="審議">
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>状態 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="状態を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {toOptions(BILL_STATUS_LABELS).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                議決結果を CSV
                で取り込むと、状態は自動で「議決済み」などに変わります
              </FormDescription>
              {shouldAutoCloseInterviewOnBillStatus(field.value) && (
                <p className="flex items-start gap-2 rounded bg-amber-50 p-3 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    保存すると、この議案に紐づく公開中のインタビューは自動でクローズされます。
                  </span>
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="status_note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>状態の補足</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormDescription>最大500文字</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      <Section title="出典">
        <TextField
          control={control}
          name="source_url"
          label="原文 URL"
          placeholder="https://..."
          description="議会サイトの議案書のページ。公開サイトの「原文を見る」に使います"
        />
        <TextField
          control={control}
          name="source_pages"
          label="ページ範囲"
          placeholder="例: 12-15"
        />
      </Section>

      <Section title="掲載">
        <SelectField
          control={control}
          name="publish_level"
          label="掲載のしかた *"
          options={toOptions(BILL_PUBLISH_LEVEL_LABELS)}
          description="「解説あり」にすると、解説（ふつう・くわしく）を公開サイトに出します。公開は議案一覧から確認者が行います"
        />
        <TextField
          control={control}
          name="slug"
          label="スラッグ（URL 用・任意）"
          placeholder="例: 2026-09-52"
          description="半角英小文字・数字・ハイフン。空なら URL に議案の ID を使います"
        />
        <CheckboxField
          control={control}
          name="is_featured"
          label="注目の議案"
          description="議会トップの「注目の議案」に出します（会期中のみ）"
        />
        <CheckboxField
          control={control}
          name="is_review_completed"
          label="解説の確認完了"
          description="未完了の場合、解説に確認中の帯が出ます"
        />
        <FormField
          control={control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>サムネイル画像</FormLabel>
              <FormControl>
                <ThumbnailUpload
                  value={field.value}
                  onChange={field.onChange}
                  billId={billId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="share_thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>シェア用OGP画像</FormLabel>
              <FormControl>
                <ThumbnailUpload
                  value={field.value}
                  onChange={field.onChange}
                  billId={billId}
                  storagePrefix="share"
                />
              </FormControl>
              <FormDescription>
                設定しない場合はサムネイル画像が使用されます
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      <Section title="AIの参照資料">
        <FormField
          control={control}
          name="knowledge_source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ナレッジソース</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="議案の補足情報（議案書の要点・関連する条例など）を入力"
                  className="min-h-[200px] resize-y"
                />
              </FormControl>
              <FormDescription>
                AIインタビュー（常時参照）と、AIチャット（下のトグルで参照可否を切替）で使われる補足情報です。最大40,000文字。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="use_knowledge_source_in_chat"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>AIチャットでもナレッジソースを使用する</FormLabel>
                <FormDescription>
                  ONにすると、議案ページのAIチャットのシステムプロンプトに上のナレッジソースが追加されます。
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6 rounded-md border p-4">
      <legend className="px-1 text-sm font-semibold text-gray-700">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

type TextFieldName =
  | "bill_number"
  | "official_name"
  | "name"
  | "submitter"
  | "committee_name"
  | "source_url"
  | "source_pages"
  | "slug";

function TextField({
  control,
  name,
  label,
  placeholder,
  description,
}: {
  control: Control<BillFormValues>;
  name: TextFieldName;
  label: string;
  placeholder?: string;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder={placeholder}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  control,
  name,
  label,
  options,
  description,
}: {
  control: Control<BillFormValues>;
  name: "category" | "publish_level";
  label: string;
  options: Option[];
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CheckboxField({
  control,
  name,
  label,
  description,
}: {
  control: Control<BillFormValues>;
  name: "is_featured" | "is_review_completed";
  label: string;
  description: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}
