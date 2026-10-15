/** サービス名は管理画面と共通（packages/shared） */
export {
  SITE_NAME,
  SITE_NAME_LOCAL_PART,
  SITE_NAME_MAIN_PART,
} from "@mirai-gikai/shared/site/site-name";

/** テーマカラー（globals.css の --primary と合わせる） */
export const THEME_COLOR = "#3567c4";

/** 本家（チームみらい）とは別のサービスであることの表示（FORK_GUIDELINES.md の必須要件） */
export const NOT_OPERATED_BY_TEAM_MIRAI =
  "これは政党チームみらいが運営しているものではありません";
