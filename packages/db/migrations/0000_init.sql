CREATE TYPE "public"."assembly_member_role_enum" AS ENUM('reviewer', 'editor');--> statement-breakpoint
CREATE TYPE "public"."assembly_status_enum" AS ENUM('master_only', 'preparing', 'public');--> statement-breakpoint
CREATE TYPE "public"."assembly_type_enum" AS ENUM('prefecture', 'city', 'special_ward', 'town', 'village');--> statement-breakpoint
CREATE TYPE "public"."bill_category_enum" AS ENUM('budget', 'ordinance', 'personnel', 'contract', 'petition', 'report', 'other');--> statement-breakpoint
CREATE TYPE "public"."bill_priority_enum" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."bill_publish_level_enum" AS ENUM('title_only', 'explained');--> statement-breakpoint
CREATE TYPE "public"."bill_publish_status" AS ENUM('draft', 'published', 'coming_soon');--> statement-breakpoint
CREATE TYPE "public"."bill_result_enum" AS ENUM('passed', 'amended', 'rejected', 'continued', 'withdrawn', 'adopted', 'not_adopted');--> statement-breakpoint
CREATE TYPE "public"."bill_status_enum" AS ENUM('preparing', 'introduced', 'referred_to_committee', 'decided', 'continued', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."chat_role_enum" AS ENUM('user', 'system', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."check_interval_enum" AS ENUM('session_daily', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."csv_import_kind_enum" AS ENUM('assemblies', 'factions', 'sessions', 'bills', 'results');--> statement-breakpoint
CREATE TYPE "public"."csv_import_status_enum" AS ENUM('validated', 'committed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level_enum" AS ENUM('normal', 'hard');--> statement-breakpoint
CREATE TYPE "public"."faction_vote_enum" AS ENUM('for', 'against', 'abstain', 'absent', 'split');--> statement-breakpoint
CREATE TYPE "public"."fetch_method_enum" AS ENUM('link_diff', 'vendor');--> statement-breakpoint
CREATE TYPE "public"."import_job_status_enum" AS ENUM('splitting', 'waiting_selection', 'drafting', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_source_enum" AS ENUM('url', 'upload');--> statement-breakpoint
CREATE TYPE "public"."interview_config_status_enum" AS ENUM('public', 'closed');--> statement-breakpoint
CREATE TYPE "public"."interview_feedback_tag_enum" AS ENUM('irrelevant_questions', 'not_aligned', 'misunderstood', 'too_many_questions', 'other');--> statement-breakpoint
CREATE TYPE "public"."interview_mode_enum" AS ENUM('loop', 'bulk', 'targeted');--> statement-breakpoint
CREATE TYPE "public"."interview_report_role_enum" AS ENUM('subject_expert', 'work_related', 'daily_life_affected', 'general_citizen');--> statement-breakpoint
CREATE TYPE "public"."interview_role_enum" AS ENUM('assistant', 'user');--> statement-breakpoint
CREATE TYPE "public"."moderation_status_enum" AS ENUM('ok', 'warning', 'ng');--> statement-breakpoint
CREATE TYPE "public"."objection_status_enum" AS ENUM('open', 'fixed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."session_type_enum" AS ENUM('regular', 'extraordinary');--> statement-breakpoint
CREATE TYPE "public"."source_document_status_enum" AS ENUM('detected', 'imported', 'ignored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_kind_enum" AS ENUM('bills', 'results', 'references', 'reiki', 'schedule', 'minutes_flash', 'minutes');--> statement-breakpoint
CREATE TYPE "public"."source_vendor_enum" AS ENUM('discuss', 'dbsr', 'voices', 'kensakusystem');--> statement-breakpoint
CREATE TYPE "public"."stance_type_enum" AS ENUM('for', 'against', 'neutral', 'conditional_for', 'conditional_against', 'considering', 'continued_deliberation', 'free_vote');--> statement-breakpoint
CREATE TYPE "public"."topic_analysis_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."vote_granularity_enum" AS ENUM('member', 'faction', 'count', 'result_only', 'unpublished');--> statement-breakpoint
CREATE TABLE "anonymous_visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "api_rate_limits_pkey" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "assemblies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" "assembly_type_enum" NOT NULL,
	"local_gov_code" text NOT NULL,
	"prefecture_code" text NOT NULL,
	"status" "assembly_status_enum" DEFAULT 'master_only' NOT NULL,
	"official_url" text,
	"has_mirai_member" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assemblies_slug_key" UNIQUE("slug"),
	CONSTRAINT "assemblies_local_gov_code_key" UNIQUE("local_gov_code")
);
--> statement-breakpoint
CREATE TABLE "assembly_factions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assembly_id" uuid NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"seats" smallint,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"is_dummy" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assembly_factions_name_unique" UNIQUE("assembly_id","name","valid_from")
);
--> statement-breakpoint
CREATE TABLE "assembly_members" (
	"assembly_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "assembly_member_role_enum" NOT NULL,
	"display_name" text NOT NULL,
	"affiliation" text NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assembly_members_pkey" PRIMARY KEY("assembly_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "assembly_settings" (
	"assembly_id" uuid PRIMARY KEY NOT NULL,
	"show_ai_chat" boolean DEFAULT true NOT NULL,
	"show_interview" boolean DEFAULT false NOT NULL,
	"show_mirai_stance" boolean DEFAULT false NOT NULL,
	"vote_granularity" "vote_granularity_enum" DEFAULT 'result_only' NOT NULL,
	"default_publish_level" "bill_publish_level_enum" DEFAULT 'title_only' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assembly_source_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"url" text NOT NULL,
	"logical_key" text,
	"content_hash" text,
	"ai_judgement" jsonb,
	"status" "source_document_status_enum" NOT NULL,
	"import_job_id" uuid,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assembly_source_documents_unique" UNIQUE("source_id","url")
);
--> statement-breakpoint
CREATE TABLE "assembly_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assembly_id" uuid NOT NULL,
	"kind" "source_kind_enum" NOT NULL,
	"fetch_method" "fetch_method_enum" DEFAULT 'link_diff' NOT NULL,
	"vendor" "source_vendor_enum",
	"vendor_tenant" text,
	"list_url" text NOT NULL,
	"follow_depth" smallint DEFAULT 1 NOT NULL,
	"check_interval" "check_interval_enum" DEFAULT 'session_daily' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"last_error" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assembly_sources_unique" UNIQUE("assembly_id","kind","list_url")
);
--> statement-breakpoint
CREATE TABLE "assembly_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assembly_id" uuid NOT NULL,
	"surveyed_at" date NOT NULL,
	"tier" smallint NOT NULL,
	"vote_granularity" "vote_granularity_enum",
	"archive_strength" text,
	"findings" jsonb NOT NULL,
	"report_markdown" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assembly_surveys_tier_check" CHECK ((tier >= 0) AND (tier <= 2))
);
--> statement-breakpoint
CREATE TABLE "bill_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"difficulty_level" "difficulty_level_enum" NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"furigana" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bill_contents_bill_id_difficulty_level_key" UNIQUE("bill_id","difficulty_level")
);
--> statement-breakpoint
CREATE TABLE "bill_faction_votes" (
	"bill_id" uuid NOT NULL,
	"faction_id" uuid NOT NULL,
	"vote" "faction_vote_enum" NOT NULL,
	CONSTRAINT "bill_faction_votes_pkey" PRIMARY KEY("bill_id","faction_id")
);
--> statement-breakpoint
CREATE TABLE "bill_import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assembly_id" uuid NOT NULL,
	"session_id" uuid,
	"source" "import_source_enum" NOT NULL,
	"source_document_id" uuid,
	"source_file_path" text NOT NULL,
	"source_url" text,
	"status" "import_job_status_enum" NOT NULL,
	"detected_bills" jsonb,
	"error" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_objections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" "objection_status_enum" DEFAULT 'open' NOT NULL,
	"response" text,
	"responded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bill_results" (
	"bill_id" uuid PRIMARY KEY NOT NULL,
	"result" "bill_result_enum" NOT NULL,
	"decided_on" date,
	"yes_count" smallint,
	"no_count" smallint,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assembly_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"bill_number" text NOT NULL,
	"name" text NOT NULL,
	"name_furigana" jsonb,
	"official_name" text NOT NULL,
	"category" "bill_category_enum" NOT NULL,
	"committee_name" text,
	"submitter" text,
	"submitted_date" date,
	"status" "bill_status_enum" DEFAULT 'introduced' NOT NULL,
	"status_note" text,
	"source_url" text,
	"source_file_path" text,
	"source_pages" text,
	"publish_level" "bill_publish_level_enum" DEFAULT 'title_only' NOT NULL,
	"review_priority" "bill_priority_enum",
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"is_dummy" boolean DEFAULT false NOT NULL,
	"slug" text,
	"publish_status" "bill_publish_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_review_completed" boolean DEFAULT false NOT NULL,
	"knowledge_source" text,
	"use_knowledge_source_in_chat" boolean DEFAULT false NOT NULL,
	"thumbnail_url" text,
	"share_thumbnail_url" text,
	"status_order" integer GENERATED ALWAYS AS (
CASE status
    WHEN 'decided'::bill_status_enum THEN 0
    WHEN 'continued'::bill_status_enum THEN 1
    WHEN 'withdrawn'::bill_status_enum THEN 2
    WHEN 'referred_to_committee'::bill_status_enum THEN 3
    WHEN 'introduced'::bill_status_enum THEN 4
    WHEN 'preparing'::bill_status_enum THEN 5
    ELSE NULL::integer
END) STORED,
	"publish_status_order" integer GENERATED ALWAYS AS (
CASE publish_status
    WHEN 'draft'::bill_publish_status THEN 0
    WHEN 'coming_soon'::bill_publish_status THEN 1
    WHEN 'published'::bill_publish_status THEN 2
    ELSE NULL::integer
END) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bills_assembly_slug" UNIQUE("assembly_id","slug"),
	CONSTRAINT "bills_session_bill_number" UNIQUE("session_id","bill_number")
);
--> statement-breakpoint
CREATE TABLE "bills_tags" (
	"bill_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bills_tags_pkey" PRIMARY KEY("bill_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "chat_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text,
	"prompt_name" text,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"user_id" uuid,
	"role" "chat_role_enum" NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "csv_import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assembly_id" uuid,
	"kind" "csv_import_kind_enum" NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"encoding" text NOT NULL,
	"status" "csv_import_status_enum" NOT NULL,
	"row_count" integer NOT NULL,
	"insert_count" integer DEFAULT 0 NOT NULL,
	"update_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expert_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"affiliation" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expert_registrations_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "expert_registrations_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "interview_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"status" "interview_config_status_enum" DEFAULT 'closed' NOT NULL,
	"name" text NOT NULL,
	"mode" "interview_mode_enum" DEFAULT 'loop' NOT NULL,
	"themes" text[],
	"chat_model" text,
	"estimated_duration" integer,
	"prompt_overrides" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_session_id" uuid NOT NULL,
	"role" "interview_role_enum" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_opinion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_report_id" uuid NOT NULL,
	"opinion_index" smallint NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_message_id" uuid,
	"contextual_quote" text,
	"bill_sentiment" text,
	"richness" integer,
	"concern" text,
	"proposal" text,
	"reasoning_types" text[] DEFAULT '{""}' NOT NULL,
	"topic_extracted_at" timestamp with time zone,
	"tags_extracted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_opinion_report_index_key" UNIQUE("interview_report_id","opinion_index")
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_config_id" uuid NOT NULL,
	"question" text NOT NULL,
	"follow_up_guide" text,
	"quick_replies" text[],
	"question_order" integer NOT NULL,
	"target_audience" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_rating_feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_session_id" uuid NOT NULL,
	"tag" "interview_feedback_tag_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_rating_feedbacks_session_tag_key" UNIQUE("interview_session_id","tag")
);
--> statement-breakpoint
CREATE TABLE "interview_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_session_id" uuid NOT NULL,
	"summary" text,
	"stance" "stance_type_enum",
	"role" "interview_report_role_enum",
	"role_title" text,
	"role_description" text,
	"opinions" jsonb,
	"content_richness" jsonb,
	"total_content_richness" integer GENERATED ALWAYS AS (
CASE
    WHEN ((content_richness IS NOT NULL) AND ((content_richness ->> 'total'::text) IS NOT NULL) AND ((content_richness ->> 'total'::text) ~ '^d+$'::text)) THEN ((content_richness ->> 'total'::text))::integer
    ELSE NULL::integer
END) STORED,
	"moderation_score" integer,
	"moderation_status" "moderation_status_enum" GENERATED ALWAYS AS (
CASE
    WHEN (moderation_score IS NULL) THEN NULL::moderation_status_enum
    WHEN (moderation_score >= 70) THEN 'ng'::moderation_status_enum
    WHEN (moderation_score >= 30) THEN 'warning'::moderation_status_enum
    ELSE 'ok'::moderation_status_enum
END) STORED,
	"moderation_reasoning" text,
	"is_public_by_admin" boolean DEFAULT false NOT NULL,
	"is_public_by_user" boolean DEFAULT false NOT NULL,
	"is_data_reuse_consented" boolean DEFAULT false NOT NULL,
	"admin_unpublished_at" timestamp with time zone,
	"opinions_reextracted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_report_interview_session_id_key" UNIQUE("interview_session_id"),
	CONSTRAINT "interview_report_moderation_score_check" CHECK ((moderation_score IS NULL) OR ((moderation_score >= 0) AND (moderation_score <= 100)))
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_config_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"langfuse_session_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"rating" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_sessions_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"ip" text NOT NULL,
	"succeeded" boolean NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mirai_stances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"type" "stance_type_enum" NOT NULL,
	"comment" text,
	"publish_at" timestamp with time zone,
	"reason_summary" text,
	"reason_points" text[] DEFAULT '{""}' NOT NULL,
	"supplements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mirai_stances_bill_id_key" UNIQUE("bill_id")
);
--> statement-breakpoint
CREATE TABLE "preview_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preview_tokens_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "report_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_report_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_reactions_report_user_key" UNIQUE("interview_report_id","user_id"),
	CONSTRAINT "report_reactions_reaction_type_check" CHECK (reaction_type = ANY (ARRAY['helpful'::text, 'hmm'::text]))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assembly_id" uuid NOT NULL,
	"session_key" text NOT NULL,
	"name" text NOT NULL,
	"type" "session_type_enum" DEFAULT 'regular' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"source_url" text,
	"slug" text,
	"is_dummy" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_assembly_session_key" UNIQUE("assembly_id","session_key"),
	CONSTRAINT "sessions_assembly_slug" UNIQUE("assembly_id","slug"),
	CONSTRAINT "end_date_after_start_date" CHECK (end_date >= start_date)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"featured_priority" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_label_key" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "topic" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"parent_topic_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topic_version_id_id_key" UNIQUE("id","version_id")
);
--> statement-breakpoint
CREATE TABLE "topic_analysis_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"interview_report_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"opinion_index" integer NOT NULL,
	CONSTRAINT "topic_analysis_classifications_key" UNIQUE("version_id","interview_report_id","topic_id","opinion_index")
);
--> statement-breakpoint
CREATE TABLE "topic_analysis_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description_md" text NOT NULL,
	"representative_opinions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_analysis_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "topic_analysis_status" DEFAULT 'pending' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"current_step" text,
	"progress" jsonb,
	"trigger" text NOT NULL,
	"model" text,
	"prompt_version" text,
	"source_opinion_count" integer,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topic_analysis_version_bill_id_version_key" UNIQUE("bill_id","version")
);
--> statement-breakpoint
CREATE TABLE "topic_analysis_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"summary_md" text,
	"intermediate_results" jsonb,
	"phase_data" jsonb,
	"current_step" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topic_analysis_versions_bill_id_version_key" UNIQUE("bill_id","version"),
	CONSTRAINT "topic_analysis_versions_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))
);
--> statement-breakpoint
CREATE TABLE "topic_opinion" (
	"topic_id" uuid NOT NULL,
	"opinion_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	CONSTRAINT "topic_opinion_pkey" PRIMARY KEY("opinion_id","version_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_hash_key" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_check" CHECK (email ~ '^[^@s]+@[^@s]+$'::text)
);
--> statement-breakpoint
ALTER TABLE "assembly_factions" ADD CONSTRAINT "assembly_factions_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_members" ADD CONSTRAINT "assembly_members_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_members" ADD CONSTRAINT "assembly_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_members" ADD CONSTRAINT "assembly_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_settings" ADD CONSTRAINT "assembly_settings_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_settings" ADD CONSTRAINT "assembly_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_source_documents" ADD CONSTRAINT "assembly_source_documents_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."assembly_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_source_documents" ADD CONSTRAINT "assembly_source_documents_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "public"."bill_import_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_sources" ADD CONSTRAINT "assembly_sources_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_sources" ADD CONSTRAINT "assembly_sources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_surveys" ADD CONSTRAINT "assembly_surveys_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembly_surveys" ADD CONSTRAINT "assembly_surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_contents" ADD CONSTRAINT "bill_contents_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_faction_votes" ADD CONSTRAINT "bill_faction_votes_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_faction_votes" ADD CONSTRAINT "bill_faction_votes_faction_id_fkey" FOREIGN KEY ("faction_id") REFERENCES "public"."assembly_factions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_import_jobs" ADD CONSTRAINT "bill_import_jobs_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_import_jobs" ADD CONSTRAINT "bill_import_jobs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_import_jobs" ADD CONSTRAINT "bill_import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_objections" ADD CONSTRAINT "bill_objections_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_objections" ADD CONSTRAINT "bill_objections_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_results" ADD CONSTRAINT "bill_results_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills_tags" ADD CONSTRAINT "bills_tags_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills_tags" ADD CONSTRAINT "bills_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_jobs" ADD CONSTRAINT "csv_import_jobs_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_jobs" ADD CONSTRAINT "csv_import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_registrations" ADD CONSTRAINT "expert_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."anonymous_visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_configs" ADD CONSTRAINT "interview_configs_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_messages" ADD CONSTRAINT "interview_messages_interview_session_id_fkey" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_opinion" ADD CONSTRAINT "interview_opinion_interview_report_id_fkey" FOREIGN KEY ("interview_report_id") REFERENCES "public"."interview_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interview_config_id_fkey" FOREIGN KEY ("interview_config_id") REFERENCES "public"."interview_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_rating_feedbacks" ADD CONSTRAINT "interview_rating_feedbacks_interview_session_id_fkey" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_report" ADD CONSTRAINT "interview_report_interview_session_id_fkey" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_interview_config_id_fkey" FOREIGN KEY ("interview_config_id") REFERENCES "public"."interview_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."anonymous_visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mirai_stances" ADD CONSTRAINT "mirai_stances_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_tokens" ADD CONSTRAINT "preview_tokens_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_reactions" ADD CONSTRAINT "report_reactions_interview_report_id_fkey" FOREIGN KEY ("interview_report_id") REFERENCES "public"."interview_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_reactions" ADD CONSTRAINT "report_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."anonymous_visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic" ADD CONSTRAINT "topic_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."topic_analysis_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic" ADD CONSTRAINT "topic_parent_same_version_fkey" FOREIGN KEY ("version_id","parent_topic_id") REFERENCES "public"."topic"("id","version_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_analysis_classifications" ADD CONSTRAINT "topic_analysis_classifications_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."topic_analysis_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_analysis_classifications" ADD CONSTRAINT "topic_analysis_classifications_interview_report_id_fkey" FOREIGN KEY ("interview_report_id") REFERENCES "public"."interview_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_analysis_classifications" ADD CONSTRAINT "topic_analysis_classifications_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topic_analysis_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_analysis_topics" ADD CONSTRAINT "topic_analysis_topics_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."topic_analysis_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_analysis_version" ADD CONSTRAINT "topic_analysis_version_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_analysis_versions" ADD CONSTRAINT "topic_analysis_versions_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_opinion" ADD CONSTRAINT "topic_opinion_opinion_id_fkey" FOREIGN KEY ("opinion_id") REFERENCES "public"."interview_opinion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_opinion" ADD CONSTRAINT "topic_opinion_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."topic_analysis_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_opinion" ADD CONSTRAINT "topic_opinion_topic_fk" FOREIGN KEY ("topic_id","version_id") REFERENCES "public"."topic"("id","version_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_rate_limits_window_start" ON "api_rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "idx_assemblies_prefecture_code" ON "assemblies" USING btree ("prefecture_code");--> statement-breakpoint
CREATE INDEX "idx_assembly_members_user_id" ON "assembly_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_assembly_source_documents_logical_key" ON "assembly_source_documents" USING btree ("source_id","logical_key");--> statement-breakpoint
CREATE INDEX "idx_bill_contents_bill_id" ON "bill_contents" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "idx_bill_objections_bill_id" ON "bill_objections" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "idx_bills_assembly_id" ON "bills" USING btree ("assembly_id");--> statement-breakpoint
CREATE INDEX "idx_bills_is_dummy" ON "bills" USING btree ("is_dummy") WHERE (is_dummy = true);--> statement-breakpoint
CREATE INDEX "idx_bills_is_featured" ON "bills" USING btree ("is_featured") WHERE (is_featured = true);--> statement-breakpoint
CREATE INDEX "idx_bills_publish_status" ON "bills" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX "idx_bills_publish_status_created_at_id" ON "bills" USING btree ("publish_status","created_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_bills_publish_status_order" ON "bills" USING btree ("publish_status_order");--> statement-breakpoint
CREATE INDEX "idx_bills_published_at" ON "bills" USING btree ("published_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_bills_session_id" ON "bills" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_bills_status" ON "bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bills_status_order" ON "bills" USING btree ("status_order");--> statement-breakpoint
CREATE INDEX "idx_bills_submitted_date" ON "bills" USING btree ("submitted_date" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "chat_usage_events_session_id_idx" ON "chat_usage_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_usage_events_user_id_occurred_at_idx" ON "chat_usage_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_chats_bill_user" ON "chats" USING btree ("bill_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_chats_created_at" ON "chats" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_chats_user_id" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_csv_import_jobs_assembly" ON "csv_import_jobs" USING btree ("assembly_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_interview_configs_bill_id" ON "interview_configs" USING btree ("bill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_interview_configs_bill_public" ON "interview_configs" USING btree ("bill_id") WHERE (status = 'public'::interview_config_status_enum);--> statement-breakpoint
CREATE INDEX "idx_interview_messages_session_created" ON "interview_messages" USING btree ("interview_session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_interview_questions_config_order" ON "interview_questions" USING btree ("interview_config_id","question_order");--> statement-breakpoint
CREATE INDEX "idx_interview_report_is_public_by_admin" ON "interview_report" USING btree ("is_public_by_admin");--> statement-breakpoint
CREATE INDEX "idx_interview_report_total_content_richness" ON "interview_report" USING btree ("total_content_richness" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_interview_sessions_config_user" ON "interview_sessions" USING btree ("interview_config_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_interview_sessions_started_at" ON "interview_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_interview_sessions_user_id" ON "interview_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_attempts_email_idx" ON "login_attempts" USING btree (lower(email),attempted_at);--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts" USING btree ("ip","attempted_at");--> statement-breakpoint
CREATE INDEX "idx_preview_tokens_bill_id" ON "preview_tokens" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "idx_preview_tokens_expires_at" ON "preview_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_report_reactions_user_id" ON "report_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_date_range" ON "sessions" USING btree ("assembly_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_tags_featured_priority" ON "tags" USING btree ("featured_priority") WHERE (featured_priority IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_topic_parent" ON "topic" USING btree ("parent_topic_id");--> statement-breakpoint
CREATE INDEX "idx_topic_analysis_topics_version_id" ON "topic_analysis_topics" USING btree ("version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_version_per_bill" ON "topic_analysis_version" USING btree ("bill_id") WHERE (status = ANY (ARRAY['pending'::topic_analysis_status, 'running'::topic_analysis_status]));--> statement-breakpoint
CREATE UNIQUE INDEX "one_published_per_bill" ON "topic_analysis_version" USING btree ("bill_id") WHERE is_published;--> statement-breakpoint
CREATE INDEX "idx_topic_opinion_topic" ON "topic_opinion" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree (lower(email));