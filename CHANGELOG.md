# Changelog

All notable changes to the Azure OpenAI PTU Calculator are documented in this file.

## [2.6.0] - 2026-07-07

### Added
- **Qualification Wizard ("Do I Need PTU?")** — new guided onboarding flow for first-time visitors who don't know what PTU is or whether they need it:
  - 5-step assessment: familiarity level, monthly spend, usage patterns, and priorities
  - Clear recommendation with confidence level (PAYGO, PTU, or Spillover)
  - Contextual PTU education (explains concepts only when relevant to the user)
  - Potential savings percentage displayed on result screen
  - "Do I Need PTU?" button in header for returning users to re-access the wizard
- **Improved first-time experience** — wizard replaces the previous WelcomeModal as the entry point for new visitors

### Changed
- Header now shows two quick-action buttons: "Do I Need PTU?" and "Quick Tour"
- First-time visitor flow: Qualification Wizard → Calculator (previously: Welcome Modal → Calculator)

---

### Added
- **User Guide link in footer** — direct link to comprehensive documentation
- **Changelog link in footer** — direct link to this changelog
- **CHANGELOG.md** — this file, tracking all notable changes
- **Improved Quick Tour** — expanded from 7 to 8 steps, now covers the Optimization tab and reorders Export as the final step

### Changed
- Updated README.md with Optimization features, new components in project structure, and acknowledgements
- Updated USER_GUIDE.md with Optimization tab documentation and new references
- Removed all emoji icons from README headings (kept only shields.io badges)
- Updated repo description on GitHub

### Fixed
- Priority Processing model list corrected to match official Microsoft documentation (removed GPT-4.1 Mini and o4-mini which are not officially supported)
- CHANGELOG dates corrected to match actual git history (project started 2025-09-08)
- README Azure OpenAI docs URL updated from `/ai-services/` to `/foundry/`
- Quick Tour card widened from 20rem to 24rem to prevent button text overflow
- "Try with Sample Data" button moved to full-width row to avoid clipping

### Removed
- `.playwright-mcp/` debug logs
- `playwright.config.mjs` (referenced non-existent `./e2e` directory)
- `scripts/` local pricing test utilities

---

## [2.4.0] - 2026-06-30

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

## [2.3.0] - 2026-06-08

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

## [2.2.0] - 2026-04-14 – 2026-04-20

### Added
- Google Analytics (GA4) tracking snippet for usage metrics
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

## [2.0.0] - 2026-02-20 – 2026-03-25

### Added
- **Priority Processing pricing tier** — GA pay-per-token option with SLA-backed latency
- **Interactive Analytics Dashboard** — 4-tab dashboard with cost breakdown, usage patterns, reservation analysis, and Priority Processing comparison
- **Prompt Cache Hit Rate** — factor in Azure's prompt caching to reduce effective input tokens
- **Spillover (hybrid) pricing** — base PTUs + PAYGO overflow strategy
- **Tabbed results layout** — Cost Analysis, Usage Patterns, and Advanced tabs
- **Sticky executive summary** — recommendation, savings, PTUs always visible
- **Welcome Modal & Guided Tour** — onboarding system with interactive walkthrough
- **Live Pricing Data Status** — transparency section showing data source and freshness

### Changed
- Complete README rewrite with accurate feature list and pricing info
- Complete User Guide rewrite with current features and pricing tiers
- Rewrote Interactive Analytics Dashboard with all 4 tabs

### Fixed
- Deep audit: calculation bugs, labels, and pricing consistency
- PAYGO pricing guard: never use incorrect values from live API
- Welcome Modal and Guided Tour text accuracy
- All findings from deep 4-agent code audit
- Break-even analysis and burst pattern detection
- GPT-5 series pricing corrected to match official Azure docs

---

## [1.7.0] - 2025-12-22

### Added
- **GPT-5.1 and GPT-5.2** model support
- Comprehensive production fixes and improvements
- Pricing validation system
- **Live Azure API v2** — Vercel serverless function for Azure Retail Prices API proxy

### Fixed
- PAYG Token Usage section validation
- Input/Output Ratio clarity and documentation
- JSON syntax error in corrected_pricing_data.json
- Vercel build errors resolved

---

## [1.6.0] - 2025-10-27

### Added
- **Azure Government regions** support
- Improved custom pricing for government-specific scenarios

### Fixed
- Government regions model availability per Microsoft documentation
- Government regions warning message and alert icon alignment
- Custom Pricing tooltip for government regions

---

## [1.5.0] - 2025-10-23 – 2025-10-24

### Added
- **GPT-4.1, GPT-4.1-mini, and GPT-4.1-nano** models with correct throughput values
- Comprehensive user guide (docs/USER_GUIDE.md)

### Fixed
- PAYGO pricing for GPT-4.1-nano and GPT-4o to match official Azure pricing

---

## [1.4.0] - 2025-10-09 – 2025-10-14

### Added
- Unit tests (vitest) and E2E scaffold (playwright)
- GPT-5 series reservation and PAYGO entries from MS docs
- GitHub repo link in footer
- Left-aligned help button with modal popup for throughput docs

### Changed
- Open source release cleanup — removed backup files, old tests, unused docs
- Unified README with deployment, usage, and troubleshooting
- Updated CONTRIBUTING.md for open source onboarding

### Fixed
- PTU pricing: global deployment base rate, reservation override, renamed Hybrid to Spillover
- Official PTU fallback rates enforced, global multiplier=1
- Duplicate import and identifier collision in official_token_pricing.js
- PTU monthly/yearly calculations aligned with Azure official pricing

---

## [1.3.0] - 2025-09-30 – 2025-10-02

### Added
- **Export functionality** — CSV and JSON export of analysis results
- **External pricing configuration** — versioned fallback pricing data
- **Interactive Analytics Dashboard** — first implementation
- **Welcome Modal & Guided Tour** — onboarding system with interactive walkthrough
- **User Guide** — first version (docs/USER_GUIDE.md)

### Fixed
- Z-index conflicts between tour controls and modal overlays
- Tour controls positioning restored to top-right corner

---

## [1.2.0] - 2025-09-14 – 2025-09-23

### Added
- **Dynamic pricing with live Azure API** — real-time rates from Azure Retail Prices API
- **API transparency** — shows specific endpoint and data source information
- **Model-specific throughput per PTU** — accurate TPM/PTU values per model
- **Official PTU pricing alignment** — US$1/PTU-hour with accurate discount calculations
- **Model and deployment-specific PTU minimums** — enforced per official sizing table

### Fixed
- Region model counts and Pro Tip formatting
- PAYG costs recalculated using official per-token rates
- Microsoft Learn compliance fixes

---

## [1.1.0] - 2025-09-12

### Added
- **Interactive Analytics Dashboard** — dynamic cost visualization
- **Microsoft Clarity** analytics integration

### Fixed
- Alert spacing with flex layout improvements

---

## [1.0.0] - 2025-09-08

### Added
- Initial release of Azure OpenAI PTU Calculator
- Basic PTU cost comparison (PAYGO vs PTU)
- **KQL query generator** — ready-to-use Log Analytics query for usage data
- **3 deployment types** — Global, Data Zone, and Regional
- **30+ Azure regions** supported
- Footer with Azure community message
- README, CONTRIBUTING.md, and issue templates
- Vercel deployment configuration
- MIT License

---

## Links

- **Live App:** [ptucalc.com](https://www.ptucalc.com)
- **Source:** [github.com/ricmmartins/azureptucalc](https://github.com/ricmmartins/azureptucalc)
- **User Guide:** [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **Issues:** [GitHub Issues](https://github.com/ricmmartins/azureptucalc/issues)
