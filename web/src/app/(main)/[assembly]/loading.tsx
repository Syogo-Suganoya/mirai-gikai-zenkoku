import { Loader2 } from "lucide-react";

/** 議会のページを開くまでの表示（初回は数秒かかることがある） */
export default function AssemblyLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-mirai-text-secondary"
    >
      <Loader2 className="size-5 animate-spin" aria-hidden />
      読み込み中…
    </div>
  );
}
