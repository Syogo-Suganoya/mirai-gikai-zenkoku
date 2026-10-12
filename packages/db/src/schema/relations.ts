import { relations } from "drizzle-orm/relations";
import {
  anonymous_visitors,
  assemblies,
  assembly_factions,
  assembly_members,
  assembly_settings,
  assembly_source_documents,
  assembly_sources,
  assembly_surveys,
  bill_contents,
  bill_faction_votes,
  bill_import_jobs,
  bill_objections,
  bill_results,
  bills,
  bills_tags,
  chats,
  csv_import_jobs,
  expert_registrations,
  interview_configs,
  interview_messages,
  interview_opinion,
  interview_questions,
  interview_rating_feedbacks,
  interview_report,
  interview_sessions,
  mirai_stances,
  preview_tokens,
  report_reactions,
  sessions,
  tags,
  topic,
  topic_analysis_classifications,
  topic_analysis_topics,
  topic_analysis_version,
  topic_analysis_versions,
  topic_opinion,
  user_sessions,
  users,
} from "./tables";

// リレーション名は Supabase（PostgREST）の埋め込み名に合わせている。
// 本家の `select("*, bill_contents(*)")` と同じ形のデータを `with: { bill_contents: true }` で得るため。

export const usersRelations = relations(users, ({ many }) => ({
  user_sessions: many(user_sessions),
  assembly_members: many(assembly_members, {
    relationName: "assembly_members_user",
  }),
}));

export const user_sessionsRelations = relations(user_sessions, ({ one }) => ({
  user: one(users, {
    fields: [user_sessions.user_id],
    references: [users.id],
  }),
}));

export const assembliesRelations = relations(assemblies, ({ one, many }) => ({
  assembly_settings: one(assembly_settings, {
    fields: [assemblies.id],
    references: [assembly_settings.assembly_id],
  }),
  assembly_factions: many(assembly_factions),
  assembly_members: many(assembly_members),
  sessions: many(sessions),
  bills: many(bills),
  csv_import_jobs: many(csv_import_jobs),
  bill_import_jobs: many(bill_import_jobs),
  assembly_sources: many(assembly_sources),
  assembly_surveys: many(assembly_surveys),
}));

export const assembly_settingsRelations = relations(
  assembly_settings,
  ({ one }) => ({
    assembly: one(assemblies, {
      fields: [assembly_settings.assembly_id],
      references: [assemblies.id],
    }),
  })
);

export const assembly_factionsRelations = relations(
  assembly_factions,
  ({ one, many }) => ({
    assembly: one(assemblies, {
      fields: [assembly_factions.assembly_id],
      references: [assemblies.id],
    }),
    bill_faction_votes: many(bill_faction_votes),
  })
);

export const assembly_membersRelations = relations(
  assembly_members,
  ({ one }) => ({
    assembly: one(assemblies, {
      fields: [assembly_members.assembly_id],
      references: [assemblies.id],
    }),
    user: one(users, {
      fields: [assembly_members.user_id],
      references: [users.id],
      relationName: "assembly_members_user",
    }),
  })
);

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  assembly: one(assemblies, {
    fields: [sessions.assembly_id],
    references: [assemblies.id],
  }),
  bills: many(bills),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  assembly: one(assemblies, {
    fields: [bills.assembly_id],
    references: [assemblies.id],
  }),
  session: one(sessions, {
    fields: [bills.session_id],
    references: [sessions.id],
  }),
  reviewer: one(users, {
    fields: [bills.reviewed_by],
    references: [users.id],
  }),
  bill_contents: many(bill_contents),
  bill_result: one(bill_results, {
    fields: [bills.id],
    references: [bill_results.bill_id],
  }),
  bill_faction_votes: many(bill_faction_votes),
  mirai_stances: one(mirai_stances, {
    fields: [bills.id],
    references: [mirai_stances.bill_id],
  }),
  preview_tokens: many(preview_tokens),
  bill_objections: many(bill_objections),
  chats: many(chats),
  interview_configs: many(interview_configs),
  bills_tags: many(bills_tags),
  topic_analysis_versions: many(topic_analysis_versions),
  topic_analysis_version: many(topic_analysis_version),
}));

