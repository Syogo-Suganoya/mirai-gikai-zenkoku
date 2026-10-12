import { pgTable, uniqueIndex, check, uuid, text, boolean, timestamp, index, foreignKey, unique, smallint, date, jsonb, integer, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/** Supabase の生成型と同じ JSON 型 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** ふりがな表示用のセグメント。text を順に連結すると元の文章になる */
export type FuriganaSegment = { text: string; reading?: string };

export const assembly_member_role_enum = pgEnum("assembly_member_role_enum", ['reviewer', 'editor'])
export const assembly_status_enum = pgEnum("assembly_status_enum", ['master_only', 'preparing', 'public'])
export const assembly_type_enum = pgEnum("assembly_type_enum", ['prefecture', 'city', 'special_ward', 'town', 'village'])
export const bill_category_enum = pgEnum("bill_category_enum", ['budget', 'ordinance', 'personnel', 'contract', 'petition', 'report', 'other'])
export const bill_priority_enum = pgEnum("bill_priority_enum", ['high', 'medium', 'low'])
export const bill_publish_level_enum = pgEnum("bill_publish_level_enum", ['title_only', 'explained'])
export const bill_publish_status = pgEnum("bill_publish_status", ['draft', 'published', 'coming_soon'])
export const bill_result_enum = pgEnum("bill_result_enum", ['passed', 'amended', 'rejected', 'continued', 'withdrawn', 'adopted', 'not_adopted'])
export const bill_status_enum = pgEnum("bill_status_enum", ['preparing', 'introduced', 'referred_to_committee', 'decided', 'continued', 'withdrawn'])
export const chat_role_enum = pgEnum("chat_role_enum", ['user', 'system', 'assistant'])
export const check_interval_enum = pgEnum("check_interval_enum", ['session_daily', 'daily', 'weekly'])
export const csv_import_kind_enum = pgEnum("csv_import_kind_enum", ['assemblies', 'factions', 'sessions', 'bills', 'results'])
export const csv_import_status_enum = pgEnum("csv_import_status_enum", ['validated', 'committed', 'failed', 'cancelled'])
export const difficulty_level_enum = pgEnum("difficulty_level_enum", ['normal', 'hard'])
export const faction_vote_enum = pgEnum("faction_vote_enum", ['for', 'against', 'abstain', 'absent', 'split'])
export const fetch_method_enum = pgEnum("fetch_method_enum", ['link_diff', 'vendor'])
export const import_job_status_enum = pgEnum("import_job_status_enum", ['splitting', 'waiting_selection', 'drafting', 'completed', 'failed'])
export const import_source_enum = pgEnum("import_source_enum", ['url', 'upload'])
export const interview_config_status_enum = pgEnum("interview_config_status_enum", ['public', 'closed'])
export const interview_feedback_tag_enum = pgEnum("interview_feedback_tag_enum", ['irrelevant_questions', 'not_aligned', 'misunderstood', 'too_many_questions', 'other'])
export const interview_mode_enum = pgEnum("interview_mode_enum", ['loop', 'bulk', 'targeted'])
export const interview_report_role_enum = pgEnum("interview_report_role_enum", ['subject_expert', 'work_related', 'daily_life_affected', 'general_citizen'])
export const interview_role_enum = pgEnum("interview_role_enum", ['assistant', 'user'])
export const moderation_status_enum = pgEnum("moderation_status_enum", ['ok', 'warning', 'ng'])
export const objection_status_enum = pgEnum("objection_status_enum", ['open', 'fixed', 'declined'])
export const session_type_enum = pgEnum("session_type_enum", ['regular', 'extraordinary'])
export const source_document_status_enum = pgEnum("source_document_status_enum", ['detected', 'imported', 'ignored', 'failed'])
export const source_kind_enum = pgEnum("source_kind_enum", ['bills', 'results', 'references', 'reiki', 'schedule', 'minutes_flash', 'minutes'])
export const source_vendor_enum = pgEnum("source_vendor_enum", ['discuss', 'dbsr', 'voices', 'kensakusystem'])
export const stance_type_enum = pgEnum("stance_type_enum", ['for', 'against', 'neutral', 'conditional_for', 'conditional_against', 'considering', 'continued_deliberation', 'free_vote'])
export const topic_analysis_status = pgEnum("topic_analysis_status", ['pending', 'running', 'completed', 'failed'])
export const vote_granularity_enum = pgEnum("vote_granularity_enum", ['member', 'faction', 'count', 'result_only', 'unpublished'])


export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	password_hash: text().notNull(),
	is_super_admin: boolean().default(false).notNull(),
	must_change_password: boolean().default(true).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	last_login_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("users_email_key").using("btree", sql`lower(email)`),
	check("users_email_check", sql`email ~ '^[^@\s]+@[^@\s]+$'::text`),
]);

