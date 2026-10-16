"use client";

import { factionsActiveOn } from "@mirai-gikai/shared/bill-results/factions";
import {
  BILL_RESULT_LABELS,
  type BillResult,
  FACTION_VOTE_LABELS,
  type FactionVote,
  VOTE_GRANULARITY_LABELS,
} from "@mirai-gikai/shared/csv-import/types";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VoteGranularity } from "@/features/assemblies/shared/types";
import { routes } from "@/lib/routes";
import {
  removeBillResult,
  saveBillResult,
} from "../../server/actions/bill-result-actions";
import type {
  BillResultFormValues,
  FactionOption,
  SavedBillResult,
} from "../../shared/types";
import {
  billResultInputFields,
  factionReferenceDate,
  toBillResultFormValues,
} from "../../shared/utils/bill-result-input";

/** 会派の賛否の「未入力」（Select は空文字の値を持てないため） */
const NO_VOTE = "none";

interface BillResultFormProps {
  billId: string;
  assemblySlug: string;
  granularity: VoteGranularity;
  saved: SavedBillResult | null;
  factions: FactionOption[];
  today: string;
}

/** 議決結果と会派ごとの賛否。出す欄は議会設定の粒度で決める */
export function BillResultForm({
  billId,
  assemblySlug,
  granularity,
  saved,
  factions,
  today,
}: BillResultFormProps) {
  const router = useRouter();
  const idPrefix = useId();
  const [values, setValues] = useState<BillResultFormValues>(() =>
    toBillResultFormValues(saved)
  );
  const [isSaving, setIsSaving] = useState(false);

  const fields = billResultInputFields(granularity);
  const referenceDate = factionReferenceDate(values.decided_on, today);
  const activeFactions = factionsActiveOn(factions, referenceDate);

  const set = <K extends keyof BillResultFormValues>(
    key: K,
    value: BillResultFormValues[K]
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const setFactionVote = (factionId: string, vote: FactionVote | "") =>
    setValues((prev) => ({
      ...prev,
      faction_votes: { ...prev.faction_votes, [factionId]: vote },
    }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 議決日を変えて有効でなくなった会派の賛否は送らない
      const activeIds = new Set(activeFactions.map((f) => f.id));
      const result = await saveBillResult(billId, {
        ...values,
        faction_votes: Object.fromEntries(
          Object.entries(values.faction_votes).filter(([id]) =>
            activeIds.has(id)
          )
        ),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("議決結果を保存しました");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      const result = await removeBillResult(billId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("議決結果を削除しました");
      setValues(toBillResultFormValues(null));
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const disabled = isSaving;
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>議決結果</CardTitle>
        <p className="text-sm text-muted-foreground">
          議会設定の粒度は「{VOTE_GRANULARITY_LABELS[granularity]}
          」です。保存すると、議案の状態も結果に合わせて「議決済み」「継続審査」「撤回」になります。
        </p>
        {granularity === "unpublished" && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            議会設定で議決結果を「非公開」にしているため、公開サイトには出ません。
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={id("result")}>結果</Label>
            <Select
              value={values.result || undefined}
              onValueChange={(value) => set("result", value as BillResult)}
              disabled={disabled}
            >
              <SelectTrigger id={id("result")} className="w-full">
                <SelectValue placeholder="選んでください" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BILL_RESULT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={id("decided-on")}>議決日</Label>
            <Input
              id={id("decided-on")}
              type="date"
              value={values.decided_on}
              onChange={(e) => set("decided_on", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {fields.counts && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={id("yes")}>賛成数</Label>
              <Input
                id={id("yes")}
                inputMode="numeric"
                value={values.yes_count}
                onChange={(e) => set("yes_count", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("no")}>反対数</Label>
              <Input
                id={id("no")}
                inputMode="numeric"
                value={values.no_count}
                onChange={(e) => set("no_count", e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={id("source")}>出典 URL</Label>
          <Input
            id={id("source")}
            type="url"
            placeholder="https://..."
            value={values.source_url}
            onChange={(e) => set("source_url", e.target.value)}
            disabled={disabled}
          />
        </div>

        {fields.factions && (
          <div className="space-y-2">
            <p className="text-sm font-medium">会派ごとの賛否</p>
            <p className="text-xs text-muted-foreground">
              {referenceDate}
              の時点で有効な会派です。会派の中で賛否が分かれたときは「分かれた」を選びます（議員ごとの内訳は扱いません）。
            </p>
            {activeFactions.length === 0 ? (
              <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                この日に有効な会派が登録されていません。会派は
                <Link
                  href={routes.assemblyImport(assemblySlug) as Route}
                  className="mx-1 underline"
                >
                  CSV 取り込み
                </Link>
                で登録してください。
              </p>
            ) : (
              <div className="divide-y rounded-md border">
                {activeFactions.map((faction) => (
                  <div
                    key={faction.id}
                    className="flex items-center justify-between gap-4 px-4 py-2"
                  >
                    <Label
                      htmlFor={id(`faction-${faction.id}`)}
                      className="font-normal"
                    >
                      {faction.name}
                    </Label>
                    <Select
                      value={values.faction_votes[faction.id] || NO_VOTE}
                      onValueChange={(value) =>
                        setFactionVote(
                          faction.id,
                          value === NO_VOTE ? "" : (value as FactionVote)
                        )
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={id(`faction-${faction.id}`)}
                        className="w-32"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_VOTE}>未入力</SelectItem>
                        {Object.entries(FACTION_VOTE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          {saved && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isSaving}>
                  削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>議決結果を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    結果と会派ごとの賛否を削除します。議案の状態は変わらないので、必要なら基本情報で直してください。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemove}>
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
