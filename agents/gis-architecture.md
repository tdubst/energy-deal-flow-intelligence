# GIS Architecture

Principles:
- Treat the map as the primary analysis surface.
- Keep raw overlays traceable to source files.
- Keep cleaned overlays typed and versionable.
- Separate layer rendering from scoring/business logic.
- Show uncertainty, confidence, and source maturity clearly.

Layer model:
- Infrastructure: ERCOT projects, transmission, substations, POI context.
- Risk: flood, buildability, parcel constraints.
- Opportunity: scored parcels, watchlist assets, demand corridors.
- Development: local signals, MOUs, annexations, financing, news.