export const user_sessions = pgTable("user_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	token_hash: text().notNull(),
	expires_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_sessions_expires_at_idx").using("btree", table.expires_at.asc().nullsLast()),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "user_sessions_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_sessions_token_hash_key").on(table.token_hash),
]);

export const login_attempts = pgTable("login_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	ip: text().notNull(),
	succeeded: boolean().notNull(),
	attempted_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("login_attempts_email_idx").using("btree", sql`lower(email)`, sql`attempted_at`),
	index("login_attempts_ip_idx").using("btree", table.ip.asc().nullsLast(), table.attempted_at.asc().nullsLast()),
]);

export const assemblies = pgTable("assemblies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	type: assembly_type_enum().notNull(),
	local_gov_code: text().notNull(),
	prefecture_code: text().notNull(),
	status: assembly_status_enum().default('master_only').notNull(),
	official_url: text(),
	has_mirai_member: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_assemblies_prefecture_code").using("btree", table.prefecture_code.asc().nullsLast()),
	unique("assemblies_slug_key").on(table.slug),
	unique("assemblies_local_gov_code_key").on(table.local_gov_code),
]);

export const assembly_settings = pgTable("assembly_settings", {
	assembly_id: uuid().primaryKey().notNull(),
	show_ai_chat: boolean().default(true).notNull(),
	show_interview: boolean().default(false).notNull(),
	show_mirai_stance: boolean().default(false).notNull(),
	vote_granularity: vote_granularity_enum().default('result_only').notNull(),
	default_publish_level: bill_publish_level_enum().default('title_only').notNull(),
	updated_by: uuid(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "assembly_settings_assembly_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updated_by],
			foreignColumns: [users.id],
			name: "assembly_settings_updated_by_fkey"
		}).onDelete("set null"),
]);

export const assembly_factions = pgTable("assembly_factions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assembly_id: uuid().notNull(),
	name: text().notNull(),
	short_name: text(),
	seats: smallint(),
	valid_from: date().notNull(),
	valid_to: date(),
	is_dummy: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "assembly_factions_assembly_id_fkey"
		}).onDelete("cascade"),
	unique("assembly_factions_name_unique").on(table.assembly_id, table.name, table.valid_from),
]);

export const anonymous_visitors = pgTable("anonymous_visitors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	last_seen_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assembly_id: uuid().notNull(),
	session_key: text().notNull(),
	name: text().notNull(),
	type: session_type_enum().default('regular').notNull(),
	start_date: date().notNull(),
	end_date: date().notNull(),
	is_active: boolean().default(false).notNull(),
	source_url: text(),
	slug: text(),
	is_dummy: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sessions_date_range").using("btree", table.assembly_id.asc().nullsLast(), table.start_date.asc().nullsLast(), table.end_date.asc().nullsLast()),
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "sessions_assembly_id_fkey"
		}).onDelete("cascade"),
	unique("sessions_assembly_session_key").on(table.assembly_id, table.session_key),
	unique("sessions_assembly_slug").on(table.assembly_id, table.slug),
	check("end_date_after_start_date", sql`end_date >= start_date`),
]);

