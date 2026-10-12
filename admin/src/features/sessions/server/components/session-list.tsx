import { SessionItem } from "../../client/components/session-item";
import type { SessionWithBillCount } from "../../shared/types";

export function SessionList({
  assemblySlug,
  sessions,
}: {
  assemblySlug: string;
  sessions: SessionWithBillCount[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">会期一覧 ({sessions.length}件)</h2>
      {sessions.length === 0 ? (
        <p className="text-gray-500">会期がありません</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              assemblySlug={assemblySlug}
              session={session}
            />
          ))}
        </div>
      )}
    </div>
  );
}
