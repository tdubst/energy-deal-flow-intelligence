import type { ReactNode } from "react";

export const SectionHeader = ({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) => (
  <div className="section-header">
    <div>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
    </div>
    {action}
  </div>
);

export const MetricBlock = ({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "warn" | "risk" }) => (
  <div className={`metric-block metric-block--${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export const Badge = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "risk" }) => (
  <span className={`badge badge--${tone}`}>{children}</span>
);

export const ScorePill = ({ value }: { value: number }) => (
  <span className="score-pill">Score {value}</span>
);

export const PanelCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`panel-card ${className}`}>{children}</section>
);
