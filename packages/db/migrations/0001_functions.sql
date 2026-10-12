-- 本家の DB function を移したもの（Supabase Auth・国会会期に依存するものは除く）
--> statement-breakpoint
create extension if not exists pgcrypto;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.bulk_publish_reports(p_config_id uuid, p_max_moderation_score integer, p_min_content_richness integer) RETURNS bigint
    LANGUAGE sql
    AS $$
  with updated as (
    update interview_report r
    set is_public_by_admin = true
    from interview_sessions s
    where s.id = r.interview_session_id
      and s.interview_config_id = p_config_id
      and r.is_public_by_user = true
      and r.is_public_by_admin = false
      and r.moderation_score is not null
      and r.moderation_score <= p_max_moderation_score
      and r.total_content_richness is not null
      and r.total_content_richness >= p_min_content_richness
    returning r.id
  )
  select count(*) from updated;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.count_bulk_publish_targets(p_config_id uuid, p_max_moderation_score integer, p_min_content_richness integer) RETURNS bigint
    LANGUAGE sql STABLE
    AS $$
  select count(*)
  from interview_report r
  join interview_sessions s on s.id = r.interview_session_id
  where s.interview_config_id = p_config_id
    and r.is_public_by_user = true
    and r.is_public_by_admin = false
    and r.moderation_score is not null
    and r.moderation_score <= p_max_moderation_score
    and r.total_content_richness is not null
    and r.total_content_richness >= p_min_content_richness;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.count_public_reports_by_bill_ids(p_bill_ids uuid[]) RETURNS TABLE(bill_id uuid, report_count bigint)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select
    c.bill_id,
    count(*) as report_count
  from interview_report r
  join interview_sessions s on s.id = r.interview_session_id
  join interview_configs c on c.id = s.interview_config_id
  where c.bill_id = any(p_bill_ids)
    and r.is_public_by_admin
    and r.is_public_by_user
  group by c.bill_id;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.count_public_reports_by_stance(p_bill_id uuid) RETURNS TABLE(stance text, count bigint)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ir.stance::TEXT AS stance,
    COUNT(*) AS count
  FROM interview_report ir
  INNER JOIN interview_sessions s ON s.id = ir.interview_session_id
  INNER JOIN interview_configs c ON c.id = s.interview_config_id
  WHERE ir.is_public_by_admin = TRUE
    AND ir.is_public_by_user = TRUE
    AND c.bill_id = p_bill_id
  GROUP BY ir.stance;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.count_reactions_by_report_ids(report_ids uuid[]) RETURNS TABLE(interview_report_id uuid, reaction_type text, cnt bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    r.interview_report_id,
    r.reaction_type,
    count(*) as cnt
  from report_reactions r
  where r.interview_report_id = any(report_ids)
  group by r.interview_report_id, r.reaction_type;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.count_sessions_by_config_ids(p_config_ids uuid[]) RETURNS TABLE(interview_config_id uuid, session_count bigint)
    LANGUAGE sql STABLE
    AS $$
  select
    s.interview_config_id,
    count(s.id) as session_count
  from interview_sessions s
  where s.interview_config_id = any(p_config_ids)
  group by s.interview_config_id;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.extract_assistant_question_id(content text) RETURNS uuid
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  parsed JSONB;
  question_id_text TEXT;
BEGIN
  IF content IS NULL OR NOT pg_input_is_valid(content, 'jsonb') THEN
    RETURN NULL;
  END IF;

  parsed := content::jsonb;
  IF jsonb_typeof(parsed) <> 'object' THEN
    RETURN NULL;
  END IF;

  question_id_text := COALESCE(
    parsed ->> 'question_id',
    parsed ->> 'questionId'
  );
  IF question_id_text IS NULL
    OR NOT pg_input_is_valid(question_id_text, 'uuid') THEN
    RETURN NULL;
  END IF;

  RETURN question_id_text::uuid;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.find_open_data_interview_reports(p_min_public_reports integer, p_limit integer, p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cursor_id uuid DEFAULT NULL::uuid) RETURNS TABLE(report_id uuid, bill_id uuid, bill_name text, stance text, role text, role_title text, role_description text, summary text, opinions jsonb, interview_session_id uuid, created_at timestamp with time zone)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH eligible_bills AS (
    SELECT c.bill_id
    FROM interview_report r
    JOIN interview_sessions s ON s.id = r.interview_session_id
    JOIN interview_configs c ON c.id = s.interview_config_id
    JOIN bills b ON b.id = c.bill_id
    WHERE r.is_public_by_admin
      AND r.is_public_by_user
      AND b.publish_status = 'published'
      AND NOT b.is_dummy
    GROUP BY c.bill_id
    HAVING COUNT(*) >= p_min_public_reports
  )
  SELECT
    r.id AS report_id,
    c.bill_id,
    b.name AS bill_name,
    r.stance::TEXT,
    r.role::TEXT,
    r.role_title,
    r.role_description,
    r.summary,
    r.opinions,
    r.interview_session_id,
    r.created_at
  FROM interview_report r
  JOIN interview_sessions s ON s.id = r.interview_session_id
  JOIN interview_configs c ON c.id = s.interview_config_id
  JOIN bills b ON b.id = c.bill_id
  WHERE c.bill_id IN (SELECT eligible_bills.bill_id FROM eligible_bills)
    AND r.is_public_by_admin
    AND r.is_public_by_user
    AND r.is_data_reuse_consented
    AND (
      p_cursor_created_at IS NULL
      OR (r.created_at, r.id) < (p_cursor_created_at, p_cursor_id)
    )
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT p_limit;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.find_public_reports_by_bill_id_ordered_by_reactions(p_bill_id uuid, p_limit integer DEFAULT 1000, p_offset integer DEFAULT 0, p_stance text DEFAULT NULL::text, p_sort_order text DEFAULT 'recommended'::text) RETURNS TABLE(id uuid, stance public.stance_type_enum, role public.interview_report_role_enum, role_title text, summary text, total_content_richness integer, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ir.id,
    ir.stance,
    ir.role,
    ir.role_title,
    ir.summary,
    ir.total_content_richness,
    ir.created_at
  FROM interview_report ir
  INNER JOIN interview_sessions s ON s.id = ir.interview_session_id
  INNER JOIN interview_configs c ON c.id = s.interview_config_id
  LEFT JOIN (
    SELECT rr.interview_report_id, COUNT(*) AS helpful_count
    FROM report_reactions rr
    WHERE rr.reaction_type = 'helpful'
    GROUP BY rr.interview_report_id
  ) rc ON rc.interview_report_id = ir.id
  WHERE ir.is_public_by_admin = TRUE
    AND ir.is_public_by_user = TRUE
    AND c.bill_id = p_bill_id
    AND (p_stance IS NULL OR ir.stance::TEXT = p_stance)
  ORDER BY
    CASE WHEN p_sort_order = 'newest' THEN NULL
         ELSE (COALESCE(rc.helpful_count, 0) + COALESCE(ir.total_content_richness, 0))
    END DESC NULLS LAST,
    ir.created_at DESC,
    ir.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_helpful_count(p_config_id uuid, p_ascending boolean DEFAULT false, p_offset integer DEFAULT 0, p_limit integer DEFAULT 30, p_status text DEFAULT NULL::text, p_visibility text DEFAULT NULL::text, p_stance text DEFAULT NULL::text, p_role text DEFAULT NULL::text) RETURNS TABLE(session_id uuid)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  LEFT JOIN (
    SELECT rr.interview_report_id, COUNT(*)::BIGINT AS cnt
    FROM report_reactions rr
    WHERE rr.reaction_type = 'helpful'
    GROUP BY rr.interview_report_id
  ) hc ON hc.interview_report_id = r.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN COALESCE(hc.cnt, 0) END ASC,
    CASE WHEN NOT p_ascending THEN COALESCE(hc.cnt, 0) END DESC,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_message_count(p_config_id uuid, p_ascending boolean DEFAULT false, p_offset integer DEFAULT 0, p_limit integer DEFAULT 30, p_status text DEFAULT NULL::text, p_visibility text DEFAULT NULL::text, p_stance text DEFAULT NULL::text, p_role text DEFAULT NULL::text) RETURNS TABLE(session_id uuid)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN (
    SELECT im.interview_session_id, COUNT(*)::BIGINT AS cnt
    FROM interview_messages im
    INNER JOIN interview_sessions iss
      ON iss.id = im.interview_session_id
    WHERE iss.interview_config_id = p_config_id
    GROUP BY im.interview_session_id
  ) mc ON mc.interview_session_id = s.id
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN COALESCE(mc.cnt, 0) END ASC,
    CASE WHEN NOT p_ascending THEN COALESCE(mc.cnt, 0) END DESC,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_moderation_score(p_config_id uuid, p_ascending boolean DEFAULT false, p_offset integer DEFAULT 0, p_limit integer DEFAULT 30, p_status text DEFAULT NULL::text, p_visibility text DEFAULT NULL::text, p_stance text DEFAULT NULL::text, p_role text DEFAULT NULL::text) RETURNS TABLE(session_id uuid)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r
    ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN r.moderation_score END ASC NULLS LAST,
    CASE WHEN NOT p_ascending THEN r.moderation_score END DESC NULLS LAST,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_total_content_richness(p_config_id uuid, p_ascending boolean DEFAULT false, p_offset integer DEFAULT 0, p_limit integer DEFAULT 30, p_status text DEFAULT NULL::text, p_visibility text DEFAULT NULL::text, p_stance text DEFAULT NULL::text, p_role text DEFAULT NULL::text) RETURNS TABLE(session_id uuid)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r
    ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN r.total_content_richness END ASC NULLS LAST,
    CASE WHEN NOT p_ascending THEN r.total_content_richness END DESC NULLS LAST,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.get_chat_usage_metrics(p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_bill_id uuid DEFAULT NULL::uuid) RETURNS TABLE(prompt_name text, event_count bigint, unique_user_count bigint, unique_session_count bigint, total_tokens bigint, total_cost_usd numeric)
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(e.prompt_name, '(unknown)') as prompt_name,
    count(*) as event_count,
    count(distinct e.user_id) as unique_user_count,
    count(distinct e.session_id) as unique_session_count,
    coalesce(sum(e.total_tokens), 0)::bigint as total_tokens,
    coalesce(sum(e.cost_usd), 0) as total_cost_usd
  from public.chat_usage_events e
  where (p_from is null or e.occurred_at >= p_from)
    and (p_to is null or e.occurred_at < p_to)
    and (p_bill_id is null or e.metadata ->> 'billId' = p_bill_id::text)
  group by 1
  order by event_count desc;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.get_interview_message_counts(session_ids uuid[]) RETURNS TABLE(interview_session_id uuid, message_count bigint)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    im.interview_session_id,
    COUNT(*)::BIGINT AS message_count
  FROM interview_messages im
  WHERE im.interview_session_id = ANY(session_ids)
  GROUP BY im.interview_session_id;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.get_interview_metrics_by_bill(p_bill_id uuid DEFAULT NULL::uuid) RETURNS TABLE(bill_id uuid, bill_name text, conducted_count bigint, completed_count bigint, completion_rate numeric, total_duration_seconds numeric, total_duration_seconds_under_1h numeric)
    LANGUAGE sql STABLE
    AS $$
  select
    b.id as bill_id,
    b.name as bill_name,
    count(s.id) as conducted_count,
    count(s.completed_at) as completed_count,
    case
      when count(s.id) = 0 then 0
      else round(count(s.completed_at)::numeric / count(s.id)::numeric, 3)
    end as completion_rate,
    round(coalesce(sum(d.seconds), 0)::numeric, 0) as total_duration_seconds,
    round(
      coalesce(sum(d.seconds) filter (where d.seconds < 3600), 0)::numeric,
      0
    ) as total_duration_seconds_under_1h
  from bills b
  join interview_configs c
    on c.bill_id = b.id
   and c.deleted_at is null
  left join interview_sessions s
    on s.interview_config_id = c.id
  left join (
    select im.interview_session_id, max(im.created_at) as last_message_at
    from interview_messages im
    group by im.interview_session_id
  ) lm
    on lm.interview_session_id = s.id
  left join lateral (
    select extract(
      epoch from (coalesce(s.completed_at, lm.last_message_at) - s.started_at)
    ) as seconds
  ) d on true
  where p_bill_id is null or b.id = p_bill_id
  group by b.id, b.name
  order by count(s.id) desc, b.name;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.get_interview_statistics(p_config_id uuid) RETURNS TABLE(total_sessions bigint, completed_sessions bigint, avg_rating numeric, stance_for_count bigint, stance_against_count bigint, stance_neutral_count bigint, avg_total_content_richness numeric, role_subject_expert_count bigint, role_work_related_count bigint, role_daily_life_affected_count bigint, role_general_citizen_count bigint, avg_message_count numeric, median_duration_seconds numeric, total_duration_seconds numeric, total_duration_seconds_under_1h numeric, public_by_user_count bigint, feedback_irrelevant_questions bigint, feedback_not_aligned bigint, feedback_misunderstood bigint, feedback_too_many_questions bigint, feedback_other bigint, total_cost_usd numeric, avg_cost_usd numeric)
    LANGUAGE plpgsql STABLE
    AS $$
begin
  return query
  select
    count(s.id) as total_sessions,
    count(s.completed_at) as completed_sessions,
    round(avg(s.rating)::numeric, 2) as avg_rating,
    count(case when r.stance = 'for' then 1 end) as stance_for_count,
    count(case when r.stance = 'against' then 1 end) as stance_against_count,
    count(case when r.stance = 'neutral' then 1 end) as stance_neutral_count,
    round(avg(r.total_content_richness)::numeric, 1) as avg_total_content_richness,
    count(case when r.role = 'subject_expert' then 1 end) as role_subject_expert_count,
    count(case when r.role = 'work_related' then 1 end) as role_work_related_count,
    count(case when r.role = 'daily_life_affected' then 1 end) as role_daily_life_affected_count,
    count(case when r.role = 'general_citizen' then 1 end) as role_general_citizen_count,
    round(avg(coalesce(mc.message_count, 0))::numeric, 1) as avg_message_count,
    round(
      (select percentile_cont(0.5) within group (
        order by extract(epoch from (sub.completed_at - sub.started_at))
      )
      from interview_sessions sub
      where sub.interview_config_id = p_config_id
        and sub.completed_at is not null
      )::numeric, 0
    ) as median_duration_seconds,
    -- 総所要時間: 完了セッションは completed_at、途中離脱は最終メッセージ時刻を終了時刻として集計
    -- メッセージが無い未完了セッションは duration を算出できないため除外
    coalesce(max(dur.total_seconds), 0)::numeric as total_duration_seconds,
    -- 1時間以上のセッションを除外した総所要時間
    coalesce(max(dur.total_seconds_under_1h), 0)::numeric as total_duration_seconds_under_1h,
    count(case when r.is_public_by_user = true then 1 end) as public_by_user_count,
    -- フィードバックタグ集計
    coalesce(max(fc.feedback_irrelevant_questions), 0) as feedback_irrelevant_questions,
    coalesce(max(fc.feedback_not_aligned), 0) as feedback_not_aligned,
    coalesce(max(fc.feedback_misunderstood), 0) as feedback_misunderstood,
    coalesce(max(fc.feedback_too_many_questions), 0) as feedback_too_many_questions,
    coalesce(max(fc.feedback_other), 0) as feedback_other,
    -- コスト集計
    coalesce(max(cc.total_cost), 0)::numeric as total_cost_usd,
    case
      when count(s.id) > 0 then round(coalesce(max(cc.total_cost), 0)::numeric / count(s.id), 6)
      else 0::numeric
    end as avg_cost_usd
  from interview_sessions s
  left join interview_report r on r.interview_session_id = s.id
  left join (
    select im.interview_session_id, count(*) as message_count
    from interview_messages im
    group by im.interview_session_id
  ) mc on mc.interview_session_id = s.id
  left join (
    select
      sum(d.seconds) as total_seconds,
      sum(d.seconds) filter (where d.seconds < 3600) as total_seconds_under_1h
    from (
      select extract(epoch from (
        coalesce(sub.completed_at, lm.last_message_at) - sub.started_at
      )) as seconds
      from interview_sessions sub
      left join (
        select im.interview_session_id, max(im.created_at) as last_message_at
        from interview_messages im
        group by im.interview_session_id
      ) lm on lm.interview_session_id = sub.id
      where sub.interview_config_id = p_config_id
        and coalesce(sub.completed_at, lm.last_message_at) is not null
    ) d
  ) dur on true
  left join (
    select
      count(*) filter (where f.tag = 'irrelevant_questions') as feedback_irrelevant_questions,
      count(*) filter (where f.tag = 'not_aligned') as feedback_not_aligned,
      count(*) filter (where f.tag = 'misunderstood') as feedback_misunderstood,
      count(*) filter (where f.tag = 'too_many_questions') as feedback_too_many_questions,
      count(*) filter (where f.tag = 'other') as feedback_other
    from interview_rating_feedbacks f
    join interview_sessions fs on fs.id = f.interview_session_id
    where fs.interview_config_id = p_config_id
  ) fc on true
  left join (
    select sum(c.cost_usd) as total_cost
    from chat_usage_events c
    join interview_sessions cs on cs.id::text = c.session_id
    where cs.interview_config_id = p_config_id
  ) cc on true
  where s.interview_config_id = p_config_id;
end;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.get_question_answer_counts(p_config_id uuid) RETURNS TABLE(question_id uuid, question text, question_order integer, asked_session_count bigint, answered_session_count bigint)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  WITH asked AS (
    SELECT t.session_id, t.created_at, t.qid
    FROM (
      SELECT
        m.interview_session_id AS session_id,
        m.created_at,
        extract_assistant_question_id(m.content) AS qid
      FROM interview_messages m
      JOIN interview_sessions s ON s.id = m.interview_session_id
      WHERE s.interview_config_id = p_config_id
        AND m.role = 'assistant'
    ) t
    WHERE t.qid IS NOT NULL
  ),
  last_user_message AS (
    SELECT
      m.interview_session_id AS session_id,
      MAX(m.created_at) AS last_user_at
    FROM interview_messages m
    JOIN interview_sessions s ON s.id = m.interview_session_id
    WHERE s.interview_config_id = p_config_id
      AND m.role = 'user'
    GROUP BY m.interview_session_id
  )
  SELECT
    q.id AS question_id,
    q.question,
    q.question_order,
    COUNT(DISTINCT a.session_id) AS asked_session_count,
    COUNT(DISTINCT a.session_id) FILTER (WHERE lu.last_user_at > a.created_at)
      AS answered_session_count
  FROM interview_questions q
  LEFT JOIN asked a ON a.qid = q.id
  LEFT JOIN last_user_message lu ON lu.session_id = a.session_id
  WHERE q.interview_config_id = p_config_id
  GROUP BY q.id, q.question, q.question_order
  ORDER BY q.question_order;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.increment_api_rate_limit(p_key text, p_window_start timestamp with time zone, p_limit integer) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO api_rate_limits (key, window_start, request_count)
  VALUES (p_key, p_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  -- 過去ウィンドウを掃除（テーブル肥大を防ぐ）。
  -- 新しいウィンドウ行を作った最初の呼び出しのみ実行し、同一ウィンドウ内の
  -- 残り N-1 回の呼び出しで無駄な索引スキャンを繰り返さない
  IF v_count = 1 THEN
    -- 同一キーの過去ウィンドウ
    DELETE FROM api_rate_limits
    WHERE key = p_key AND window_start < p_window_start;
    -- 二度と現れないキー（IPローテーション等）の行が永久に残らないよう、
    -- 全キー横断で1時間より古いウィンドウも併せて掃除する
    DELETE FROM api_rate_limits
    WHERE window_start < p_window_start - INTERVAL '1 hour';
  END IF;

  RETURN v_count <= p_limit;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.mark_opinions_extracted(p_ids uuid[], p_extracted_at timestamp with time zone) RETURNS void
    LANGUAGE sql
    AS $$
  UPDATE interview_opinion
  SET topic_extracted_at = p_extracted_at
  WHERE id = ANY(p_ids);
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.publish_topic_analysis_version(p_version_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_bill_id UUID;
BEGIN
  SELECT bill_id INTO v_bill_id
  FROM topic_analysis_version
  WHERE id = p_version_id;

  IF v_bill_id IS NULL THEN
    RAISE EXCEPTION 'topic_analysis_version % not found', p_version_id;
  END IF;

  -- 先に同 bill の現公開版を降ろす（同一トランザクション内なので部分ユニーク制約に衝突しない）
  UPDATE topic_analysis_version
  SET is_published = false
  WHERE bill_id = v_bill_id
    AND is_published = true
    AND id <> p_version_id;

  -- 対象を公開
  UPDATE topic_analysis_version
  SET is_published = true
  WHERE id = p_version_id;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.sum_chat_usage_cost(from_iso timestamp with time zone, to_iso timestamp with time zone) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  select coalesce(sum(cost_usd), 0)
  from public.chat_usage_events
  where occurred_at >= from_iso
    and occurred_at < to_iso;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.unpublish_reports_by_config_id(p_config_id uuid) RETURNS void
    LANGUAGE sql
    AS $$
  update interview_report r
  set is_public_by_admin = false,
      admin_unpublished_at = now()
  from interview_sessions s
  where r.interview_session_id = s.id
    and s.interview_config_id = p_config_id
    and (r.is_public_by_admin = true or r.admin_unpublished_at is null);
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
--> statement-breakpoint
-- 議会ごとに「開会中」の会期を1つにする（本家の set_active_diet_session の置き換え）
CREATE OR REPLACE FUNCTION public.set_active_session(target_assembly_id uuid, target_session_id uuid) RETURNS void
    LANGUAGE sql
    AS $$
  UPDATE sessions
  SET is_active = (id = target_session_id)
  WHERE assembly_id = target_assembly_id;
$$;
--> statement-breakpoint
CREATE TRIGGER update_assemblies_updated_at BEFORE UPDATE ON public.assemblies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_assembly_settings_updated_at BEFORE UPDATE ON public.assembly_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_bill_contents_updated_at BEFORE UPDATE ON public.bill_contents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_bill_results_updated_at BEFORE UPDATE ON public.bill_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_mirai_stances_updated_at BEFORE UPDATE ON public.mirai_stances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_expert_registrations_updated_at BEFORE UPDATE ON public.expert_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_interview_configs_updated_at BEFORE UPDATE ON public.interview_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_interview_questions_updated_at BEFORE UPDATE ON public.interview_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_interview_report_updated_at BEFORE UPDATE ON public.interview_report FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_topic_analysis_versions_updated_at BEFORE UPDATE ON public.topic_analysis_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER update_assembly_sources_updated_at BEFORE UPDATE ON public.assembly_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
