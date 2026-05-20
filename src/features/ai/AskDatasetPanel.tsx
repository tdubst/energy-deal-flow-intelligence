import { useMemo, useState } from "react";
import { opportunities, owners, queueProjects } from "../../data";
import { Badge, SectionHeader } from "../../components/ui";
import { formatMoney, formatMw } from "../../services/formatters";
import type { DealFlowStore } from "../../store/useDealFlowStore";
import type { Parcel } from "../../types";

interface DatasetContext {
  selectedCorridor: string;
  thesis: string;
  reportSummary: string;
  topParcels: Array<{
    id: string;
    owner: string;
    acres: number;
    score: number;
    nearest345Miles: number;
    floodRisk: string;
    ownerBucket: string;
    screeningUpsideBaseM: number;
    sourceName: string;
  }>;
  diligenceQueue: Array<{
    label: string;
    owner: string;
    status: string;
    priority: string;
    score: number;
    readiness: number;
    notes: string;
  }>;
  risks: string[];
  sourceMetadata: {
    flood: string;
    transmission: string;
    geometryExcluded: boolean;
  };
  topOpportunities: Array<{
    title: string;
    geography: string;
    score: number;
    leadIndicator: string;
    valueCreationM: number;
    timelineMonths: number;
  }>;
}

const suggestedPrompts = [
  "Rank the top 5 parcels by executable upside",
  "Explain why this corridor matters now",
  "Compare Fort Bend and Navarro",
  "What are the biggest diligence risks?",
  "Which owner should we call first?",
];

const normalize = (value: string) => value.toLowerCase();

const localDatasetAnswer = (question: string, context: DatasetContext) => {
  const q = normalize(question);
  const topParcels = [...context.topParcels].sort(
    (a, b) => b.score + b.screeningUpsideBaseM - (a.score + a.screeningUpsideBaseM),
  );
  const firstParcel = topParcels[0];
  const topQueue = [...context.diligenceQueue].sort((a, b) => b.readiness + b.score - (a.readiness + a.score))[0];

  if (q.includes("compare") || q.includes("fort bend") || q.includes("navarro")) {
    const comparison = context.topOpportunities
      .map((item) => `${item.title}: score ${item.score}, ${item.leadIndicator}, ${formatMoney(item.valueCreationM)} screened upside.`)
      .join("\n");
    return `Demo mode answer from loaded context:\n\nFact: ${comparison}\n\nInference: Fort Bend currently reads as the stronger first-call corridor because it has the higher score and larger screened upside. Navarro is useful as repeatability proof because it shows the same Signal -> Corridor -> Parcel -> Ownership -> Action pattern in a second ERCOT corridor.`;
  }

  if (q.includes("risk")) {
    return `Demo mode answer from loaded context:\n\nFact: the listed diligence risks are ${context.risks.join(", ")}.\n\nInference: the practical diligence sequence is POI confirmation, owner/entity verification, flood review, then outreach sequencing. Missing data: final POI deliverability and live owner contact confirmation are not included in this frontend dataset.`;
  }

  if (q.includes("owner") || q.includes("call")) {
    const ownerLine = topQueue
      ? `${topQueue.owner} via "${topQueue.label}" (${topQueue.status}, ${topQueue.readiness}% ready).`
      : firstParcel
        ? `${firstParcel.owner} on parcel ${firstParcel.id}.`
        : "No owner candidate is loaded.";
    return `Demo mode answer from loaded context:\n\nFact: the strongest owner/outreach candidate visible in the current context is ${ownerLine}\n\nInference: call sequencing should prioritize high-readiness items where owner/entity enrichment already exists. This is diligence support, not investment advice.`;
  }

  if (q.includes("summarize") || q.includes("investor")) {
    return `Demo mode answer from loaded context:\n\n${context.selectedCorridor} is a pre-headline infrastructure opportunity where BESS/storage activity points to a transmission-proven corridor, screened parcels narrow the investable universe, and owner/entity diligence defines the executable path.\n\nAction: verify owner, confirm POI, begin outreach sequencing.`;
  }

  const parcelLines = topParcels
    .slice(0, 5)
    .map(
      (parcel, index) =>
        `${index + 1}. ${parcel.id}: score ${parcel.score}, ${formatMoney(parcel.screeningUpsideBaseM)}, ${parcel.acres.toFixed(0)} ac, ${parcel.nearest345Miles.toFixed(2)} mi to 345kV, owner ${parcel.owner}.`,
    )
    .join("\n");

  return `Demo mode answer from loaded context:\n\nFact: top parcels by combined score and screened upside are:\n${parcelLines || "No parcels are loaded for this corridor."}\n\nInference: prioritize parcels with strong score, larger upside, lower owner complexity, and manageable flood risk. Missing data: final owner contact validation and POI deliverability are not included.`;
};

