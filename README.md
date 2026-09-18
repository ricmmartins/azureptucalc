<div align="center">
  <img src="https://img.shields.io/badge/Live%20Demo-ptucalc.com-blue?style=for-the-badge" alt="Live Demo" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Open%20Source-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge" alt="Open Source" />
</div>

# Microsoft Foundry PTU Calculator

**Optimize your Azure OpenAI costs with intelligent PTU sizing, real-time pricing from the Azure Retail Prices API, and comprehensive cost analysis.**

**Try it live at [ptucalc.com](https://www.ptucalc.com)** | **[User Guide](./docs/USER_GUIDE.md)** | **[Changelog](./CHANGELOG.md)**

---

## Features

### Pricing & Cost Analysis
- **Live Azure pricing** — fetches real-time rates from the [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices) with intelligent fallback
- **5 pricing tiers compared** — PAYGO, PTU On-Demand, PTU Monthly Reserved, PTU 1-Year Reserved, and Spillover (hybrid) model
- **Priority Processing scenarios** — choose the Priority share of input and output tokens using verified published rates; compare Standard, mixed, and 100% Priority PAYGO
- **Deployment-aware pricing** — Global, Data Zone, and Regional deployments with correct per-deployment rates

### Models & Usage
- **14 current PTU-supported models** — GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna, GPT-5.5, GPT-5.4, GPT-5.4 Mini, GPT-5.3 Codex, GPT-5.2, GPT-5.2 Codex, GPT-5.1, GPT-5.1 Codex, GPT-5, GPT-5 Mini, and o3
- **Two input methods** — KQL/TPM data from Azure Log Analytics (Method A) or direct monthly token counts (Method B)
- **Prompt Cache Hit Rate** — factor in Azure's prompt caching to reduce effective input tokens for more accurate PTU sizing
- **Region-aware model filtering** — model picker shows only models available in the selected region
- **Spillover strategy** — reserve base PTUs for average usage, let burst traffic spill over to PAYGO

### Smart Analysis
- **Latency-aware recommendations** — compare actual costs across selected PAYGO, PTU terms, and available spillover; qualify the lowest-cost option for latency instead of applying utilization thresholds
- **Break-even analysis** — shows when PTU becomes cost-effective vs PAYGO
- **Burst pattern detection** — identifies usage spikes and sizing implications
- **Interactive cost comparison chart** with all tiers visualized

### Optimization & Throttling Prevention (NEW)
- **429 Risk Score** — real-time throttling risk gauge (0-100) with prioritized mitigation checklist
- **max_tokens Optimizer** — concurrency impact analysis showing how tightening max_tokens increases effective capacity
- **Leaky Bucket Simulation** — interactive visualization of Azure's rate-limiting algorithm with burst testing
- **Spillover Architecture Comparison** — side-by-side analysis of PTU→PayGo, PTU→Priority Processing, and APIM AI Gateway patterns
- **Retry & Backoff Calculator** — configurable retry strategy with exponential backoff + jitter, with code snippets (Python, JS, C#)
- **Right-Size Wizard** — 4-step guided wizard for workload analysis, model selection, PTU sizing, and applying recommendations

### User Experience
- **"Do I Need PTU?" Qualification Wizard** — guided 60-second assessment for new users to determine if PTU is relevant before diving into the calculator
- **Guided Quick Tour** — 8-step interactive walkthrough with sample data (now includes Optimization tab)
- **Tabbed results** — Cost Analysis, Usage Patterns, Optimization, and Advanced tabs
- **Sticky executive summary** — recommendation, savings, PTUs, and utilization always visible
- **Export** — download analysis as CSV or copy results as JSON
- **Built-in KQL query** — ready-to-use Log Analytics query for gathering usage data

---

## How Pricing Works

The calculator resolves PAYGO pricing in this order:

1. **Custom Override** — user-entered Standard rates (for enterprise/negotiated pricing); not a Priority override
2. **Live Azure API** — a complete quote matching the model, region, deployment, and applicable context tier, via a Vercel serverless proxy (`api/azure-pricing.js`)
3. **Published Rates** — curated rates for the exact model and deployment from the Azure pricing page
4. **Unavailable** — retain PTU sizing but block calculations that require missing or unsupported prices; never substitute another model or deployment's price or silently reset the selected shares

GPT-5.6 Standard PAYGO rates cover **short-context pricing**, not long-context or cache billing. Priority uses separately verified published input/output prices, never an arbitrary premium or cross-deployment fallback. See the [price scope and missing-rate guidance](docs/USER_GUIDE.md#paygo-price-scope-and-missing-rates).

### Standard / Priority scenarios

- **Priority token share** applies the same percentage to input **and** output tokens, not to requests. For example, 25% prices one quarter of each token category at Priority rates and the remainder at Standard rates. PTU sizing is unchanged.
- **0% remains Standard**. **100% Priority** can be priced without a Standard quote when a supported Priority quote is available. Intermediate mixes need both quotes.
- **Spillover Priority share** is selected separately for the estimated PAYGO overflow; it does not inherit the main PAYGO mix.
- Custom pricing remains **Standard only**. A mixed scenario can combine custom Standard with published Priority, with both sources disclosed. There is no Priority custom-rate UI in this iteration.
- Availability follows [Microsoft Learn Priority Processing](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/priority-processing), reviewed September 18, 2026: no Regional or EU Data Zone support; GPT-5.6 Luna is unsupported; Global Sol/Terra support is verified. Published Data Zone Sol/Terra rates do not establish availability: these models are omitted from the Data Zone availability table, so the calculator fails closed.
- Priority may downgrade to Standard at ramp limits, peak demand, or applicable long-context limits. A latency-critical choice produces qualified recommendations, not a blanket SLA or routing guarantee.
- Spillover compares monthly and 1-year reserved PTU bases rounded to the model/deployment minimum and increment, plus the same estimated overflow priced using the actual monthly input/output token split and its separately selected Priority share. Annual-base costs are shown as monthly equivalents. The **P99-based extrapolation is a planning approximation**, not measured monthly overflow traffic or validation of routing/service-tier delivery.

The recommendation compares actual available costs for selected PAYGO, PTU on-demand, monthly and 1-year reservations, and spillover with either reservation term. PTU and spillover labels identify the selected term (for example, **PTU Monthly Reservation** or **PTU 1-Year Reservation**). If the lowest-cost option includes Standard processing in its primary PAYGO mix or spillover overflow while latency-critical is selected, the result requires **review**: its recommended monthly cost is `null`, while its economic cost leader is retained.

**Savings** remain the selected PAYGO cost versus the **1-year PTU reservation monthly equivalent**, not savings from whichever strategy is recommended. **Break-even utilization** continues to compare against the **monthly PTU reservation** and is not clipped at 100%; a higher result means the estimated break-even point exceeds that capacity.

CSV/JSON reports preserve the selected shares, latency flag, quote sources/context/dates, weighted rates, available baselines, spillover estimate, and the same recommendation shown in the calculator. Unavailable costs remain `null` in JSON and `N/A` in CSV, not zero.

Live pricing is **cached for 3 hours** and includes:
- PTU hourly on-demand rates per deployment type
- PTU reservation prices (1-Month and 1-Year terms)
- PAYGO per-token rates (input/output) per model and deployment

### Azure PTU Reservation Tiers

Azure offers **two** PTU reservation options (there is no 3-year PTU reservation):

| Reservation | Discount vs On-Demand | Commitment |
|---|---|---|
| Monthly (1-Month) | ~64% off | No long-term commitment |
| 1-Year | ~70% off | 1-year commitment |

---

## KQL Query for Usage Data

Use this query in Azure Monitor Log Analytics to get your TPM data:

```kql
let window = 1m;
let p = 0.99;
AzureMetrics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| where MetricName in ("ProcessedPromptTokens", "ProcessedCompletionTokens")
| where TimeGenerated >= ago(7d)
| summarize Tokens = sum(Total) by bin(TimeGenerated, window)
| summarize
    AvgTPM = avg(Tokens),
    P99TPM = percentile(Tokens, p),
    MaxTPM = max(Tokens)
| extend
    AvgPTU = ceiling(AvgTPM / 50000.0),
    P99PTU = ceiling(P99TPM / 50000.0),
    MaxPTU = ceiling(MaxTPM / 50000.0)
| extend RecommendedPTU = max_of(AvgPTU, P99PTU)
| project AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU
```

> **Note:** The `50000.0` divisor is a generic placeholder. Refer to the [official TPM-per-PTU table](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/provisioned-throughput-sizing#latest-azure-openai-models) for the exact value for your model (e.g., GPT-4.1 = 3,000 TPM/PTU, GPT-4o = 2,500 TPM/PTU).

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Local Development
```bash
git clone https://github.com/ricmmartins/azureptucalc.git
cd azureptucalc
npm install
npm run dev
# Visit http://localhost:5173
```

### Validate Changes

Run unit tests with `npm run test:ci`. To validate Priority processing scenarios in the browser, build the app first, then run the Node test runner:

```powershell
npm run build
node --test tests\priority-processing.browser.mjs
```

The browser tests use Playwright and Vite preview. On Windows, they use installed Microsoft Edge (`msedge`) if bundled Chromium is unavailable. Set `PLAYWRIGHT_CHANNEL` to override the browser channel.

### Deploy to Vercel (Recommended)
1. Fork or clone this repo
2. Go to [vercel.com](https://vercel.com), import your repo, and click **Deploy**
3. Or use Vercel CLI:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

> The included `vercel.json` is pre-configured. The `api/azure-pricing.js` serverless function handles Azure Retail Prices API proxying to avoid CORS issues.

---

## Project Structure

```
azureptucalc/
├── api/
│   └── azure-pricing.js          # Vercel serverless: Azure Retail Prices API proxy
├── src/
│   ├── components/
│   │   ├── ui/                   # Shadcn/UI components
│   │   ├── QualificationWizard.jsx # "Do I Need PTU?" guided assessment
│   │   ├── EnhancedResults.jsx   # Executive summary & cost breakdown
│   │   ├── GuidedTour.jsx        # Interactive quick tour
│   │   ├── MaxTokensOptimizer.jsx    # max_tokens concurrency optimizer
│   │   ├── LeakyBucketVisualization.jsx  # Interactive leaky bucket simulation
│   │   ├── ThrottlingAdvisor.jsx     # 429 Risk Score gauge
│   │   ├── SpilloverComparison.jsx   # Spillover architecture comparison
│   │   ├── RetryCalculator.jsx       # Retry & backoff calculator
│   │   └── RightSizeWizard.jsx       # 4-step PTU right-sizing wizard
│   ├── enhanced_pricing_service.js   # Pricing API client with cache & fallback
│   ├── officialPTUPricing.js         # Official PTU rates & reservation overrides
│   ├── official_token_pricing.js     # Standard PAYGO rates
│   ├── priorityPricing.js            # Verified Priority rates and availability
│   ├── enhanced_model_config.json    # PTU sizing definitions
│   ├── ptu_supported_models.json     # Model support matrix
│   ├── external_pricing_config.json  # Fallback pricing config
│   ├── ExternalPricingService.js     # Config-based pricing service
│   ├── App.jsx                       # Main application
│   └── main.jsx                      # Entry point
├── deployment/                   # Docker, Bicep, Azure Static Web Apps configs
├── docs/                         # User guide
├── vercel.json                   # Vercel deployment config
└── package.json
```

---

## Configuration

### Environment Variables (Optional)
Set in Vercel dashboard:
```
VITE_AZURE_PRICING_API=https://prices.azure.com/api/retail/prices
VITE_CACHE_DURATION=10800000
```

---

## Alternative Deployment Options

### Azure Static Web Apps
```bash
az staticwebapp create \
  --name azureptucalc \
  --resource-group rg-azureptucalc \
  --source https://github.com/ricmmartins/azureptucalc \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

### Docker / Azure Container Apps
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

- **Bug Reports** — include screenshots and browser info
- **Feature Requests** — describe the business value
- **Code** — fork → branch → PR
- **Docs** — improve clarity, add examples

---

## FAQ

**How accurate are the pricing calculations?**
The calculator fetches live rates from the Azure Retail Prices API. Fallback data is regularly updated against official documentation. Always verify with the [Azure pricing page](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) before making purchasing decisions.

**Can I use this without KQL data?**
Yes! Use Method B (token counts) to enter your monthly input/output token consumption directly, or use Method A with estimated TPM values.

**What deployment types are supported?**
Global (multi-region, lowest cost), Data Zone (EU/US data residency), and Regional (single-region, lowest latency). Each has different PTU pricing.

**How does the spillover model work?**
Reserve base PTUs for average usage, let burst traffic spill over to PAYGO. Ideal for predictable baselines with occasional spikes (2–5× average).

**What is Priority Processing?**
A pay-per-token option with model-specific latency targets, available only for documented Global and US Data Zone model/region combinations. Priority can downgrade to Standard at ramp, peak-demand, or long-context limits; it is not a blanket SLA guarantee. Pricing uses verified published rates for the selected deployment.

**Is my data secure?**
All calculations happen in your browser. No usage data is sent to external servers. The app only fetches public Azure pricing information.

---

## Support

- [GitHub Issues](https://github.com/ricmmartins/azureptucalc/issues)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/foundry/openai/)
- [PTU Provisioned Throughput Guide](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgements

- Azure OpenAI Service team for official pricing data
- Ahmed Geedi for the PTU sizing & throttling prevention best practices document that inspired the Optimization tab
- All contributors and testers
- The Azure community

---

**Made with love for the Azure community** — [ptucalc.com](https://www.ptucalc.com)