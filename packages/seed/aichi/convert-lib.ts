/**
 * 移行元（みらい議会＠愛知・名古屋）の愛知県議会のデータを、CSV インポートの形式に
 * 変換する純粋関数。
 */

import type { FuriganaSegment } from "@mirai-gikai/db";
import {
  inferBillCategory,
  normalizeBillResult,
} from "@mirai-gikai/shared/csv-import/normalize";
import { BILL_CATEGORY_LABELS } from "@mirai-gikai/shared/csv-import/types";

/** 移行元の data/agendas.json の1件 */
export type SourceAgenda = {
  council: string;
  sessionName: string;
  sessionMonth: string;
  submitter: string;
  billNumber: string;
  name: string;
  nameFurigana: FuriganaSegment[];
  committee: string;
  submittedDate?: string;
  decidedDate?: string;
  result: string;
  sourceUrl: string;
};

/** 移行元の data/bills.ts の1件（解説付きの注目議案） */
export type SourceExplainedBill = {
  id: string;
  council: string;
  sessionName: string;
  billNumber: string;
  name: string;
  nameFurigana: FuriganaSegment[];
  tags: string[];
  status: "introduced" | "in_deliberation" | "enacted" | "rejected";
  submittedDate: string;
  decidedDate?: string;
  sourceUrl: string;
  minutesText: string;
  summaryEasy: string;
  summaryDetailed: string;
  keyPoints: Array<{ title: string; body: string }>;
  reasons: Array<{ title: string; body: string }>;
  debatePoints: Array<{ topic: string; benefit: string; caution: string }>;
  affectedGroups: Array<{ who: string; effect: string }>;
};

export const AICHI_COUNCIL = "aichi_pref";

/** 愛知県議会の会期（開会日・閉会日は県サイトの会期日程ページで確認したもの） */
export const AICHI_SESSIONS = [
  {
    session_key: "2025-06",
    name: "令和7年6月定例議会",
    type: "定例会",
    start_date: "2025-06-19",
    end_date: "2025-07-08",
    source_url: "https://www.pref.aichi.jp/site/gikai/nittei-0706.html",
  },
  {
    session_key: "2025-12",
    name: "令和7年12月定例議会",
    type: "定例会",
    start_date: "2025-12-01",
    end_date: "2025-12-18",
    source_url: "https://www.pref.aichi.jp/site/gikai/nittei-0712.html",
  },
  {
    session_key: "2026-02",
    name: "令和8年2月定例議会",
    type: "定例会",
    start_date: "2026-02-18",
    end_date: "2026-03-25",
    source_url: "https://www.pref.aichi.jp/site/gikai/nittei-0802.html",
  },
  {
    session_key: "2026-05",
    name: "令和8年5月臨時議会",
    type: "臨時会",
    start_date: "2026-05-22",
    end_date: "2026-05-22",
    source_url: "https://www.pref.aichi.jp/site/gikai/nittei-0805.html",
  },
  {
    session_key: "2026-06",
    name: "令和8年6月定例議会",
    type: "定例会",
    start_date: "2026-06-15",
    end_date: "2026-07-02",
    source_url: "https://www.pref.aichi.jp/site/gikai/nittei-0806.html",
  },
] as const;

/** 移行元の会期名から会期キーを引く */
export function sessionKeyByName(sessionName: string): string {
  const session = AICHI_SESSIONS.find((s) => s.name === sessionName);
  if (!session) {
    throw new Error(`会期「${sessionName}」の会期キーが分かりません`);
  }
  return session.session_key;
}

/** 付託委員会は全角読点区切りのまま、空白を除く */
export function normalizeCommittee(committee: string): string {
  return committee.replace(/[\s　]/g, "");
}

/** タグ名から絵文字を除く（「予算💰」→「予算」） */
export function stripEmoji(label: string): string {
  return label
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .trim();
}

/** 議案 CSV の1行（列は英語名） */
export type BillCsvRow = {
  session_key: string;
  bill_number: string;
  official_name: string;
  name: string;
  category: string;
  submitter: string;
  submitted_date: string;
  committee_name: string;
  status: string;
  source_url: string;
  materials_url: string;
  source_pages: string;
  tags: string;
};

/** 議決結果 CSV の1行 */
export type ResultCsvRow = {
  session_key: string;
  bill_number: string;
  result: string;
  decided_on: string;
  yes_count: string;
  no_count: string;
  source_url: string;
};

