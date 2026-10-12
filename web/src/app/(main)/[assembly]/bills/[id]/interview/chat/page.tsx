import { notFound } from "next/navigation";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { requireInterviewBill } from "@/features/interview-config/server/loaders/require-interview-bill";
import { InterviewChatClient } from "@/features/interview-session/client/components/interview-chat-client";
import { InterviewSessionErrorView } from "@/features/interview-session/client/components/interview-session-error-view";
import { initializeInterviewChat } from "@/features/interview-session/server/loaders/initialize-interview-chat";

export const dynamic = "force-dynamic";

interface InterviewChatPageProps {
  params: Promise<{ assembly: string; id: string }>;
}

export default async function InterviewChatPage({
  params,
}: InterviewChatPageProps) {
  const { assembly, id } = await params;
  const { bill } = await requireInterviewBill(assembly, id);
  const interviewConfig = await getInterviewConfig(bill.id);
  if (!interviewConfig) {
    notFound();
  }

  // ループモードの場合のみ質問数を取得（プログレスバー用）
  const questions =
    interviewConfig.mode === "loop"
      ? await getInterviewQuestions(interviewConfig.id)
      : [];

  // インタビューチャットの初期化処理
  try {
    const { session, messages } = await initializeInterviewChat(
      bill.id,
      interviewConfig.id
    );

    return (
      <InterviewChatClient
        assemblySlug={bill.assembly_slug}
        billId={bill.id}
        billTitle={bill.bill_content?.title ?? bill.name}
        sessionId={session.id}
        initialMessages={messages}
        mode={interviewConfig.mode}
        totalQuestions={questions.length}
        estimatedDuration={interviewConfig.estimated_duration}
        sessionStartedAt={session.started_at}
        hasRated={session.rating != null}
      />
    );
  } catch (error) {
    console.error("Failed to initialize interview session:", error);
    return (
      <InterviewSessionErrorView
        assemblySlug={bill.assembly_slug}
        billId={bill.id}
      />
    );
  }
}
