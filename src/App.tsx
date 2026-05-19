import { AppShell } from "./components/AppShell";
import { MapViewport } from "./features/map/MapViewport";
import { RightReportPanel } from "./features/reports/RightReportPanel";
import { LeftSidebar } from "./features/sidebar/LeftSidebar";
import { useOverlayData } from "./hooks/useOverlayData";
import { useDealFlowStore } from "./store/useDealFlowStore";

export default function App() {
  const store = useDealFlowStore();
  const overlays = useOverlayData();

  return (
    <AppShell
      insightMode={store.insightMode}
      left={<LeftSidebar store={store} />}
      map={<MapViewport store={store} overlays={overlays} />}
      right={<RightReportPanel store={store} parcels={overlays.parcels} />}
    />
  );
}