export const bills = pgTable("bills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assembly_id: uuid().notNull(),
	session_id: uuid().notNull(),
	bill_number: text().notNull(),
	name: text().notNull(),
	name_furigana: jsonb().$type<FuriganaSegment[]>(),
	official_name: text().notNull(),
	category: bill_category_enum().notNull(),
	committee_name: text(),
	submitter: text(),
	submitted_date: date(),
	status: bill_status_enum().default('introduced').notNull(),
	status_note: text(),
	source_url: text(),
	source_file_path: text(),
	source_pages: text(),
	publish_level: bill_publish_level_enum().default('title_only').notNull(),
	review_priority: bill_priority_enum(),
	reviewed_by: uuid(),
	reviewed_at: timestamp({ withTimezone: true, mode: 'string' }),
	is_dummy: boolean().default(false).notNull(),
	slug: text(),
	publish_status: bill_publish_status().default('draft').notNull(),
	published_at: timestamp({ withTimezone: true, mode: 'string' }),
	is_featured: boolean().default(false).notNull(),
	is_review_completed: boolean().default(false).notNull(),
	knowledge_source: text(),
	use_knowledge_source_in_chat: boolean().default(false).notNull(),
	thumbnail_url: text(),
	share_thumbnail_url: text(),
	status_order: integer().generatedAlwaysAs(sql`
CASE status
    WHEN 'decided'::bill_status_enum THEN 0
    WHEN 'continued'::bill_status_enum THEN 1
    WHEN 'withdrawn'::bill_status_enum THEN 2
    WHEN 'referred_to_committee'::bill_status_enum THEN 3
    WHEN 'introduced'::bill_status_enum THEN 4
    WHEN 'preparing'::bill_status_enum THEN 5
    ELSE NULL::integer
END`),
	publish_status_order: integer().generatedAlwaysAs(sql`
CASE publish_status
    WHEN 'draft'::bill_publish_status THEN 0
    WHEN 'coming_soon'::bill_publish_status THEN 1
    WHEN 'published'::bill_publish_status THEN 2
    ELSE NULL::integer
END`),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_bills_assembly_id").using("btree", table.assembly_id.asc().nullsLast()),
	index("idx_bills_is_dummy").using("btree", table.is_dummy.asc().nullsLast()).where(sql`(is_dummy = true)`),
	index("idx_bills_is_featured").using("btree", table.is_featured.asc().nullsLast()).where(sql`(is_featured = true)`),
	index("idx_bills_publish_status").using("btree", table.publish_status.asc().nullsLast()),
	index("idx_bills_publish_status_created_at_id").using("btree", table.publish_status.asc().nullsLast(), table.created_at.desc().nullsFirst(), table.id.desc().nullsFirst()),
	index("idx_bills_publish_status_order").using("btree", table.publish_status_order.asc().nullsLast()),
	index("idx_bills_published_at").using("btree", table.published_at.desc().nullsFirst()),
	index("idx_bills_session_id").using("btree", table.session_id.asc().nullsLast()),
	index("idx_bills_status").using("btree", table.status.asc().nullsLast()),
	index("idx_bills_status_order").using("btree", table.status_order.asc().nullsLast()),
	index("idx_bills_submitted_date").using("btree", table.submitted_date.desc().nullsFirst()),
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "bills_assembly_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "bills_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewed_by],
			foreignColumns: [users.id],
			name: "bills_reviewed_by_fkey"
		}).onDelete("set null"),
	unique("bills_assembly_slug").on(table.assembly_id, table.slug),
	unique("bills_session_bill_number").on(table.session_id, table.bill_number),
]);

export const bill_contents = pgTable("bill_contents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	difficulty_level: difficulty_level_enum().notNull(),
	title: text().notNull(),
	summary: text().notNull(),
	content: text().notNull(),
	furigana: jsonb().$type<FuriganaSegment[]>(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_bill_contents_bill_id").using("btree", table.bill_id.asc().nullsLast()),
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "bill_contents_bill_id_fkey"
		}).onDelete("cascade"),
	unique("bill_contents_bill_id_difficulty_level_key").on(table.bill_id, table.difficulty_level),
]);

