<div align="center">
  <img src="https://img.shields.io/badge/Live%20Demo-ptucalc.com-blue?style=for-the-badge" alt="Live Demo" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</div>

# Azure OpenAI PTU Calculator

**Optimize your Azure OpenAI costs with intelligent PTU sizing, hybrid model analysis, and real-time pricing.**

---

## 🚀 Features
- **Comprehensive cost analysis:** PAYGO, PTU, and hybrid models
- **Real-time Azure pricing:** Always up-to-date with official rates
- **KQL integration:** Import usage data from Azure Log Analytics
- **13+ models supported:** GPT-4o, GPT-5, GPT-3.5, and more
- **Mobile-ready, accessible UI**
- **Export to CSV/JSON**
- **Custom pricing and regional support**

---

## 🏁 Quick Start

### Prerequisites
- Node.js 18+
- npm
- GitHub & Vercel accounts (for deployment)

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
2. Push to your GitHub
3. Go to [vercel.com](https://vercel.com), import your repo, and click **Deploy**
4. Or use Vercel CLI:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

---

## 📋 Usage Guide

### 1. Input Your Usage Data
- **Region:** Select your Azure region
- **Model:** Choose from all supported OpenAI models
- **Deployment Type:** Global, Data Zone, or Regional
- **Usage Data:**
  - **Average TPM:** Typical tokens per minute
  - **P99 TPM:** Peak (99th percentile) tokens per minute
  - **Monthly Minutes:** How many minutes per month you use the service
  - **Manual PTU Override:** (Optional) Set a specific PTU amount

### 2. Analyze Results
- **Cost Comparison:** See PAYGO, PTU, and hybrid costs
- **Break-even Analysis:** When does PTU become cheaper?
- **Utilization Metrics:** How efficiently you’d use PTUs
- **Savings Opportunities:** Potential cost reductions

### 3. Advanced Features
- **Custom Pricing:** Enter your own rates for enterprise scenarios
- **Export:** Download analysis as CSV or JSON
- **Regional Pricing:** 30+ Azure regions supported

---

## 🛠️ Deployment & Configuration

### Vercel Settings
The included `vercel.json` is pre-configured for Vite:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment Variables (Optional)
Set in Vercel dashboard for custom API endpoints or branding:
```
VITE_AZURE_PRICING_API=https://prices.azure.com/api/retail/prices
VITE_APP_TITLE=Azure OpenAI PTU Calculator
VITE_CACHE_DURATION=10800000
```

---

## 🧑‍💻 For Contributors

- **Code:** React 18, Vite, Tailwind CSS
- **Linting:** ESLint, Prettier
- **Testing:** Vitest (unit), Playwright (E2E)
- **Infra as Code:** Bicep, Docker (see `/deployment`)

---

## 🆘 Troubleshooting & FAQ

**Build fails?**
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Ensure Node.js 18+ is installed

**404 on refresh?**
- Make sure `vercel.json` has the rewrite rule above

**Environment variables not working?**
- Must start with `VITE_` and be set in Vercel dashboard

**Calculations seem off?**
- Double-check your TPM input (tokens per minute, not requests)
- Compare with Azure Portal billing data

**Need help?**
- [Open an issue](https://github.com/ricmmartins/azureptucalc/issues)
- [Vercel Docs](https://vercel.com/docs)

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- Azure OpenAI Service team for official pricing data
- All contributors and testers

---

**Happy cost-optimizing!**
- **Cost Comparison**: PAYGO vs PTU vs Hybrid pricing
- **Burst Pattern Analysis**: Understanding your usage patterns
- **Smart Recommendations**: Data-driven PTU sizing advice
- **Savings Calculations**: 1-year and 3-year reservation benefits

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and functional components
- **Vite**: Lightning-fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Shadcn/UI**: High-quality, accessible component library
- **Lucide Icons**: Beautiful, consistent icon set

### Pricing System
- **Dynamic API Integration**: Real-time pricing from Azure Retail Prices API
- **Intelligent Fallback**: Robust static pricing when API is unavailable
- **Smart Caching**: 3-hour cache with automatic refresh
- **Multi-Strategy Queries**: Multiple API query approaches for maximum coverage

### Data Processing
- **Burst Pattern Detection**: Advanced algorithms for usage pattern analysis
- **Cost Optimization Logic**: Multi-factor recommendation engine
- **Real-time Calculations**: Instant updates as parameters change
- **Validation Systems**: Input validation and error handling

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom API endpoints
VITE_AZURE_PRICING_API=https://prices.azure.com/api/retail/prices
VITE_CACHE_DURATION=10800000  # 3 hours in milliseconds
```

### Pricing Configuration
The application includes comprehensive fallback pricing for all 13 PTU models:
- GPT-5 series (GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-5 Chat)
- GPT-4 series (GPT-4o, GPT-4o Mini, GPT-4, GPT-4 Turbo)
- GPT-3.5 Turbo
- Embedding models (Ada 002, 3 Large, 3 Small)
- Whisper

## 📊 KQL Query

Use this query in Azure Log Analytics to get your usage data:

```kql
// Burst-Aware Azure OpenAI PTU Sizing Analysis
// Run this query in Azure Monitor Log Analytics for accurate capacity planning

let window = 1m;           // granularity for burst detection
let p = 0.99;             // percentile for burst sizing
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
| extend RecommendedPTU = max_of(AvgPTU, P99PTU)  // higher value covers bursts
| project AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU
```

## 🎯 Business Value

### Cost Optimization
- **Accurate Sizing**: Use real usage data instead of guesswork
- **Hybrid Intelligence**: Optimal base PTU + spillover calculations
- **Reservation Planning**: 1-year vs 3-year commitment analysis
- **Risk Reduction**: Avoid over-provisioning for bursty workloads

### Decision Support
- **Data-Driven**: Recommendations based on actual Azure usage patterns
- **Scenario Analysis**: Compare multiple pricing approaches
- **Burst Handling**: Understand and plan for traffic spikes
- **ROI Calculations**: Clear financial impact of different approaches

### Enterprise Ready
- **Professional Interface**: Clean, intuitive design for business users
- **Comprehensive Documentation**: Built-in explanations and guidance
- **Scalable Architecture**: Handles enterprise-scale usage analysis
- **Reliable Pricing**: Robust API integration with intelligent fallbacks

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

#### Method 1: GitHub Integration
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ricmmartins/azureptucalc.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Vite configuration
   - Click "Deploy"

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Method 3: Manual Upload
```bash
# Build the project
npm run build

# Go to vercel.com and drag/drop the dist folder
```

### Option 2: Static Website Hosting
Deploy to any static hosting service (Netlify, GitHub Pages):

```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting service
```

### Option 3: Azure Static Web Apps
Perfect for Azure-native deployment:

```bash
# Install Azure CLI
az login

# Create Static Web App
az staticwebapp create \
  --name azureptucalc \
  --resource-group rg-azureptucalc \
  --source https://github.com/ricmmartins/azureptucalc \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

### Option 3: Azure Container Apps
For containerized deployment:

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

## 📁 Project Structure

```
azure-openai-ptu-estimator/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   └── ui/            # Shadcn/UI components
│   ├── enhanced_pricing_service.js  # Pricing API service
│   ├── ptu_supported_models.json   # PTU model definitions
│   ├── App.jsx            # Main application component
│   ├── App.css            # Application styles
│   └── main.jsx           # Application entry point
├── deployment/            # Deployment configurations
│   ├── azure-static-web-apps.yml
│   ├── dockerfile
│   └── bicep/            # Infrastructure as Code
├── docs/                 # Additional documentation
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details. Here's how you can help:

### 🐛 **Bug Reports**
- Use the issue templates
- Include screenshots and browser info
- Provide KQL query examples if relevant

### 💡 **Feature Requests**
- Check existing issues first
- Describe the business value
- Include mockups if possible

### 🔧 **Code Contributions**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### 📝 **Documentation**
- Improve README clarity
- Add more use case examples
- Enhance KQL query documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [PTU Guide](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/provisioned-throughput)
- [KQL Reference](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)

### Community
- [GitHub Issues](https://github.com/ricmmartins/azureptucalc/issues)
- [GitHub Discussions](https://github.com/ricmmartins/azureptucalc/discussions)

## ❓ FAQ

### **Q: How accurate are the pricing calculations?**
A: The calculator uses official Azure Retail Prices API with intelligent fallbacks. Pricing is updated every 3 hours and includes all current PTU models and regions.

### **Q: Can I use this without KQL data?**
A: Yes! The calculator includes estimation guides for users without Azure Monitor access. You can input estimated TPM values based on your usage patterns.

### **Q: What's the difference between deployment types?**
A: Global deployments offer multi-region failover but cost 20-40% more. Regional deployments provide lowest latency. Data Zone deployments ensure compliance within EU/US boundaries.

### **Q: How does the hybrid model work?**
A: Reserve base PTUs for average usage, let burst traffic "spill over" to PAYGO. Ideal for predictable baselines with occasional spikes (2-5x average).

### **Q: Is my data secure?**
A: All calculations happen in your browser. No usage data is sent to external servers. The app only fetches public Azure pricing information.

---

**Made with ❤️ for the Azure community**

*Optimize your Azure OpenAI costs with confidence using real data and intelligent analysis.*

