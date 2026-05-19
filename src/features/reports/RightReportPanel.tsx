import { useMemo, useState } from "react";
import { owners, queueProjects } from "../../data";
import { Badge, MetricBlock, PanelCard, ScorePill, SectionHeader } from "../../components/ui";
import { exportParcels, renderOpportunityReport } from "../../services/csvExport";
import { formatMoney, formatMw } from "../../services/formatters";
import type { DealFlowStore } from "../../store/useDealFlowStore";
import type { Parcel } from "../../types";

export const RightReportPanel = ({ store, parcels }: { store: DealFlowStore; parcels: Parcel[] }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({ narrative: true, parcels: true, workflow: true });
  const opportunity = store.selectedOpportunity;
  const project = queueProjects.find((item) => item.id === opportunity.primaryProjectId) ?? queueProjects[0];
  const selectedParcels = useMemo(
    () => parcels.filter((parcel) => opportunity.parcelIds.includes(parcel.id)).slice(0, 5),
    [opportunity.parcelIds, parcels],
  );
  const queueItems = store.diligenceItems.filter((item) => item.opportunityId === opportunity.id);
  const report = renderOpportunityReport(opportunity, selectedParcels);
  const sourceNames = Array.from(new Set(selectedParcels.map((parcel) => parcel.sourceName).filter(Boolean)));
  const topParcel = selectedParcels[0];

  const addParcelToQueue = (parcel: Parcel) => {
    const owner = owners.find((item) => item.parcelId === parcel.id);
    store.addDiligenceItem({
      id: `dil-${parcel.id}`,
      opportunityId: opportunity.id,
      label: `${parcel.id.toUpperCase()} parcel screen`,
      owner: parcel.owner ?? owner?.owner ?? "Owner enrichment pending",
      status: "Screened",
      priority: parcel.score >= 75 ? "High" : "Medium",
      score: parcel.score,
      readiness: Math.min(88, Math.max(42, Math.round(parcel.score * 0.82))),
      pinned: true,
      notes: `Added from client demo report. Verify owner contact, buildability, and ${parcel.nearest345Miles.toFixed(2)} mi transmission proximity.`,
      riskFlags: [parcel.floodRisk === "high" ? "Flood screen" : "Buildability", parcel.ownerBucket === "fragmented" ? "Assembly risk" : "Owner contact"],
    });
  };

  const toggle = (id: string) => setOpen((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div className="report-content">
      <header className="report-sticky">
        <span className="eyebrow">Client report</span>
        <h2>{opportunity.title}</h2>
        <div>
          <ScorePill value={opportunity.score} />
          <Badge tone="good">{opportunity.timelineMonths} month lead</Badge>
        </div>
      </header>

      <PanelCard className="executive-card">
        <SectionHeader eyebrow="Executive Summary" title="Pre-Headline Deal Signal" />
        <p className="report-thesis-line">Battery tells you where. Ownership tells you whether you can close.</p>
        <p>{opportunity.thesis}</p>
        <div className="report-brief-grid">
          <div>
            <span>Corridor</span>
            <strong>{opportunity.geography}</strong>
          </div>
          <div>
            <span>Lead Indicator</span>
            <strong>{opportunity.leadIndicator}</strong>
          </div>
          <div>
            <span>Client Action</span>
            <strong>Verify owner, confirm POI, begin outreach sequencing.</strong>
          </div>
          <div>
            <span>Why This Corridor Matters Now</span>
            <strong>BESS/storage activity is exposing transmission-backed land optionality before headline demand reprices the corridor.</strong>
          </div>
        </div>
        <div className="report-thesis-stack">
          <div>
            <span className="eyebrow">Investment Thesis</span>
            <p>{opportunity.leadIndicator}; convert queue intelligence into owner-verified land-control diligence before the broader market prices the corridor.</p>
          </div>
          <div>
            <span className="eyebrow">Next Action</span>
            <p>Verify owner, confirm POI, begin outreach sequencing.</p>
          </div>
          <div>
            <span className="eyebrow">Data Confidence</span>
            <p>{sourceNames.length ? sourceNames.join(" + ") : "Source-backed parcel overlay"} with HIFLD 230kV+ transmission context, FEMA NFHL flood screening, and owner/entity enrichment.</p>
          </div>
        </div>
        <div className="report-metrics">
          <MetricBlock label="Screened upside" value={formatMoney(opportunity.valueCreationM)} tone="good" />
          <MetricBlock label="Primary queue signal" value={formatMw(project.mw)} tone="warn" />
          <MetricBlock label="Voltage" value={`${project.voltageKv}kV`} />
          <MetricBlock label="Parcel focus" value={topParcel ? `${topParcel.acres.toFixed(0)} ac` : "Pending"} />
        </div>
      </PanelCard>

      <section className="accordion">
        <button onClick={() => toggle("narrative")}>Narrative Deal Page</button>
        {open.narrative ? (
          <div className="accordion-body">
            <p>{project.narrative}</p>
            <div className="workflow-row">
              <span>Why this corridor matters now</span>
              <strong>Pre-headline signal plus transmission-proven siting context.</strong>
              <small>Battery/storage activity identifies the corridor; parcel and ownership screens identify whether there is a diligence-ready path.</small>
            </div>
            <ul>
              {opportunity.nextActions.map((action) => <li key={action}>{action}</li>)}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="accordion">
        <button onClick={() => toggle("parcels")}>Parcel Visuals + Owner Screen</button>
        {open.parcels ? (
          <div className="accordion-body">
            {selectedParcels.length ? selectedParcels.map((parcel) => {
              const owner = owners.find((item) => item.parcelId === parcel.id);
              return (
                <article className="parcel-report-card" key={parcel.id}>
                  <div>
                    <strong>{parcel.id}</strong>
                    <span>{parcel.owner ?? owner?.owner ?? "Owner enrichment pending"}</span>
                  </div>
                  <ScorePill value={parcel.score} />
                  <small>{parcel.acres.toFixed(0)} ac · {parcel.nearest345Miles.toFixed(2)} mi to 345kV · {formatMoney(parcel.screeningUpsideBaseM)} · owner path: {parcel.ownerBucket.replaceAll("_", " ")} · {parcel.sourceName ?? "source-backed"}</small>
                  <div className="parcel-report-actions">
                    <Badge tone={parcel.floodRisk === "high" ? "risk" : parcel.floodRisk === "moderate" ? "warn" : "good"}>{parcel.floodRisk} flood</Badge>
                    <button className="ghost-button" onClick={() => addParcelToQueue(parcel)}>Add to Diligence</button>
                  </div>
                </article>
              );
            }) : <p>No parcel candidates are selected for this corridor.</p>}
            <button className="primary-button" onClick={() => exportParcels(selectedParcels.length ? selectedParcels : parcels)}>Export Parcels CSV</button>
          </div>
        ) : null}
      </section>

      <section className="accordion">
        <button onClick={() => toggle("risks")}>Risk + Mitigation</button>
        {open.risks ? (
          <div className="accordion-body">
            {opportunity.risks.map((risk) => (
              <div className="workflow-row" key={risk}>
                <span>Risk</span>
                <strong>{risk}</strong>
                <small>Mitigation: validate through source refresh, POI confirmation, owner outreach, and interconnection milestone monitoring.</small>
              </div>
            ))}
            <div className="workflow-row">
              <span>Evidence Standard</span>
              <strong>Separate sourced facts from investment thesis.</strong>
              <small>Reports distinguish source-backed overlay facts, inferred opportunity logic, ownership assumptions, and remaining diligence questions.</small>
            </div>
          </div>
        ) : null}
      </section>

      <section className="accordion">
        <button onClick={() => toggle("workflow")}>Diligence Workflow</button>
        {open.workflow ? (
          <div className="accordion-body">
            {queueItems.map((item) => (
              <div className="workflow-row" key={item.id}>
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <small>{item.readiness}% ready</small>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="accordion">
        <button onClick={() => toggle("markdown")}>Markdown Report</button>
        {open.markdown ? <pre className="report-markdown">{report}</pre> : null}
      </section>
    </div>
  );
};
