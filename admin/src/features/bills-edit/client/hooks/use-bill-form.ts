import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { isNextRedirectError } from "@/lib/utils/redirect";

export function useBillForm(assemblySlug: string) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    /** false を返すと、保存していない（確認待ちなど）として「保存しました」を出さない */
    submitFn: () => Promise<void | false>,
    errorMessage = "処理中にエラーが発生しました"
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if ((await submitFn()) === false) return;
      toast.success("保存しました");
      router.refresh();
    } catch (err) {
      // Next.jsのリダイレクトエラーはそのまま投げる
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError(getErrorMessage(err, errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(routes.assemblyBills(assemblySlug) as Route);
  };

  return {
    isSubmitting,
    error,
    handleSubmit,
    handleCancel,
  };
}
