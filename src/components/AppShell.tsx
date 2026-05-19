import type { ReactNode } from "react";

export const AppShell = ({
  left,
  map,
  right,
  insightMode = false,
}: {
  left: ReactNode;
  map: ReactNode;
  right: ReactNode;
  insightMode?: boolean;
}) => (
  <main className={`app-shell ${insightMode ? "app-shell--insight" : ""}`}>
    <aside className="left-sidebar">{left}</aside>
    <section className="map-column">{map}</section>
    <aside className="right-panel">{right}</aside>
  </main>
);