export const AskDatasetPanel = ({ store, parcels }: { store: DealFlowStore; parcels: Parcel[] }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<"idle" | "live" | "demo" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const context = useMemo<DatasetContext>(() => {
    const opportunity = store.selectedOpportunity;
    const county = opportunity.id === "navarro-corsicana-corridor" ? "Navarro" : "Fort Bend";
    const corridorParcels = parcels
      .filter((parcel) => parcel.county === county || opportunity.parcelIds.includes(parcel.id))
      .sort((a, b) => b.score + b.screeningUpsideBaseM - (a.score + a.screeningUpsideBaseM))
      .slice(0, 8);
    const queueItems = store.diligenceItems.filter((item) => item.opportunityId === opportunity.id);
    const project = queueProjects.find((item) => item.id === opportunity.primaryProjectId);

    return {
      selectedCorridor: `${opportunity.title} (${opportunity.geography})`,
      thesis: opportunity.thesis,
      reportSummary: `${opportunity.leadIndicator}; ${formatMoney(opportunity.valueCreationM)} screened upside; ${project ? formatMw(project.mw) : "queue signal"} primary queue signal; ${opportunity.timelineMonths} month lead window.`,
      topParcels: corridorParcels.map((parcel) => {
        const owner = owners.find((item) => item.parcelId === parcel.id);
        return {
          id: parcel.id,
          owner: parcel.owner ?? owner?.owner ?? "Owner enrichment pending",
          acres: parcel.acres,
          score: parcel.score,
          nearest345Miles: parcel.nearest345Miles,
          floodRisk: parcel.floodRisk,
          ownerBucket: parcel.ownerBucket,
          screeningUpsideBaseM: parcel.screeningUpsideBaseM,
          sourceName: parcel.sourceName ?? "source-backed overlay",
        };
      }),
      diligenceQueue: queueItems.map((item) => ({
        label: item.label,
        owner: item.owner,
        status: item.status,
        priority: item.priority,
        score: item.score,
        readiness: item.readiness,
        notes: item.notes,
      })),
      risks: opportunity.risks,
      sourceMetadata: {
        flood: "FEMA NFHL flood screen",
        transmission: "HIFLD 230kV+ transmission context",
        geometryExcluded: true,
      },
      topOpportunities: opportunities.map((item) => ({
        title: item.title,
        geography: item.geography,
        score: item.score,
        leadIndicator: item.leadIndicator,
        valueCreationM: item.valueCreationM,
        timelineMonths: item.timelineMonths,
      })),
    };
  }, [parcels, store.diligenceItems, store.selectedOpportunity]);

  const submit = async (prompt = question) => {
    const nextQuestion = prompt.trim();
    if (!nextQuestion || loading) return;
    setQuestion(nextQuestion);
    setLoading(true);
    setAnswer("");
    setMode("idle");

    try {
      const response = await fetch("/api/ask-dataset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: nextQuestion, context }),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload.answer) {
        setAnswer(payload.answer);
        setMode(payload.mode === "live" ? "live" : "demo");
      } else {
        setAnswer(`${payload.error || "Live AI is not configured."}\n\n${localDatasetAnswer(nextQuestion, context)}`);
        setMode(response.status === 503 || response.status === 404 ? "demo" : "error");
      }
    } catch (error) {
      setAnswer(`${error instanceof Error ? error.message : "Live AI is unavailable."}\n\n${localDatasetAnswer(nextQuestion, context)}`);
      setMode("demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ask-dataset-panel">
      <SectionHeader
        eyebrow="AI diligence layer"
        title="Ask the Dataset"
        action={<Badge tone={mode === "live" ? "good" : mode === "error" ? "risk" : "warn"}>{mode === "live" ? "Live AI" : "Demo mode"}</Badge>}
      />
      <p>Ask natural-language questions about the selected corridor, parcel screen, owners, risks, and diligence queue.</p>
      <div className="ask-suggestions">
        {suggestedPrompts.map((prompt) => (
          <button key={prompt} onClick={() => submit(prompt)} disabled={loading}>
            {prompt}
          </button>
        ))}
      </div>
      <div className="ask-input-row">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask which owner to call first..."
          aria-label="Ask the Dataset question"
        />
        <button className="primary-button" onClick={() => submit()} disabled={loading || !question.trim()}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>
      {answer ? (
        <article className={`ask-answer ask-answer--${mode}`}>
          <span>{mode === "live" ? "Answer from OpenAI using compact context" : "Graceful fallback using loaded frontend context"}</span>
          <p>{answer}</p>
        </article>
      ) : (
        <small>Uses compact context only. Raw GeoJSON and geometry are excluded.</small>
      )}
    </section>
  );
};
