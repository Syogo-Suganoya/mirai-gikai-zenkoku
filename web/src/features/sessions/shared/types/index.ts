import type { Enums, Tables } from "@mirai-gikai/db";

/** 会期（定例会・臨時会）。本家の diet_sessions の置き換え */
export type Session = Tables<"sessions">;
export type SessionType = Enums<"session_type_enum">;

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  regular: "定例会",
  extraordinary: "臨時会",
};
