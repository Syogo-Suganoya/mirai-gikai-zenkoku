/**
 * ダミーの議案のひな形（8.5.1節）。
 *
 * - AI は使わず、ひな形から毎回同じ内容を作る（架空の数字や事実をそれらしく作り込まないため）
 * - 金額・日付・人数などの数値は解説に入れない
 * - 件名には必ず「【ダミー】」、解説の冒頭には必ず架空である旨を入れる
 * - 実在の人・会派・政党の名前は使わない
 */

import type {
  BillCategory,
  BillResult,
  FactionVote,
  VoteGranularity,
} from "@mirai-gikai/shared/csv-import/types";
import type { DummyTheme } from "./prefectures";

export const DUMMY_PREFIX = "【ダミー】";
export const DUMMY_SESSION = {
  session_key: "2026-09",
  name: "令和8年9月定例会（ダミー）",
  start_date: "2026-09-01",
  end_date: "2026-09-30",
} as const;
export const DUMMY_FACTIONS = ["ダミー会派A", "ダミー会派B", "ダミー会派C"] as const;
export const DUMMY_FACTION_VALID_FROM = "2023-05-01";

/** 議決結果の粒度は都道府県ごとに順番に変える（会派別／票数のみ／可否のみ） */
const GRANULARITIES: VoteGranularity[] = ["faction", "count", "result_only"];
/** 第3号の議決結果は都道府県ごとに順番に変える（可決／修正可決／否決／継続審査） */
const THIRD_BILL_RESULTS: BillResult[] = ["passed", "amended", "rejected", "continued"];

export function dummyGranularity(index: number): VoteGranularity {
  return GRANULARITIES[index % GRANULARITIES.length];
}

export function disclaimer(theme: DummyTheme): string {
  return `この議案は表示確認用の架空のものです。${theme.landmark}・${theme.specialty}は実在しますが、議案の内容は事実ではありません。`;
}

export type DummyBill = {
  bill_number: string;
  name: string;
  category: BillCategory;
  publish_level: "explained" | "title_only";
  result: BillResult;
  /** 会派別の議会での賛否（ダミー会派A・B・C の順）。継続審査は採決しないので空 */
  faction_votes: FactionVote[];
  /** 票数のみの議会での賛成数・反対数（表示確認用） */
  counts: { yes: number; no: number } | null;
  contents: Array<{
    difficulty_level: "normal" | "hard";
    title: string;
    summary: string;
    content: string;
  }>;
  knowledge_source: string | null;
};

const VOTES_BY_RESULT: Record<BillResult, FactionVote[]> = {
  passed: ["for", "for", "abstain"],
  amended: ["for", "split", "for"],
  rejected: ["against", "against", "for"],
  continued: [],
  withdrawn: [],
  adopted: ["for", "for", "for"],
  not_adopted: ["against", "against", "against"],
};

const COUNTS_BY_RESULT: Record<BillResult, { yes: number; no: number } | null> = {
  passed: { yes: 40, no: 5 },
  amended: { yes: 30, no: 15 },
  rejected: { yes: 12, no: 33 },
  continued: null,
  withdrawn: null,
  adopted: { yes: 45, no: 0 },
  not_adopted: { yes: 0, no: 45 },
};

function explainedContents(theme: DummyTheme) {
  const note = `> ${disclaimer(theme)}`;
  const title = `${theme.landmark}周辺の観光案内を整える補正予算（ダミー）`;
  return [
    {
      difficulty_level: "normal" as const,
      title,
      summary: `${theme.landmark}を訪れる人のための観光案内を整える、架空の補正予算です。`,
      content: [
        note,
        `${theme.prefecture}が、${theme.landmark}を訪れる人のために、案内板や観光案内所を整えるためのお金を追加する補正予算の案です（架空）。`,
        `あわせて、地域の特産品である${theme.specialty}を紹介する取り組みにも使うとしています（架空）。`,
      ].join("\n\n"),
    },
    {
      difficulty_level: "hard" as const,
      title,
      summary: `${theme.landmark}周辺の観光案内の整備と、${theme.specialty}の紹介にかかる費用を追加する架空の補正予算です。`,
      content: [
        note,
        `年度の途中で、${theme.landmark}周辺の観光案内の整備にかかる費用を一般会計に追加する補正予算の案です（架空）。`,
        "## ポイント",
        `- **${theme.landmark}周辺の案内板・観光案内所を整える**\n  外国から来た人にも分かるよう、案内を複数の言語で示すとしています（架空）。\n- **${theme.specialty}を紹介する取り組みを行う**\n  観光案内所で地域の特産品を紹介するとしています（架空）。`,
        "## 必要な理由",
        `- **訪れる人が迷わないようにするため**\n  ${theme.landmark}を訪れる人が増えると、道案内や混雑の案内が必要になるためとしています（架空）。`,
        "## 意見が分かれるところ",
        `### 観光案内にお金をかける優先度\n- よい点: 訪れる人が過ごしやすくなり、地域の店にも人が来やすくなります。\n- 気をつける点: ほかの事業との優先順位をどう考えるかは、議会で議論される点です。`,
        "## 影響を受ける人",
        `- **${theme.landmark}を訪れる人**: 案内が分かりやすくなります（架空）。\n- **周辺に住む人・店**: 人の流れが変わる可能性があります（架空）。`,
      ].join("\n\n"),
    },
  ];
}

export function buildDummyBills(theme: DummyTheme, index: number): DummyBill[] {
  const third = THIRD_BILL_RESULTS[index % THIRD_BILL_RESULTS.length];
  return [
    {
      bill_number: "第1号",
      name: `${DUMMY_PREFIX}令和8年度${theme.prefecture}一般会計補正予算（${theme.landmark}周辺の観光案内の整備）`,
      category: "budget",
      publish_level: "explained",
      result: "passed",
      faction_votes: VOTES_BY_RESULT.passed,
      counts: COUNTS_BY_RESULT.passed,
      contents: explainedContents(theme),
      // AIチャットが架空の議案だと分かるよう、参照資料にも明記する
      knowledge_source: `${disclaimer(theme)}\nこの議案に関する事実（金額・日程・議論の内容など）は存在しません。質問には、架空の議案であることを最初に伝えたうえで、一般的な仕組みの説明だけを答えてください。`,
    },
    {
      bill_number: "第2号",
      name: `${DUMMY_PREFIX}${theme.prefecture}${theme.specialty}ブランド振興条例の制定について`,
      category: "ordinance",
      publish_level: "title_only",
      result: "passed",
      faction_votes: ["for", "for", "for"],
      counts: { yes: 45, no: 0 },
      contents: [],
      knowledge_source: null,
    },
    {
      bill_number: "第3号",
      name: `${DUMMY_PREFIX}${theme.landmark}の景観保全条例の一部を改正する条例について`,
      category: "ordinance",
      publish_level: "title_only",
      result: third,
      faction_votes: VOTES_BY_RESULT[third],
      counts: COUNTS_BY_RESULT[third],
      contents: [],
      knowledge_source: null,
    },
  ];
}
