[![Live Demo](https://img.shields.io/badge/Live%20Demo-ptucalc.com-blue?style=for-the-badge)](https://ptucalc.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

# Azure OpenAI PTU Estimator

🚀 **Enterprise-grade tool for optimizing Azure OpenAI costs through intelligent PTU sizing and burst pattern analysis**

Optimize your Azure OpenAI costs by analyzing real usage patterns and comparing PAYGO, PTU, and hybrid pricing models with comprehensive KQL integration and dynamic pricing from Azure APIs.

## 🎯 Key Features

### 📊 **Comprehensive Cost Analysis**
- **Real-time Pricing**: Dynamic pricing from Azure Retail Prices API with intelligent fallback
- **13 PTU Models**: Complete support for all PTU-enabled models including GPT-5 series
- **3 Deployment Types**: Global, Data Zone, and Regional deployment options
- **Hybrid Model Intelligence**: Smart base PTU sizing with spillover cost calculations

### 🔍 **Advanced KQL Integration**
- **Complete KQL Support**: All 7 KQL outputs (AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU)
- **Burst Pattern Analysis**: Intelligent detection of usage patterns (Steady/Bursty/Spiky)
- **Smart Recommendations**: Data-driven PTU sizing based on actual Azure usage data
- **Cost Optimization**: Hybrid model recommendations with overflow calculations

### 🎨 **Professional User Experience**
- **Intuitive Interface**: Clean, enterprise-ready design with comprehensive explanations
- **Educational Content**: Built-in explanations for PTU concepts and hybrid models
- **Real-time Updates**: Live calculations as you input KQL results
- **Mobile Responsive**: Works perfectly on desktop and mobile devices

## 🔧 Technical Features

### 🎯 **Intelligent Calculations**
- **Burst Detection Algorithm**: Analyzes P99 vs Average TPM ratios
- **Hybrid Model Optimization**: Smart base PTU + spillover calculations  
- **Real-time Pricing**: Azure Retail Prices API integration with 3-hour caching
- **Multi-scenario Analysis**: PAYGO vs PTU vs Hybrid comparisons

### 📊 **Data Processing**
- **7-Parameter KQL Support**: Complete Azure Monitor integration
- **Pattern Recognition**: Steady/Bursty/Spiky usage classification
- **Cost Efficiency Metrics**: Utilization rates and ROI calculations
- **Reservation Planning**: 1-year vs 3-year commitment analysis

### 🎨 **User Experience**
- **Progressive Disclosure**: Clean interface with contextual help
- **Educational Content**: Built-in PTU concept explanations
- **Mobile-First Design**: Responsive across all devices
- **Accessibility**: WCAG compliant with screen reader support

## 🎯 Use Cases

### 👥 **For Azure Architects**
- Size PTU deployments based on real usage data
- Plan for burst traffic and seasonal variations
- Optimize costs across multiple Azure OpenAI deployments

### 💼 **For Finance Teams**
- Calculate ROI of PTU reservations vs PAYGO
- Budget planning for Azure OpenAI costs
- Understand financial impact of different deployment strategies

### 🔧 **For DevOps Teams**
- Monitor and optimize existing Azure OpenAI usage
- Plan capacity for new applications
- Implement hybrid models for cost-effective scaling

### 📊 **For Data Scientists**
- Understand token consumption patterns
- Optimize model usage for cost efficiency
- Plan for production workload scaling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser
- Azure subscription (for KQL queries)

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/azure-openai-ptu-estimator.git
cd azure-openai-ptu-estimator

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 How to Use

### Step 1: Get Your Token Data
1. Navigate to your Azure Log Analytics workspace
2. Run the provided KQL query to analyze your usage patterns
3. Copy the results: `AvgTPM`, `P99TPM`, `MaxTPM`, `AvgPTU`, `P99PTU`, `MaxPTU`, `RecommendedPTU`

### Step 2: Input Parameters
1. **Select Region**: Choose your Azure region (shows PTU model count)
2. **Select Model**: Pick from 13 PTU-supported models (GPT-5, GPT-4o, etc.)
3. **Choose Deployment**: Global, Data Zone, or Regional deployment
4. **Enter KQL Results**: Input all 7 values from your KQL query
5. **Set Usage Parameters**: Monthly minutes and hybrid model base PTUs

### Step 3: Analyze Results
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
   git remote add origin https://github.com/yourusername/azure-openai-ptu-estimator.git
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
  --name azure-openai-ptu-estimator \
  --resource-group your-resource-group \
  --source https://github.com/your-username/azure-openai-ptu-estimator \
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

## 🎬 Demo

![Azure PTU Calculator Demo](screenshots/demo.gif)

*See the calculator in action: KQL input → Real-time analysis → Cost recommendations*

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

