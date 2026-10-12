"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DummyDeletionDialog } from "@/features/assemblies/client/components/dummy-deletion-dialog";
import { createSession } from "../../server/actions/session-actions";
import type { SessionInput } from "../../shared/types";
import { EMPTY_SESSION_INPUT, SessionFields } from "./session-fields";

/** 会期を追加するフォーム */
export function SessionForm({
  assemblySlug,
  assemblyName,
}: {
  assemblySlug: string;
  assemblyName: string;
}) {
  const [value, setValue] = useState<SessionInput>(EMPTY_SESSION_INPUT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDummy, setConfirmingDummy] = useState(false);

  const submit = async (deleteDummyData: boolean) => {
    setIsSubmitting(true);
    try {
      const result = await createSession(assemblySlug, value, {
        deleteDummyData,
      });
      if ("needsDummyDeletion" in result) {
        setConfirmingDummy(true);
      } else if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("会期を追加しました");
        setValue(EMPTY_SESSION_INPUT);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SessionFields
        value={value}
        onChange={setValue}
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "追加中..." : "追加"}
        </Button>
      </div>
      <DummyDeletionDialog
        open={confirmingDummy}
        assemblyName={assemblyName}
        actionLabel="この会期を追加します"
        onCancel={() => setConfirmingDummy(false)}
        onConfirm={() => {
          setConfirmingDummy(false);
          submit(true);
        }}
      />
    </form>
  );
}
