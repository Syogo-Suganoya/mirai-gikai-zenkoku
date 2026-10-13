import { notFound } from "next/navigation";
import { PreviewBanner } from "@/features/bills/server/components/preview-banner";
import { requirePreviewBill } from "@/features/bills/server/loaders/get-assembly-bill";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { InterviewChatClient } from "@/features/interview-session/client/components/interview-chat-client";
import { InterviewSessionErrorView } from "@/features/interview-session/client/components/interview-session-error-view";
import { initializeInterviewChat } from "@/features/interview-session/server/loaders/initialize-interview-chat";
import { interviewInitErrorView } from "@/features/interview-session/shared/utils/interview-init-error";

export const dynamic = "force-dynamic";

interface InterviewPreviewChatPageProps {
  params: Promise<{ assembly: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function InterviewPreviewChatPage({
  params,
  searchParams,
}: InterviewPreviewChatPageProps) {
  const [{ assembly: assemblySlug, id }, { token }] = await Promise.all([
    params,
    searchParams,
  ]);

  // 管理者用の取得（非公開議案・非公開設定も対象）。トークンが正しくなければ 404
  const { assembly, bill } = await requirePreviewBill(assemblySlug, id, token);
  const interviewConfig = await getInterviewConfigAdmin(bill.id);
  if (!interviewConfig) {
    notFound();
  }

  const banner = (
    <PreviewBanner
      assemblySlug={assembly.slug}
      message="このインタビューは一般公開されていません"
    />
  );

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
      <>
        {banner}
        <InterviewChatClient
          assemblySlug={assembly.slug}
          billId={bill.id}
          billTitle={bill.bill_content?.title ?? bill.name}
          sessionId={session.id}
          initialMessages={messages}
          mode={interviewConfig.mode}
          totalQuestions={questions.length}
          estimatedDuration={interviewConfig.estimated_duration}
          sessionStartedAt={session.started_at}
          hasRated={session.rating != null}
          previewToken={token}
        />
      </>
    );
  } catch (error) {
    console.error("Failed to initialize interview session (preview):", error);
    return (
      <>
        {banner}
        <InterviewSessionErrorView
          {...interviewInitErrorView(error)}
          assemblySlug={assembly.slug}
          billId={bill.id}
          previewToken={token}
        />
      </>
    );
  }
}
