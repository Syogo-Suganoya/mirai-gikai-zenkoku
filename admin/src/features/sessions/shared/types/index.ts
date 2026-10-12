import type { Database } from "@mirai-gikai/db";

export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionType = Database["public"]["Enums"]["session_type_enum"];

/** 会期の入力（作成・更新で共通） */
export type SessionInput = {
  session_key: string;
  name: string;
  type: SessionType;
  start_date: string;
  end_date: string;
  slug: string | null;
  source_url: string | null;
};

export type SessionWithBillCount = Session & { billCount: number };
