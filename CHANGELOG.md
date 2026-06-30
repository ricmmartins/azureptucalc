# Changelog

All notable changes to the Azure OpenAI PTU Calculator are documented in this file.

## [Unreleased]

### Added
- **User Guide link in footer** — direct link to comprehensive documentation
- **CHANGELOG.md** — this file, tracking all notable changes
- **Improved Quick Tour** — expanded from 7 to 8 steps, now covers the Optimization tab and reorders Export as the final step

### Changed
- Updated README.md with Optimization features, new components in project structure, and acknowledgements
- Updated USER_GUIDE.md with Optimization tab documentation

---

## [2.5.0] - 2026-06-30

### Added
- **Optimization tab** — new 4th results tab with 6 PTU throttling prevention features:
  - **429 Risk Score** — real-time circular gauge (0-100) analyzing configuration for throttling risk with prioritized mitigation checklist
  - **max_tokens Concurrency Optimizer** — shows how tightening max_tokens increases effective concurrent capacity
  - **Interactive Leaky Bucket Simulation** — real-time visualization of Azure's rate-limiting algorithm with burst testing
  - **Spillover Architecture Comparison** — side-by-side analysis of PTU→PayGo, PTU→Priority Processing, and APIM AI Gateway patterns
  - **Retry & Backoff Calculator** — configurable retry strategy with exponential backoff + jitter, with code snippets (Python, JS, C#)
  - **Right-Size Wizard** — 4-step guided wizard for workload analysis, model selection, PTU sizing, and applying recommendations
- **Workload Configuration panel** — shared inputs (max_tokens, actual output, prompt tokens, retry/streaming/latency/APIM toggles) at top of Optimization tab

### Fixed
- LeakyBucket simulation no longer adds rejected (429'd) requests to utilization
- RightSizeWizard model keys now match canonical lowercase format (`gpt-5.5` not `GPT-5.5`)
- RightSizeWizard deployment values use correct camelCase format (`dataZone` not `Data Zone`)
- ThrottlingAdvisor no longer shows "Critical Risk" when no data entered yet
- Division by zero guard in LeakyBucket when capacityPerSecond is 0

---

## [2.4.0] - 2026-06-08

### Added
- **GPT-5.5 and GPT-5.4 Mini** PTU model support
- Updated model configuration with latest throughput values

### Fixed
- Critical calculation bugs and data inconsistencies
- Broken Microsoft Learn URLs (`ai-foundry` → `foundry`)
- 5 deferred issues from previous audits

### Changed
- Removed dead code and unused files
- Updated README and User Guide with new models and prompt cache rate feature

---

## [2.3.0] - 2026-04-20

### Added
- Google Analytics (GA4) tracking snippet for usage metrics

---

## [2.2.0] - 2026-04-14 – 2026-04-16

### Added
- **Model selector in Step 1** — KQL query section now includes model picker
- **Learn-more modal** — full model reference table with TPM/PTU values
- **Foundry diagnostic settings link** — for new deployments needing Log Analytics setup
- Consolidated model selector to Step 1 with read-only badge display in Step 2

### Fixed
- KQL query auto-populates from selected model (both standard and wizard modes)
- Quick Tour updated to match new model-first UI flow
- 22 bugs fixed across 3 comprehensive code audit rounds
- Runtime crash from temporal dead zone in keyboard shortcut refs
- Unicode escape literals replaced with actual characters in modal

---

## [2.1.0] - 2026-04-13

### Added
- **Output token weighting** — Phase 1 implementation for accurate PTU calculations (output tokens cost more than input tokens)

### Fixed
- 10 bugs found during codebase audit
- Calculation accuracy issues in ExportService and App.jsx
- Critical export bugs and gov-region model validation
- 17 medium/low issues from comprehensive code review

---

## [2.0.0] - 2026-03-24 – 2026-03-25

### Added
- **Priority Processing pricing tier** — GA pay-per-token option with SLA-backed latency
- **Interactive Analytics Dashboard** — 4-tab dashboard with cost breakdown, usage patterns, reservation analysis, and Priority Processing comparison
- **Prompt Cache Hit Rate** — factor in Azure's prompt caching to reduce effective input tokens
- **Spillover (hybrid) pricing** — base PTUs + PAYGO overflow strategy
- **Welcome Modal & Guided Tour** — onboarding system with 7-step interactive walkthrough
- **Export functionality** — CSV and JSON export of analysis results
- **Live Pricing Data Status** — transparency section showing data source and freshness
- Project context file for future Copilot sessions

### Changed
- Complete README rewrite with accurate feature list and pricing info
- Complete User Guide rewrite with current features and pricing tiers
- Rewrote Interactive Analytics Dashboard with all 4 tabs

### Fixed
- Deep audit: calculation bugs, labels, and pricing consistency
- PAYGO pricing guard: never use incorrect values from live API
- Welcome Modal and Guided Tour text accuracy
- All findings from deep 4-agent code audit

---

## [1.5.0] - 2026-03-19 – 2026-03-21

### Added
- **Dynamic pricing with live Azure API** — real-time rates from Azure Retail Prices API via Vercel serverless proxy
- **API transparency** — shows specific endpoint and data source information
- **Model-specific throughput per PTU** — accurate TPM/PTU values per model
- **Official PTU pricing alignment** — US$1/PTU-hour with accurate discount calculations
- **Model and deployment-specific PTU minimums** — enforced per official sizing table
- **External pricing configuration** — fallback pricing system with versioned data

### Fixed
- Region model counts and Pro Tip formatting
- PAYG costs recalculated using official per-token rates

---

## [1.0.0] - 2026-03-17 – 2026-03-18

### Added
- Initial release of Azure OpenAI PTU Calculator
- **19 PTU-supported models** — GPT-5.5, GPT-5.4, GPT-4.1, GPT-4o, o3, o4-mini, and more
- **KQL query generator** — ready-to-use Log Analytics query for usage data
- **3 deployment types** — Global, Data Zone, and Regional
- **30+ Azure regions** supported
- **Cost comparison** — PAYGO vs PTU On-Demand vs Monthly vs 1-Year reservations
- **Context-aware recommendations** — PAYGO, Full PTU, or Spillover based on utilization
- **Microsoft Clarity analytics** integration
- Vercel deployment configuration
- Docker and Azure Static Web Apps deployment options
- MIT License

---

## Links

- **Live App:** [ptucalc.com](https://www.ptucalc.com)
- **Source:** [github.com/ricmmartins/azureptucalc](https://github.com/ricmmartins/azureptucalc)
- **User Guide:** [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **Issues:** [GitHub Issues](https://github.com/ricmmartins/azureptucalc/issues)
