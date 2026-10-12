import type { Enums, Tables } from "@mirai-gikai/db";

export type Assembly = Tables<"assemblies">;
export type AssemblySettings = Tables<"assembly_settings">;
export type AssemblyType = Enums<"assembly_type_enum">;

/** 議会と議会ごとの設定（公開側の表示の出し分けに使う） */
export type AssemblyWithSettings = Assembly & {
  settings: AssemblySettings;
  /** この議会にダミーの議案があるか（画面上部の帯・noindex に使う。8.5.3節） */
  hasDummy: boolean;
};

/** 議会選択画面の1件 */
export type AssemblySummary = {
  id: string;
  slug: string;
  name: string;
  type: AssemblyType;
  prefecture_code: string;
  /** 公開中の議案の数 */
  publishedBillCount: number;
  /** 公開中の議案がすべてダミーか */
  dummyOnly: boolean;
  /** 開会中の会期の名前（なければ null） */
  activeSessionName: string | null;
};