export function agendaToBillRow(item: SourceAgenda): BillCsvRow {
  const category = inferBillCategory(item.name, item.result);
  return {
    session_key: item.sessionMonth,
    bill_number: item.billNumber,
    official_name: item.name,
    name: item.name,
    category: BILL_CATEGORY_LABELS[category],
    submitter: item.submitter,
    submitted_date: item.submittedDate ?? "",
    committee_name: normalizeCommittee(item.committee),
    status: item.result ? "議決済み" : "提出",
    // 移行元の URL は議会の日程のページで、議案の原文ではないので「議会のサイトの資料」に入れる
    source_url: "",
    materials_url: item.sourceUrl,
    source_pages: "",
    tags: "",
  };
}

/** 結果が空（未議決）の議案は議決結果を作らない */
export function agendaToResultRow(item: SourceAgenda): ResultCsvRow | null {
  if (!item.result) return null;
  if (!normalizeBillResult(item.result)) {
    throw new Error(`議決結果「${item.result}」を変換できません（${item.billNumber}）`);
  }
  return {
    session_key: item.sessionMonth,
    bill_number: item.billNumber,
    result: item.result,
    decided_on: item.decidedDate ?? "",
    yes_count: "",
    no_count: "",
    source_url: item.sourceUrl,
  };
}

export function explainedToBillRow(bill: SourceExplainedBill): BillCsvRow {
  const category = inferBillCategory(bill.name);
  return {
    session_key: sessionKeyByName(bill.sessionName),
    bill_number: bill.billNumber,
    official_name: bill.name,
    name: bill.name,
    category: BILL_CATEGORY_LABELS[category],
    submitter: "",
    submitted_date: bill.submittedDate,
    committee_name: "",
    status: bill.status === "enacted" || bill.status === "rejected" ? "議決済み" : "提出",
    // 移行元の URL は議会の日程のページで、議案の原文ではないので「議会のサイトの資料」に入れる
    source_url: "",
    materials_url: bill.sourceUrl,
    source_pages: "",
    tags: bill.tags.map(stripEmoji).join(";"),
  };
}

export function explainedToResultRow(
  bill: SourceExplainedBill
): ResultCsvRow | null {
  const result =
    bill.status === "enacted" ? "可決" : bill.status === "rejected" ? "否決" : null;
  if (!result) return null;
  return {
    session_key: sessionKeyByName(bill.sessionName),
    bill_number: bill.billNumber,
    result,
    decided_on: bill.decidedDate ?? "",
    yes_count: "",
    no_count: "",
    source_url: bill.sourceUrl,
  };
}

/** 本文の最初の1文（要約に使う） */
export function firstSentence(text: string): string {
  const index = text.indexOf("。");
  return index < 0 ? text : text.slice(0, index + 1);
}

/** 解説付き議案の「くわしく」の本文（各セクションを Markdown の見出しにして続ける） */
export function buildDetailedContent(bill: SourceExplainedBill): string {
  const parts = [bill.summaryDetailed];
  if (bill.keyPoints.length > 0) {
    parts.push(
      "## ポイント",
      bill.keyPoints.map((p) => `- **${p.title}**\n  ${p.body}`).join("\n")
    );
  }
  if (bill.reasons.length > 0) {
    parts.push(
      "## 必要な理由",
      bill.reasons.map((p) => `- **${p.title}**\n  ${p.body}`).join("\n")
    );
  }
  if (bill.debatePoints.length > 0) {
    parts.push(
      "## 意見が分かれるところ",
      bill.debatePoints
        .map(
          (p) =>
            `### ${p.topic}\n- よい点: ${p.benefit}\n- 気をつける点: ${p.caution}`
        )
        .join("\n\n")
    );
  }
  if (bill.affectedGroups.length > 0) {
    parts.push(
      "## 影響を受ける人",
      bill.affectedGroups.map((g) => `- **${g.who}**: ${g.effect}`).join("\n")
    );
  }
  return parts.join("\n\n");
}

/** 解説（bill_contents）と参照資料。CSV の対象外なので JSON で持つ */
export type ExplainedContents = {
  session_key: string;
  bill_number: string;
  tags: string[];
  knowledge_source: string;
  contents: Array<{
    difficulty_level: "normal" | "hard";
    title: string;
    summary: string;
    content: string;
  }>;
};

export function explainedToContents(bill: SourceExplainedBill): ExplainedContents {
  return {
    session_key: sessionKeyByName(bill.sessionName),
    bill_number: bill.billNumber,
    tags: bill.tags.map(stripEmoji),
    knowledge_source: bill.minutesText,
    contents: [
      {
        difficulty_level: "normal",
        title: bill.name,
        summary: firstSentence(bill.summaryEasy),
        content: bill.summaryEasy,
      },
      {
        difficulty_level: "hard",
        title: bill.name,
        summary: firstSentence(bill.summaryDetailed),
        content: buildDetailedContent(bill),
      },
    ],
  };
}