export const bill_contentsRelations = relations(bill_contents, ({ one }) => ({
  bill: one(bills, {
    fields: [bill_contents.bill_id],
    references: [bills.id],
  }),
}));

export const bill_resultsRelations = relations(bill_results, ({ one }) => ({
  bill: one(bills, {
    fields: [bill_results.bill_id],
    references: [bills.id],
  }),
}));

export const bill_faction_votesRelations = relations(
  bill_faction_votes,
  ({ one }) => ({
    bill: one(bills, {
      fields: [bill_faction_votes.bill_id],
      references: [bills.id],
    }),
    assembly_faction: one(assembly_factions, {
      fields: [bill_faction_votes.faction_id],
      references: [assembly_factions.id],
    }),
  })
);

export const mirai_stancesRelations = relations(mirai_stances, ({ one }) => ({
  bill: one(bills, {
    fields: [mirai_stances.bill_id],
    references: [bills.id],
  }),
}));

export const preview_tokensRelations = relations(preview_tokens, ({ one }) => ({
  bill: one(bills, {
    fields: [preview_tokens.bill_id],
    references: [bills.id],
  }),
}));

export const bill_objectionsRelations = relations(
  bill_objections,
  ({ one }) => ({
    bill: one(bills, {
      fields: [bill_objections.bill_id],
      references: [bills.id],
    }),
  })
);

export const tagsRelations = relations(tags, ({ many }) => ({
  bills_tags: many(bills_tags),
}));

export const bills_tagsRelations = relations(bills_tags, ({ one }) => ({
  bill: one(bills, {
    fields: [bills_tags.bill_id],
    references: [bills.id],
  }),
  tags: one(tags, {
    fields: [bills_tags.tag_id],
    references: [tags.id],
  }),
}));

export const csv_import_jobsRelations = relations(
  csv_import_jobs,
  ({ one }) => ({
    assembly: one(assemblies, {
      fields: [csv_import_jobs.assembly_id],
      references: [assemblies.id],
    }),
    user: one(users, {
      fields: [csv_import_jobs.created_by],
      references: [users.id],
    }),
  })
);

export const bill_import_jobsRelations = relations(
  bill_import_jobs,
  ({ one }) => ({
    assembly: one(assemblies, {
      fields: [bill_import_jobs.assembly_id],
      references: [assemblies.id],
    }),
  })
);

export const assembly_sourcesRelations = relations(
  assembly_sources,
  ({ one, many }) => ({
    assembly: one(assemblies, {
      fields: [assembly_sources.assembly_id],
      references: [assemblies.id],
    }),
    assembly_source_documents: many(assembly_source_documents),
  })
);

export const assembly_source_documentsRelations = relations(
  assembly_source_documents,
  ({ one }) => ({
    assembly_source: one(assembly_sources, {
      fields: [assembly_source_documents.source_id],
      references: [assembly_sources.id],
    }),
  })
);

export const assembly_surveysRelations = relations(
  assembly_surveys,
  ({ one }) => ({
    assembly: one(assemblies, {
      fields: [assembly_surveys.assembly_id],
      references: [assemblies.id],
    }),
  })
);

export const chatsRelations = relations(chats, ({ one }) => ({
  bill: one(bills, {
    fields: [chats.bill_id],
    references: [bills.id],
  }),
}));

export const anonymous_visitorsRelations = relations(
  anonymous_visitors,
  ({ many }) => ({
    expert_registrations: many(expert_registrations),
    interview_sessions: many(interview_sessions),
    report_reactions: many(report_reactions),
  })
);

export const expert_registrationsRelations = relations(
  expert_registrations,
  ({ one }) => ({
    anonymous_visitor: one(anonymous_visitors, {
      fields: [expert_registrations.user_id],
      references: [anonymous_visitors.id],
    }),
  })
);

export const interview_configsRelations = relations(
  interview_configs,
  ({ one, many }) => ({
    bills: one(bills, {
      fields: [interview_configs.bill_id],
      references: [bills.id],
    }),
    interview_questions: many(interview_questions),
    interview_sessions: many(interview_sessions),
  })
);

export const interview_questionsRelations = relations(
  interview_questions,
  ({ one }) => ({
    interview_configs: one(interview_configs, {
      fields: [interview_questions.interview_config_id],
      references: [interview_configs.id],
    }),
  })
);