export const bill_results = pgTable("bill_results", {
	bill_id: uuid().primaryKey().notNull(),
	result: bill_result_enum().notNull(),
	decided_on: date(),
	yes_count: smallint(),
	no_count: smallint(),
	source_url: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "bill_results_bill_id_fkey"
		}).onDelete("cascade"),
]);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	label: text().notNull(),
	description: text(),
	featured_priority: integer(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tags_featured_priority").using("btree", table.featured_priority.asc().nullsLast()).where(sql`(featured_priority IS NOT NULL)`),
	unique("tags_label_key").on(table.label),
]);

export const mirai_stances = pgTable("mirai_stances", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	type: stance_type_enum().notNull(),
	comment: text(),
	publish_at: timestamp({ withTimezone: true, mode: 'string' }),
	reason_summary: text(),
	reason_points: text().array().default([""]).notNull(),
	supplements: jsonb().$type<Json>().default([]).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "mirai_stances_bill_id_fkey"
		}).onDelete("cascade"),
	unique("mirai_stances_bill_id_key").on(table.bill_id),
]);

export const preview_tokens = pgTable("preview_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	token: text().notNull(),
	expires_at: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	created_by: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_preview_tokens_bill_id").using("btree", table.bill_id.asc().nullsLast()),
	index("idx_preview_tokens_expires_at").using("btree", table.expires_at.asc().nullsLast()),
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "preview_tokens_bill_id_fkey"
		}).onDelete("cascade"),
	unique("preview_tokens_token_key").on(table.token),
]);

export const bill_objections = pgTable("bill_objections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	body: text().notNull(),
	status: objection_status_enum().default('open').notNull(),
	response: text(),
	responded_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	responded_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_bill_objections_bill_id").using("btree", table.bill_id.asc().nullsLast()),
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "bill_objections_bill_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.responded_by],
			foreignColumns: [users.id],
			name: "bill_objections_responded_by_fkey"
		}).onDelete("set null"),
]);

export const csv_import_jobs = pgTable("csv_import_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assembly_id: uuid(),
	kind: csv_import_kind_enum().notNull(),
	file_name: text().notNull(),
	file_path: text().notNull(),
	encoding: text().notNull(),
	status: csv_import_status_enum().notNull(),
	row_count: integer().notNull(),
	insert_count: integer().default(0).notNull(),
	update_count: integer().default(0).notNull(),
	error_count: integer().default(0).notNull(),
	errors: jsonb().$type<Json>().default([]).notNull(),
	payload: jsonb().$type<Json>(),
	created_by: uuid().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	committed_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_csv_import_jobs_assembly").using("btree", table.assembly_id.asc().nullsLast(), table.created_at.desc().nullsFirst()),
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "csv_import_jobs_assembly_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [users.id],
			name: "csv_import_jobs_created_by_fkey"
		}),
]);

export const bill_import_jobs = pgTable("bill_import_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assembly_id: uuid().notNull(),
	session_id: uuid(),
	source: import_source_enum().notNull(),
	source_document_id: uuid(),
	source_file_path: text().notNull(),
	source_url: text(),
	status: import_job_status_enum().notNull(),
	detected_bills: jsonb().$type<Json>(),
	error: text(),
	created_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "bill_import_jobs_assembly_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.session_id],
			foreignColumns: [sessions.id],
			name: "bill_import_jobs_session_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [users.id],
			name: "bill_import_jobs_created_by_fkey"
		}).onDelete("set null"),
]);

export const assembly_sources = pgTable("assembly_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assembly_id: uuid().notNull(),
	kind: source_kind_enum().notNull(),
	fetch_method: fetch_method_enum().default('link_diff').notNull(),
	vendor: source_vendor_enum(),
	vendor_tenant: text(),
	list_url: text().notNull(),
	follow_depth: smallint().default(1).notNull(),
	check_interval: check_interval_enum().default('session_daily').notNull(),
	last_checked_at: timestamp({ withTimezone: true, mode: 'string' }),
	last_error: text(),
	created_by: uuid().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "assembly_sources_assembly_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [users.id],
			name: "assembly_sources_created_by_fkey"
		}),
	unique("assembly_sources_unique").on(table.assembly_id, table.kind, table.list_url),
]);

