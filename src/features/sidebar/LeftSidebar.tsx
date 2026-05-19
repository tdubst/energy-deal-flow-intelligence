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
          <p>Battery tells you where. Ownership tells you whether you can close.</p>
        </div>
      </header>

      <section className="intro-card">
        <span className="eyebrow">Live demo thesis</span>
        <h2>Find pre-headline infrastructure opportunities before the market sees them.</h2>
        <p>Signal {"->"} Corridor {"->"} Parcel {"->"} Ownership {"->"} Action.</p>
        <div className="intro-metrics">
          <span><strong>2</strong> corridors analyzed</span>
          <span><strong>170</strong> parcels screened</span>
          <span><strong>345kV</strong> transmission proximity</span>
          <span><strong>FEMA</strong> flood risk</span>
        </div>
        <button className="primary-button" onClick={() => store.setInsightMode(true)}>Start Insight Mode</button>
      </section>

      <section className="summary-grid">
        <MetricBlock label="Active corridors" value={String(opportunities.length)} />
        <MetricBlock label="Primary signal" value={formatMw(project.mw)} tone="good" />
        <MetricBlock label="Screened value" value={formatMoney(opportunities.reduce((sum, item) => sum + item.valueCreationM, 0))} tone="warn" />
        <MetricBlock label="Workflow output" value="Diligence-ready" />
      </section>

      <section className="deal-stack-card">
        <SectionHeader eyebrow="Signal stack" title="From Map Signal to Close Path" />
        <div className="deal-stack-grid">
          <span>Corridors tracked <strong>2</strong></span>
          <span>Parcels screened <strong>170</strong></span>
          <span>Flood overlay <strong>FEMA NFHL</strong></span>
          <span>Transmission context <strong>HIFLD 230kV+</strong></span>
          <span>Queue signal <strong>BESS / storage</strong></span>
          <span>Workflow output <strong>Parcel list</strong></span>
        </div>
      </section>

      <section className="demo-path-card">
        <SectionHeader eyebrow="5-minute demo" title="Recommended Flow" />
        <ol>
          <li>Start with Texas electrification context.</li>
          <li>Show BESS as the pre-headline signal.</li>
          <li>Validate the 345kV corridor and narrow to parcels.</li>
          <li>Reveal ownership, score, acreage, flood risk, and upside.</li>
          <li>Move the best parcel into the diligence queue for outreach.</li>
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
            <small>Signal {"->"} Corridor {"->"} Parcel {"->"} Ownership {"->"} Action</small>
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
