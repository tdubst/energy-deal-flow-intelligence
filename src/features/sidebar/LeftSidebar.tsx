import { opportunities, queueProjects } from "../../data";
import { Badge, MetricBlock, ScorePill, SectionHeader } from "../../components/ui";
import { formatMoney, formatMw } from "../../services/formatters";
import type { DealFlowStore } from "../../store/useDealFlowStore";
import { DiligenceQueue } from "./DiligenceQueue";
import { LayerControls } from "./LayerControls";

export const LeftSidebar = ({ store }: { store: DealFlowStore }) => {
  const project = queueProjects.find((item) => item.id === store.selectedProjectId) ?? queueProjects[0];

  return (
    <div className="sidebar-content">
      <header className="brand-block">
        <span className="brand-mark">EDFI</span>
        <div>
          <h1>Energy Deal Flow Intelligence</h1>
          <p>Pre-headline ERCOT infrastructure signals</p>
        </div>
      </header>

      <section className="summary-grid">
        <MetricBlock label="Active corridors" value={String(opportunities.length)} />
        <MetricBlock label="Primary signal" value={formatMw(project.mw)} tone="good" />
        <MetricBlock label="Screened value" value={formatMoney(opportunities.reduce((sum, item) => sum + item.valueCreationM, 0))} tone="warn" />
        <MetricBlock label="Workflow state" value="Local MVP" />
      </section>

      <section className="demo-path-card">
        <SectionHeader eyebrow="5-minute demo" title="Recommended Flow" />
        <ol>
          <li>Start with Fit Texas for statewide grid context.</li>
          <li>Fit Fort Bend, then show transmission and BESS signal.</li>
          <li>Use Parcels to reveal owner, score, acreage, and upside.</li>
          <li>Add a parcel to the diligence queue from the report.</li>
          <li>Switch to Navarro, prove repeatability, then Fit All.</li>
        </ol>
      </section>

      <section className="opportunity-list">
        <SectionHeader eyebrow="Repeatable process" title="Corridor Opportunities" />
        {opportunities.map((opportunity) => (
          <button
            key={opportunity.id}
            className={`opportunity-card ${opportunity.id === store.selectedOpportunity.id ? "opportunity-card--active" : ""}`}
            onClick={() => store.setSelectedOpportunityId(opportunity.id)}
          >
            <div>
              <strong>{opportunity.title}</strong>
              <span>{opportunity.geography}</span>
            </div>
            <ScorePill value={opportunity.score} />
            <p>{opportunity.leadIndicator}</p>
            <div className="opportunity-meta">
              <Badge tone="good">{formatMoney(opportunity.valueCreationM)}</Badge>
              <Badge>{opportunity.timelineMonths} mo</Badge>
            </div>
          </button>
        ))}
      </section>

      <LayerControls store={store} />
      <DiligenceQueue store={store} />
    </div>
  );
};
