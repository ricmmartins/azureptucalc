<div align="center">
  <img src="https://img.shields.io/badge/Live%20Demo-ptucalc.com-blue?style=for-the-badge" alt="Live Demo" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Open%20Source-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge" alt="Open Source" />
</div>

# Azure OpenAI PTU Calculator

**Optimize your Azure OpenAI costs with intelligent PTU sizing, real-time pricing from the Azure Retail Prices API, and comprehensive cost analysis.**

👉 **Try it live at [ptucalc.com](https://www.ptucalc.com)** | 📖 **[User Guide](./docs/USER_GUIDE.md)**

---

## 🚀 Features

### Pricing & Cost Analysis
- **Live Azure pricing** — fetches real-time rates from the [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices) with intelligent fallback
- **5 pricing tiers compared** — PAYGO, PTU On-Demand, PTU Monthly Reserved, PTU 1-Year Reserved, and Spillover (hybrid) model
- **Priority Processing (GA)** — new pay-per-token tier with SLA-backed latency guarantees
- **Deployment-aware pricing** — Global, Data Zone, and Regional deployments with correct per-deployment rates

### Models & Usage
- **17 PTU-supported models** — GPT-5.4, GPT-5.3 Codex, GPT-5.2, GPT-5.2 Codex, GPT-5.1, GPT-5.1 Codex, GPT-5, GPT-5 Mini, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, GPT-4o, GPT-4o Mini, o3, o4-mini, o1, o3-mini
- **Two input methods** — KQL/TPM data from Azure Log Analytics (Method A) or direct monthly token counts (Method B)
- **Spillover strategy** — reserve base PTUs for average usage, let burst traffic spill over to PAYGO

### Smart Analysis
- **Context-aware recommendations** — PAYGO, Full PTU, or Spillover based on utilization rate and cost comparison
- **Break-even analysis** — shows when PTU becomes cost-effective vs PAYGO
- **Burst pattern detection** — identifies usage spikes and sizing implications
- **Interactive cost comparison chart** with all tiers visualized

### User Experience
- **Guided Quick Tour** — 6-step interactive walkthrough with sample data
- **Tabbed results** — Cost Analysis, Usage Patterns, and Advanced tabs
- **Sticky executive summary** — recommendation, savings, PTUs, and utilization always visible
- **Export** — download analysis as CSV or copy results as JSON
- **Built-in KQL query** — ready-to-use Log Analytics query for gathering usage data

---

## 🏗️ How Pricing Works

The calculator uses a **4-tier pricing priority system**:

1. **Custom Override** — user-entered rates (for enterprise/negotiated pricing)
2. **Live Azure API** — real-time from Azure Retail Prices API via a Vercel serverless proxy (`api/azure-pricing.js`)
3. **Official Hardcoded** — curated rates from Microsoft documentation
4. **Fallback** — conservative estimates when all else fails

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

## 📊 KQL Query for Usage Data

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

> **Note:** The `50000.0` divisor is a generic placeholder. Refer to the [official TPM-per-PTU table](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding#latest-azure-openai-models) for the exact value for your model (e.g., GPT-4.1 = 3,000 TPM/PTU, GPT-4o = 2,500 TPM/PTU).

---

## 🏁 Quick Start

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

## 📁 Project Structure

```
azureptucalc/
├── api/
│   └── azure-pricing.js          # Vercel serverless: Azure Retail Prices API proxy
├── src/
│   ├── components/
│   │   ├── ui/                   # Shadcn/UI components
│   │   ├── EnhancedResults.jsx   # Executive summary & cost breakdown
│   │   └── GuidedTour.jsx        # Interactive quick tour
│   ├── enhanced_pricing_service.js   # Pricing API client with cache & fallback
│   ├── officialPTUPricing.js         # Official PTU rates & reservation overrides
│   ├── official_token_pricing.js     # PAYGO & Priority Processing rates
│   ├── enhanced_model_config.json    # 17 PTU model definitions
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

## 🛠️ Configuration

### Environment Variables (Optional)
Set in Vercel dashboard:
```
VITE_AZURE_PRICING_API=https://prices.azure.com/api/retail/prices
VITE_CACHE_DURATION=10800000
```

---

## 🚀 Alternative Deployment Options

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

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

- 🐛 **Bug Reports** — include screenshots and browser info
- 💡 **Feature Requests** — describe the business value
- 🔧 **Code** — fork → branch → PR
- 📝 **Docs** — improve clarity, add examples

---

## ❓ FAQ

**How accurate are the pricing calculations?**
The calculator fetches live rates from the Azure Retail Prices API. Fallback data is regularly updated against official documentation. Always verify with the [Azure pricing page](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) before making purchasing decisions.

**Can I use this without KQL data?**
Yes! Use Method B (token counts) to enter your monthly input/output token consumption directly, or use Method A with estimated TPM values.

**What deployment types are supported?**
Global (multi-region, lowest cost), Data Zone (EU/US data residency), and Regional (single-region, lowest latency). Each has different PTU pricing.

**How does the spillover model work?**
Reserve base PTUs for average usage, let burst traffic spill over to PAYGO. Ideal for predictable baselines with occasional spikes (2–5× average).

**What is Priority Processing?**
A GA pay-per-token option with SLA-backed low-latency guarantees. Available for select models on Global and Data Zone deployments. Pricing varies by model.

**Is my data secure?**
All calculations happen in your browser. No usage data is sent to external servers. The app only fetches public Azure pricing information.

---

## 🆘 Support

- [GitHub Issues](https://github.com/ricmmartins/azureptucalc/issues)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [PTU Provisioned Throughput Guide](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/provisioned-throughput)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- Azure OpenAI Service team for official pricing data
- All contributors and testers
- The Azure community ❤️

---

**Made with ❤️ for the Azure community** — [ptucalc.com](https://www.ptucalc.com)