export const interview_sessionsRelations = relations(
  interview_sessions,
  ({ one, many }) => ({
    interview_configs: one(interview_configs, {
      fields: [interview_sessions.interview_config_id],
      references: [interview_configs.id],
    }),
    interview_messages: many(interview_messages),
    interview_rating_feedbacks: many(interview_rating_feedbacks),
    interview_report: one(interview_report, {
      fields: [interview_sessions.id],
      references: [interview_report.interview_session_id],
    }),
  })
);

export const interview_messagesRelations = relations(
  interview_messages,
  ({ one }) => ({
    interview_sessions: one(interview_sessions, {
      fields: [interview_messages.interview_session_id],
      references: [interview_sessions.id],
    }),
  })
);

export const interview_rating_feedbacksRelations = relations(
  interview_rating_feedbacks,
  ({ one }) => ({
    interview_sessions: one(interview_sessions, {
      fields: [interview_rating_feedbacks.interview_session_id],
      references: [interview_sessions.id],
    }),
  })
);

export const interview_reportRelations = relations(
  interview_report,
  ({ one, many }) => ({
    interview_sessions: one(interview_sessions, {
      fields: [interview_report.interview_session_id],
      references: [interview_sessions.id],
    }),
    interview_opinion: many(interview_opinion),
    report_reactions: many(report_reactions),
    topic_analysis_classifications: many(topic_analysis_classifications),
  })
);

export const interview_opinionRelations = relations(
  interview_opinion,
  ({ one, many }) => ({
    interview_report: one(interview_report, {
      fields: [interview_opinion.interview_report_id],
      references: [interview_report.id],
    }),
    topic_opinion: many(topic_opinion),
  })
);

export const report_reactionsRelations = relations(
  report_reactions,
  ({ one }) => ({
    interview_report: one(interview_report, {
      fields: [report_reactions.interview_report_id],
      references: [interview_report.id],
    }),
  })
);

export const topic_analysis_versionsRelations = relations(
  topic_analysis_versions,
  ({ one, many }) => ({
    bills: one(bills, {
      fields: [topic_analysis_versions.bill_id],
      references: [bills.id],
    }),
    topic_analysis_topics: many(topic_analysis_topics),
    topic_analysis_classifications: many(topic_analysis_classifications),
  })
);

export const topic_analysis_topicsRelations = relations(
  topic_analysis_topics,
  ({ one, many }) => ({
    topic_analysis_versions: one(topic_analysis_versions, {
      fields: [topic_analysis_topics.version_id],
      references: [topic_analysis_versions.id],
    }),
    topic_analysis_classifications: many(topic_analysis_classifications),
  })
);

export const topic_analysis_classificationsRelations = relations(
  topic_analysis_classifications,
  ({ one }) => ({
    topic_analysis_versions: one(topic_analysis_versions, {
      fields: [topic_analysis_classifications.version_id],
      references: [topic_analysis_versions.id],
    }),
    interview_report: one(interview_report, {
      fields: [topic_analysis_classifications.interview_report_id],
      references: [interview_report.id],
    }),
    topic_analysis_topics: one(topic_analysis_topics, {
      fields: [topic_analysis_classifications.topic_id],
      references: [topic_analysis_topics.id],
    }),
  })
);

export const topic_analysis_versionRelations = relations(
  topic_analysis_version,
  ({ one, many }) => ({
    bills: one(bills, {
      fields: [topic_analysis_version.bill_id],
      references: [bills.id],
    }),
    topic: many(topic),
    topic_opinion: many(topic_opinion),
  })
);

export const topicRelations = relations(topic, ({ one, many }) => ({
  topic_analysis_version: one(topic_analysis_version, {
    fields: [topic.version_id],
    references: [topic_analysis_version.id],
  }),
  topic_opinion: many(topic_opinion),
}));

export const topic_opinionRelations = relations(topic_opinion, ({ one }) => ({
  interview_opinion: one(interview_opinion, {
    fields: [topic_opinion.opinion_id],
    references: [interview_opinion.id],
  }),
  topic: one(topic, {
    fields: [topic_opinion.topic_id],
    references: [topic.id],
  }),
}));