export const assembly_source_documents = pgTable("assembly_source_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	source_id: uuid().notNull(),
	url: text().notNull(),
	logical_key: text(),
	content_hash: text(),
	ai_judgement: jsonb().$type<Json>(),
	status: source_document_status_enum().notNull(),
	import_job_id: uuid(),
	detected_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_assembly_source_documents_logical_key").using("btree", table.source_id.asc().nullsLast(), table.logical_key.asc().nullsLast()),
	foreignKey({
			columns: [table.source_id],
			foreignColumns: [assembly_sources.id],
			name: "assembly_source_documents_source_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.import_job_id],
			foreignColumns: [bill_import_jobs.id],
			name: "assembly_source_documents_import_job_id_fkey"
		}).onDelete("set null"),
	unique("assembly_source_documents_unique").on(table.source_id, table.url),
]);

export const assembly_surveys = pgTable("assembly_surveys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assembly_id: uuid().notNull(),
	surveyed_at: date().notNull(),
	tier: smallint().notNull(),
	vote_granularity: vote_granularity_enum(),
	archive_strength: text(),
	findings: jsonb().$type<Json>().notNull(),
	report_markdown: text(),
	created_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "assembly_surveys_assembly_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.created_by],
			foreignColumns: [users.id],
			name: "assembly_surveys_created_by_fkey"
		}).onDelete("set null"),
	check("assembly_surveys_tier_check", sql`(tier >= 0) AND (tier <= 2)`),
]);

export const chats = pgTable("chats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	user_id: uuid(),
	role: chat_role_enum().notNull(),
	message: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_chats_bill_user").using("btree", table.bill_id.asc().nullsLast(), table.user_id.asc().nullsLast()),
	index("idx_chats_created_at").using("btree", table.created_at.desc().nullsFirst()),
	index("idx_chats_user_id").using("btree", table.user_id.asc().nullsLast()),
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "chats_bill_id_fkey"
		}).onDelete("cascade"),
]);

export const chat_usage_events = pgTable("chat_usage_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	session_id: text(),
	prompt_name: text(),
	model: text().notNull(),
	input_tokens: integer().default(0).notNull(),
	output_tokens: integer().default(0).notNull(),
	total_tokens: integer().default(0).notNull(),
	cost_usd: numeric({ precision: 12, scale: 6, mode: "number" }).default(0).notNull(),
	metadata: jsonb().$type<Json>(),
	occurred_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_usage_events_session_id_idx").using("btree", table.session_id.asc().nullsLast()),
	index("chat_usage_events_user_id_occurred_at_idx").using("btree", table.user_id.asc().nullsLast(), table.occurred_at.asc().nullsLast()),
]);

export const interview_messages = pgTable("interview_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interview_session_id: uuid().notNull(),
	role: interview_role_enum().notNull(),
	content: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_interview_messages_session_created").using("btree", table.interview_session_id.asc().nullsLast(), table.created_at.asc().nullsLast()),
	foreignKey({
			columns: [table.interview_session_id],
			foreignColumns: [interview_sessions.id],
			name: "interview_messages_interview_session_id_fkey"
		}).onDelete("cascade"),
]);

export const expert_registrations = pgTable("expert_registrations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	name: text().notNull(),
	affiliation: text().notNull(),
	email: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [anonymous_visitors.id],
			name: "expert_registrations_user_id_fkey"
		}).onDelete("cascade"),
	unique("expert_registrations_user_id_key").on(table.user_id),
	unique("expert_registrations_email_key").on(table.email),
]);

export const interview_configs = pgTable("interview_configs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	status: interview_config_status_enum().default('closed').notNull(),
	name: text().notNull(),
	mode: interview_mode_enum().default('loop').notNull(),
	themes: text().array(),
	chat_model: text(),
	estimated_duration: integer(),
	prompt_overrides: jsonb().$type<Json>(),
	deleted_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_interview_configs_bill_id").using("btree", table.bill_id.asc().nullsLast()),
	uniqueIndex("idx_interview_configs_bill_public").using("btree", table.bill_id.asc().nullsLast()).where(sql`(status = 'public'::interview_config_status_enum)`),
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "interview_configs_bill_id_fkey"
		}).onDelete("cascade"),
]);

