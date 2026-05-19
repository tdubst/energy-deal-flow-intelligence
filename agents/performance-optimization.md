# Performance Optimization

Rules:
- Preserve functionality before optimizing.
- Profile obvious bottlenecks first: map FPS, hover latency, layer toggles, and bundle size.
- Memoize expensive layer rendering and derived data.
- Lazy-load heavy overlays when density grows.
- Prefer progressive detail by zoom over rendering everything at every level.
- Keep animation restrained and GPU-friendly.
