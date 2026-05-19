import { Badge, SectionHeader } from "../../components/ui";
import { exportDiligenceQueue } from "../../services/csvExport";
import type { DealFlowStore } from "../../store/useDealFlowStore";
import type { DiligencePriority, DiligenceStatus } from "../../types";

const statuses: (DiligenceStatus | "All")[] = ["All", "Signal Detected", "Screened", "Ownership Verified", "Outreach Ready", "Active Diligence"];
const priorities: DiligencePriority[] = ["High", "Medium", "Low"];

const priorityRank = { High: 3, Medium: 2, Low: 1 };

export const DiligenceQueue = ({ store }: { store: DealFlowStore }) => {
  const items = store.diligenceItems
    .filter((item) => store.queueFilter === "All" || item.status === store.queueFilter)
    .sort((a, b) => {
      if (store.queueSort === "Score") return b.score - a.score;
      if (store.queueSort === "Readiness") return b.readiness - a.readiness;
      return priorityRank[b.priority] - priorityRank[a.priority];
    });

  return (
    <section className="diligence-queue">
      <SectionHeader
        eyebrow="Workflow"
        title="Diligence Queue"
        action={<button className="ghost-button" onClick={() => exportDiligenceQueue(store.diligenceItems)}>Export</button>}
      />
      <div className="queue-toolbar">
        <select value={store.queueFilter} onChange={(event) => store.setQueueFilter(event.target.value as DiligenceStatus | "All")}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <button
          className="ghost-button"
          onClick={() => store.setQueueSort(store.queueSort === "Priority" ? "Score" : store.queueSort === "Score" ? "Readiness" : "Priority")}
        >
          Sort: {store.queueSort}
        </button>
      </div>
      <div className="queue-list">
        {items.map((item) => (
          <article className={`queue-card ${item.pinned ? "queue-card--pinned" : ""}`} key={item.id}>
            <div className="queue-card-header">
              <button
                className="icon-button"
                aria-label={item.pinned ? "Unpin diligence item" : "Pin diligence item"}
                onClick={() => store.updateDiligenceItem(item.id, { pinned: !item.pinned })}
              >
                {item.pinned ? "PIN" : "ADD"}
              </button>
              <div>
                <strong>{item.label}</strong>
                <span>{item.owner}</span>
              </div>
              <Badge tone={item.priority === "High" ? "risk" : item.priority === "Medium" ? "warn" : "neutral"}>{item.priority}</Badge>
            </div>
            <div className="queue-grid">
              <select value={item.status} onChange={(event) => store.updateDiligenceItem(item.id, { status: event.target.value as DiligenceStatus })}>
                {statuses.filter((status) => status !== "All").map((status) => <option key={status}>{status}</option>)}
              </select>
              <select value={item.priority} onChange={(event) => store.updateDiligenceItem(item.id, { priority: event.target.value as DiligencePriority })}>
                {priorities.map((priority) => <option key={priority}>{priority}</option>)}
              </select>
            </div>
            <div className="readiness">
              <span>Readiness</span>
              <div><i style={{ width: `${item.readiness}%` }} /></div>
              <strong>{item.readiness}%</strong>
            </div>
            <div className="risk-badges">
              {item.riskFlags.map((risk) => <Badge key={risk} tone="warn">{risk}</Badge>)}
            </div>
            <textarea value={item.notes} onChange={(event) => store.updateDiligenceItem(item.id, { notes: event.target.value })} />
          </article>
        ))}
      </div>
    </section>
  );
};