export const interview_questions = pgTable("interview_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interview_config_id: uuid().notNull(),
	question: text().notNull(),
	follow_up_guide: text(),
	quick_replies: text().array(),
	question_order: integer().notNull(),
	target_audience: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_interview_questions_config_order").using("btree", table.interview_config_id.asc().nullsLast(), table.question_order.asc().nullsLast()),
	foreignKey({
			columns: [table.interview_config_id],
			foreignColumns: [interview_configs.id],
			name: "interview_questions_interview_config_id_fkey"
		}).onDelete("cascade"),
]);

export const interview_sessions = pgTable("interview_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interview_config_id: uuid().notNull(),
	user_id: uuid().notNull(),
	langfuse_session_id: text(),
	started_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completed_at: timestamp({ withTimezone: true, mode: 'string' }),
	archived_at: timestamp({ withTimezone: true, mode: 'string' }),
	rating: smallint(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_interview_sessions_config_user").using("btree", table.interview_config_id.asc().nullsLast(), table.user_id.asc().nullsLast()),
	index("idx_interview_sessions_started_at").using("btree", table.started_at.asc().nullsLast()),
	index("idx_interview_sessions_user_id").using("btree", table.user_id.asc().nullsLast()),
	foreignKey({
			columns: [table.interview_config_id],
			foreignColumns: [interview_configs.id],
			name: "interview_sessions_interview_config_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [anonymous_visitors.id],
			name: "interview_sessions_user_id_fkey"
		}).onDelete("cascade"),
	check("interview_sessions_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const interview_rating_feedbacks = pgTable("interview_rating_feedbacks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interview_session_id: uuid().notNull(),
	tag: interview_feedback_tag_enum().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.interview_session_id],
			foreignColumns: [interview_sessions.id],
			name: "interview_rating_feedbacks_interview_session_id_fkey"
		}).onDelete("cascade"),
	unique("interview_rating_feedbacks_session_tag_key").on(table.interview_session_id, table.tag),
]);

export const interview_report = pgTable("interview_report", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interview_session_id: uuid().notNull(),
	summary: text(),
	stance: stance_type_enum(),
	role: interview_report_role_enum(),
	role_title: text(),
	role_description: text(),
	opinions: jsonb().$type<Json>(),
	content_richness: jsonb().$type<Json>(),
	total_content_richness: integer().generatedAlwaysAs(sql`
CASE
    WHEN ((content_richness IS NOT NULL) AND ((content_richness ->> 'total'::text) IS NOT NULL) AND ((content_richness ->> 'total'::text) ~ '^\d+$'::text)) THEN ((content_richness ->> 'total'::text))::integer
    ELSE NULL::integer
END`),
	moderation_score: integer(),
	moderation_status: moderation_status_enum().generatedAlwaysAs(sql`
CASE
    WHEN (moderation_score IS NULL) THEN NULL::moderation_status_enum
    WHEN (moderation_score >= 70) THEN 'ng'::moderation_status_enum
    WHEN (moderation_score >= 30) THEN 'warning'::moderation_status_enum
    ELSE 'ok'::moderation_status_enum
END`),
	moderation_reasoning: text(),
	is_public_by_admin: boolean().default(false).notNull(),
	is_public_by_user: boolean().default(false).notNull(),
	is_data_reuse_consented: boolean().default(false).notNull(),
	admin_unpublished_at: timestamp({ withTimezone: true, mode: 'string' }),
	opinions_reextracted_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_interview_report_is_public_by_admin").using("btree", table.is_public_by_admin.asc().nullsLast()),
	index("idx_interview_report_total_content_richness").using("btree", table.total_content_richness.desc().nullsLast()),
	foreignKey({
			columns: [table.interview_session_id],
			foreignColumns: [interview_sessions.id],
			name: "interview_report_interview_session_id_fkey"
		}).onDelete("cascade"),
	unique("interview_report_interview_session_id_key").on(table.interview_session_id),
	check("interview_report_moderation_score_check", sql`(moderation_score IS NULL) OR ((moderation_score >= 0) AND (moderation_score <= 100))`),
]);

