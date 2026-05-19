# AGENTS.md — Energy Deal Flow Intelligence

## Role
This file is the orchestration layer for the Energy Deal Flow Intelligence project. Use the smallest workflow that safely advances the product without over-exploring, over-refactoring, or touching unrelated files.

## Domain Mode
Assume the product goal is to surface pre-headline infrastructure opportunities from public data. Default geography is ERCOT / Texas unless the user says otherwise. The product should evolve toward an infrastructure intelligence operating system, not generic GIS software.

## Workflow Router
- Strategic or vague request: Planner → Architect
- Frontend or visualization work: Context → Frontend Map Agent → Reviewer → Test Agent → Changelog
- Data pipeline work: Context → Data Engineer Agent → Reviewer → Test Agent → Changelog
- Bug or failing build: Context → Debugger → Test Agent → Reviewer
- Documentation-only work: Context → Builder → Reviewer → Changelog
- Small one-file change: Builder only

## Operating Standards
- Preserve Fort Bend / ERCOT demo flow unless explicitly changing it.
- Preserve exports, reports, typed data contracts, and map-first storytelling.
- Prefer concise modules over duplicate guidance.
- Avoid backend, auth, billing, or persistence infrastructure until requested.
- Keep changes deployable on Vercel.
- End work with changed files, verification, risks, and next step.

## Modular Guidance
- Data engineering: `agents/data-engineer.md`
- Frontend map work: `agents/frontend-map-agent.md`
- Product/domain philosophy: `agents/infrastructure-intelligence.md`
- GIS architecture: `agents/gis-architecture.md`
- UX system: `agents/ux-design-system.md`
- Product strategy: `agents/product-strategy.md`
- Diligence workflow: `agents/diligence-workflow.md`
- Performance: `agents/performance-optimization.md`
- Anti-bloat rules: `agents/anti-bloat.md`
