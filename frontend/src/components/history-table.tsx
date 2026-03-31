import type { HistoryRecord } from "@/lib/types";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

export function HistoryTable({
  history,
  includeUser,
}: {
  history: HistoryRecord[];
  includeUser: boolean;
}) {
  return (
    <div className="content-card history-table-wrap font-inter">
      <table className="history-table">
        <thead>
          <tr>
            <th>Date time</th>
            {includeUser ? <th>Username</th> : null}
            <th>Concert name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record) => (
            <tr key={record.id}>
              <td>{formatDate(record.createdAt)}</td>
              {includeUser ? <td>{record.user?.username ?? "-"}</td> : null}
              <td>{record.concert.name}</td>
              <td>{record.action === "RESERVE" ? "Reserve" : "Cancel"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}