export const interview_opinion = pgTable("interview_opinion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interview_report_id: uuid().notNull(),
	opinion_index: smallint().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	source_message_id: uuid(),
	contextual_quote: text(),
	bill_sentiment: text(),
	richness: integer(),
	concern: text(),
	proposal: text(),
	reasoning_types: text().array().default([""]).notNull(),
	topic_extracted_at: timestamp({ withTimezone: true, mode: 'string' }),
	tags_extracted_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.interview_report_id],
			foreignColumns: [interview_report.id],
			name: "interview_opinion_interview_report_id_fkey"
		}).onDelete("cascade"),
	unique("interview_opinion_report_index_key").on(table.interview_report_id, table.opinion_index),
]);

export const report_reactions = pgTable("report_reactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interview_report_id: uuid().notNull(),
	user_id: uuid().notNull(),
	reaction_type: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_report_reactions_user_id").using("btree", table.user_id.asc().nullsLast()),
	foreignKey({
			columns: [table.interview_report_id],
			foreignColumns: [interview_report.id],
			name: "report_reactions_interview_report_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [anonymous_visitors.id],
			name: "report_reactions_user_id_fkey"
		}).onDelete("cascade"),
	unique("report_reactions_report_user_key").on(table.interview_report_id, table.user_id),
	check("report_reactions_reaction_type_check", sql`reaction_type = ANY (ARRAY['helpful'::text, 'hmm'::text])`),
]);

export const topic_analysis_versions = pgTable("topic_analysis_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	version: integer().notNull(),
	status: text().default('pending').notNull(),
	summary_md: text(),
	intermediate_results: jsonb().$type<Json>(),
	phase_data: jsonb().$type<Json>(),
	current_step: text(),
	error_message: text(),
	started_at: timestamp({ withTimezone: true, mode: 'string' }),
	completed_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "topic_analysis_versions_bill_id_fkey"
		}).onDelete("cascade"),
	unique("topic_analysis_versions_bill_id_version_key").on(table.bill_id, table.version),
	check("topic_analysis_versions_status_check", sql`status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])`),
]);

export const topic_analysis_topics = pgTable("topic_analysis_topics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	version_id: uuid().notNull(),
	name: text().notNull(),
	description_md: text().notNull(),
	representative_opinions: jsonb().$type<Json>().default([]).notNull(),
	sort_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_topic_analysis_topics_version_id").using("btree", table.version_id.asc().nullsLast()),
	foreignKey({
			columns: [table.version_id],
			foreignColumns: [topic_analysis_versions.id],
			name: "topic_analysis_topics_version_id_fkey"
		}).onDelete("cascade"),
]);

export const topic_analysis_classifications = pgTable("topic_analysis_classifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	version_id: uuid().notNull(),
	interview_report_id: uuid().notNull(),
	topic_id: uuid().notNull(),
	opinion_index: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.version_id],
			foreignColumns: [topic_analysis_versions.id],
			name: "topic_analysis_classifications_version_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.interview_report_id],
			foreignColumns: [interview_report.id],
			name: "topic_analysis_classifications_interview_report_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.topic_id],
			foreignColumns: [topic_analysis_topics.id],
			name: "topic_analysis_classifications_topic_id_fkey"
		}).onDelete("cascade"),
	unique("topic_analysis_classifications_key").on(table.version_id, table.interview_report_id, table.topic_id, table.opinion_index),
]);

