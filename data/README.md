# Real Overlay Data

This folder separates source downloads from processed map-ready overlays.

## Raw Sources

Raw public files should be saved under `raw/` exactly as downloaded. Do not edit raw files in place.

## Processed Overlays

Map-ready subsets should be saved under `processed/` after filtering, clipping, simplifying, and validating.

## First MVP Geography

The first real overlay target is Fort Bend County around Avalon BESS. The initial layers are:

- Fort Bend CAD parcel and shapefile downloads
- HIFLD electric transmission lines
- FEMA NFHL flood hazard zones

## Data Handling Notes

- Track source URL, fetch date, and license/disclaimer in `sources.json`.
- Treat parcel owner information carefully. Fort Bend CAD warns that confidential owner and situs information cannot be disclosed.
- Use these overlays for screening and visualization only, not legal, engineering, or survey decisions.
