import { useState } from "react";
import { SectionHeader } from "../../components/ui";
import type { DealFlowStore } from "../../store/useDealFlowStore";
import type { LayerGroup } from "../../types";

const groups: LayerGroup[] = ["Infrastructure", "Risk", "Opportunity", "Development"];

export const LayerControls = ({ store }: { store: DealFlowStore }) => {
  const [openGroups, setOpenGroups] = useState<Record<LayerGroup, boolean>>({
    Infrastructure: true,
    Risk: true,
    Opportunity: true,
    Development: true,
  });

  return (
    <section className="layer-controls">
      <SectionHeader eyebrow="GIS controls" title="Overlay Stack" />
      {groups.map((group) => {
        const layers = store.layers.filter((layer) => layer.group === group);
        const active = layers.filter((layer) => layer.enabled).length;
        return (
          <div className="layer-group" key={group}>
            <button className="layer-group-header" onClick={() => setOpenGroups((current) => ({ ...current, [group]: !current[group] }))}>
              <span>{group}</span>
              <small>{active}/{layers.length} active</small>
            </button>
            {openGroups[group] ? (
              <div className="layer-group-body">
                {layers.map((layer) => (
                  <div className={`layer-row ${layer.enabled ? "layer-row--active" : ""}`} key={layer.id} title={layer.description}>
                    <label>
                      <input
                        type="checkbox"
                        checked={layer.enabled}
                        onChange={(event) => store.setLayerEnabled(layer.id, event.target.checked)}
                      />
                      <span>{layer.label}</span>
                    </label>
                    <input
                      aria-label={`${layer.label} opacity`}
                      type="range"
                      min="0.15"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(event) => store.setLayerOpacity(layer.id, Number(event.target.value))}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
};