export const topic_analysis_version = pgTable("topic_analysis_version", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	bill_id: uuid().notNull(),
	version: integer().notNull(),
	status: topic_analysis_status().default('pending').notNull(),
	is_published: boolean().default(false).notNull(),
	current_step: text(),
	progress: jsonb().$type<Json>(),
	trigger: text().notNull(),
	model: text(),
	prompt_version: text(),
	source_opinion_count: integer(),
	error_message: text(),
	started_at: timestamp({ withTimezone: true, mode: 'string' }),
	completed_at: timestamp({ withTimezone: true, mode: 'string' }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("one_active_version_per_bill").using("btree", table.bill_id.asc().nullsLast()).where(sql`(status = ANY (ARRAY['pending'::topic_analysis_status, 'running'::topic_analysis_status]))`),
	uniqueIndex("one_published_per_bill").using("btree", table.bill_id.asc().nullsLast()).where(sql`is_published`),
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "topic_analysis_version_bill_id_fkey"
		}).onDelete("cascade"),
	unique("topic_analysis_version_bill_id_version_key").on(table.bill_id, table.version),
]);

export const topic = pgTable("topic", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	version_id: uuid().notNull(),
	parent_topic_id: uuid(),
	title: text().notNull(),
	description: text().notNull(),
	sort_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_topic_parent").using("btree", table.parent_topic_id.asc().nullsLast()),
	foreignKey({
			columns: [table.version_id],
			foreignColumns: [topic_analysis_version.id],
			name: "topic_version_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.version_id, table.parent_topic_id],
			foreignColumns: [table.id, table.version_id],
			name: "topic_parent_same_version_fkey"
		}).onDelete("cascade"),
	unique("topic_version_id_id_key").on(table.id, table.version_id),
]);

export const bill_faction_votes = pgTable("bill_faction_votes", {
	bill_id: uuid().notNull(),
	faction_id: uuid().notNull(),
	vote: faction_vote_enum().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "bill_faction_votes_bill_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.faction_id],
			foreignColumns: [assembly_factions.id],
			name: "bill_faction_votes_faction_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.bill_id, table.faction_id], name: "bill_faction_votes_pkey"}),
]);

export const bills_tags = pgTable("bills_tags", {
	bill_id: uuid().notNull(),
	tag_id: uuid().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bill_id],
			foreignColumns: [bills.id],
			name: "bills_tags_bill_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tag_id],
			foreignColumns: [tags.id],
			name: "bills_tags_tag_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.bill_id, table.tag_id], name: "bills_tags_pkey"}),
]);

export const api_rate_limits = pgTable("api_rate_limits", {
	key: text().notNull(),
	window_start: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	request_count: integer().default(0).notNull(),
}, (table) => [
	index("idx_api_rate_limits_window_start").using("btree", table.window_start.asc().nullsLast()),
	primaryKey({ columns: [table.key, table.window_start], name: "api_rate_limits_pkey"}),
]);

export const topic_opinion = pgTable("topic_opinion", {
	topic_id: uuid().notNull(),
	opinion_id: uuid().notNull(),
	version_id: uuid().notNull(),
}, (table) => [
	index("idx_topic_opinion_topic").using("btree", table.topic_id.asc().nullsLast()),
	foreignKey({
			columns: [table.opinion_id],
			foreignColumns: [interview_opinion.id],
			name: "topic_opinion_opinion_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.version_id],
			foreignColumns: [topic_analysis_version.id],
			name: "topic_opinion_version_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.topic_id, table.version_id],
			foreignColumns: [topic.id, topic.version_id],
			name: "topic_opinion_topic_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.opinion_id, table.version_id], name: "topic_opinion_pkey"}),
]);

export const assembly_members = pgTable("assembly_members", {
	assembly_id: uuid().notNull(),
	user_id: uuid().notNull(),
	role: assembly_member_role_enum().notNull(),
	display_name: text().notNull(),
	affiliation: text().notNull(),
	invited_by: uuid(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_assembly_members_user_id").using("btree", table.user_id.asc().nullsLast()),
	foreignKey({
			columns: [table.assembly_id],
			foreignColumns: [assemblies.id],
			name: "assembly_members_assembly_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "assembly_members_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.invited_by],
			foreignColumns: [users.id],
			name: "assembly_members_invited_by_fkey"
		}).onDelete("set null"),
	primaryKey({ columns: [table.assembly_id, table.user_id], name: "assembly_members_pkey"}),
]);
