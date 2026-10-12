import { AlertTriangle } from "lucide-react";
import { env } from "@/lib/env";

interface PreviewBannerProps {
  /** 議案の議会（管理画面の戻り先に使う） */
  assemblySlug: string;
  message: string;
}

/** プレビュー画面の上部に出す帯（一般公開されていないことと、管理画面への戻り先） */
export function PreviewBanner({ assemblySlug, message }: PreviewBannerProps) {
  return (
    <div className="sticky top-0 z-50 bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">プレビューモード - {message}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={`${env.adminUrl}/${assemblySlug}/bills`}
              className="text-yellow-700 hover:text-yellow-900 underline"
            >
              管理画面に戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
