import { useEffect, useState } from "react";
import type { FloodZone, Parcel, TransmissionLine } from "../types";

interface OverlayState {
  parcels: Parcel[];
  fortBendParcels: Parcel[];
  navarroParcels: Parcel[];
  transmission: TransmissionLine[];
  floodZones: FloodZone[];
  loading: boolean;
  error: string | null;
}

const initialState: OverlayState = {
  parcels: [],
  fortBendParcels: [],
  navarroParcels: [],
  transmission: [],
  floodZones: [],
  loading: true,
  error: null,
};

export const useOverlayData = () => {
  const [state, setState] = useState<OverlayState>(initialState);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [fortBend, navarro, transmission, flood] = await Promise.all([
          fetch("./overlays/fort-bend-parcels.json").then((r) => r.json()),
          fetch("./overlays/navarro-parcels.json").then((r) => r.json()),
          fetch("./overlays/texas-transmission.json").then((r) => r.json()),
          fetch("./overlays/flood-zones.json").then((r) => r.json()),
        ]);
        const fortBendParcels = fortBend.parcels ?? [];
        const navarroParcels = navarro.parcels ?? [];
        if (!cancelled) {
          setState({
            parcels: [...fortBendParcels, ...navarroParcels],
            fortBendParcels,
            navarroParcels,
            transmission: transmission.lines ?? [],
            floodZones: flood.zones ?? [],
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            ...initialState,
            loading: false,
            error: error instanceof Error ? error.message : "Overlay data failed to load",
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
