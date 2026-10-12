import { ExternalLink } from "lucide-react";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  BILL_RESULT_LABELS,
  type BillWithContent,
  FACTION_VOTE_LABELS,
  type VoteGranularity,
} from "../../../shared/types";
import { visibleResultFields } from "../../../shared/utils/visible-result";
import { getBillFactionVotes } from "../../loaders/get-bill-faction-votes";

interface BillResultSectionProps {
  bill: BillWithContent;
  granularity: VoteGranularity;
}

/**
 * 議決結果と会派ごとの賛否。議会が公開している事実なので、チームみらいの議員の有無に関係なく出す。
 * 出す項目は議会設定の粒度で決める（v2 2.2節）。
 */
export async function BillResultSection({
  bill,
  granularity,
}: BillResultSectionProps) {
  const result = bill.bill_result;
  const factionVotes =
    result && (granularity === "faction" || granularity === "member")
      ? await getBillFactionVotes(bill.id)
      : [];
  const visible = visibleResultFields(granularity, result, factionVotes.length);
  if (!result || !visible.result) return null;

  return (
    <section>
      <h2 className="text-[22px] font-bold mb-4">🏛️ 議決結果</h2>
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-2xl font-bold">
            {BILL_RESULT_LABELS[result.result]}
          </span>
          {result.decided_on && (
            <span className="text-sm text-mirai-text-secondary">
              {formatDateWithDots(result.decided_on)} 議決
            </span>
          )}
        </div>

        {visible.counts && (
          <dl className="flex gap-6 text-sm">
            <div className="flex gap-2">
              <dt className="text-mirai-text-secondary">賛成</dt>
              <dd className="font-bold">{result.yes_count ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-mirai-text-secondary">反対</dt>
              <dd className="font-bold">{result.no_count ?? "—"}</dd>
            </div>
          </dl>
        )}

        {visible.factions && (
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-xs font-bold text-mirai-text-secondary">
              会派ごとの賛否
            </caption>
            <tbody>
              {factionVotes.map((vote) => (
                <tr key={vote.faction_id} className="border-t">
                  <th scope="row" className="py-2 pr-4 text-left font-medium">
                    {vote.faction_name}
                  </th>
                  <td className="py-2 text-right font-bold">
                    {FACTION_VOTE_LABELS[vote.vote]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {result.source_url && (
          <a
            href={result.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 text-xs text-mirai-text-secondary underline"
          >
            議決結果の出典
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </section>
  );
}
