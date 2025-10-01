# Azure OpenAI PTU Calculator - User Guide

## 🎯 What is the PTU Calculator?

The Azure OpenAI PTU Calculator is a professional tool that helps you make smart financial decisions about Azure OpenAI capacity planning. It analyzes your usage patterns and recommends the most cost-effective pricing model for your workloads.

### The Problem It Solves
When using Azure OpenAI, you face three pricing options:
- **PAYGO (Pay-as-you-go)**: Flexible but expensive per token
- **PTU (Provisioned Throughput Units)**: Reserved capacity at lower cost
- **Hybrid**: Mix of PTU base + PAYGO overflow

Without proper analysis, you might:
- ❌ Overpay with PAYGO when PTU would be cheaper
- ❌ Over-provision PTUs and waste money on unused capacity
- ❌ Under-provision and hit throttling limits

### The Solution
Our calculator eliminates guesswork by:
- ✅ Analyzing your actual usage data
- ✅ Calculating precise cost comparisons
- ✅ Recommending the optimal pricing strategy
- ✅ Showing potential savings opportunities

---

## 🚀 Getting Started

### Quick Start (5 minutes)
1. **Open the calculator** at your deployment URL
2. **Select your region** from the dropdown (e.g., "East US")
3. **Choose your model** (e.g., "GPT-4o", "GPT-4o-mini")
4. **Enter your usage data** (see data input methods below)
5. **Review recommendations** and cost analysis

### Data Input Methods

#### Method 1: Log Analytics (Recommended)
**Best for: Teams with Azure Log Analytics enabled**

1. Run this KQL query in your Log Analytics workspace:
```kql
AzureDiagnostics
| where TimeGenerated >= ago(30d)
| where Category == "RequestResponse"
| summarize 
    avg_tokens_per_minute = avg(prompt_tokens_d + completion_tokens_d),
    p99_tokens_per_minute = percentile(prompt_tokens_d + completion_tokens_d, 99),
    total_requests = count()
| project avg_tokens_per_minute, p99_tokens_per_minute, total_requests
```

2. Copy the results into the calculator fields:
   - **Average TPM**: `avg_tokens_per_minute`
   - **P99 TPM**: `p99_tokens_per_minute`

#### Method 2: Azure Portal Metrics
**Best for: Teams without Log Analytics**

1. Go to **Azure Portal → Your OpenAI Resource → Metrics**
2. Select metrics for "Total Tokens" over the last 30 days
3. Calculate: `Total Tokens ÷ Minutes in Period = Average TPM`
4. Enter the calculated value in **Average TPM** field

#### Method 3: Manual Estimation
**Best for: Planning new workloads**

1. Estimate your usage patterns:
   - **Small chatbot**: ~1,000-5,000 TPM
   - **Document processing**: ~10,000-50,000 TPM
   - **Large-scale application**: 100,000+ TPM

2. Enter your estimate in the **Average TPM** field

---

## 📊 Understanding the Interface

### Main Input Panel

#### Region & Model Selection
- **Region**: Choose your Azure region (affects pricing)
- **Model**: Select the OpenAI model you're using
- **Deployment Type**: Global, Data Zone, or Regional

#### Usage Data Fields
- **Average TPM**: Your typical tokens per minute
- **P99 TPM**: Peak usage (99th percentile)
- **Monthly Minutes**: How many minutes per month you use the service
- **Manual PTU Override**: Set a specific PTU amount to analyze

#### Custom Pricing (Advanced)
Toggle "Use Custom Pricing" if you have:
- Enterprise agreements with Microsoft
- Negotiated rates
- Special pricing arrangements

### Interactive Analytics Dashboard

#### Tab 1: Cost Analysis
- **Monthly Costs**: PAYGO vs PTU comparison
- **Annual Projections**: Yearly cost estimates
- **Break-even Point**: When PTU becomes cheaper
- **Savings Potential**: How much you could save

#### Tab 2: Utilization Analysis
- **Capacity Utilization**: How efficiently you'd use PTUs
- **Peak vs Average**: Usage pattern analysis
- **Overflow Scenarios**: Hybrid model analysis

#### Tab 3: Growth Projections
- **Usage Trends**: Projected growth over time
- **Cost Evolution**: How costs change with growth
- **Scaling Recommendations**: When to adjust capacity

#### Tab 4: Usage Patterns
- **Business Hours Simulation**: 9-5 vs 24/7 usage
- **Seasonal Variations**: Monthly usage patterns
- **Optimization Opportunities**: When to scale up/down

---

## 🎯 Reading the Results

### Recommendation Types

#### "Full PTU Reservation"
- **Meaning**: Reserve all capacity as PTUs
- **When**: High, consistent usage with predictable patterns
- **Savings**: Typically 20-40% vs PAYGO

#### "PAYGO (Pay-as-you-go)"
- **Meaning**: Use on-demand pricing only
- **When**: Low, sporadic, or highly variable usage
- **Benefits**: Maximum flexibility, no capacity commitment

#### "Hybrid (PTU + Overflow)"
- **Meaning**: Reserve base capacity as PTUs, overflow to PAYGO
- **When**: Predictable base load with occasional spikes
- **Benefits**: Cost optimization + flexibility

### Key Metrics to Watch

#### Monthly Cost Comparison
```
PAYGO:    $2,500/month
PTU:      $1,800/month  ← 28% savings
Hybrid:   $1,950/month  ← 22% savings
```

#### PTU Utilization
- **80%+**: Excellent utilization, PTU recommended
- **50-80%**: Good utilization, consider hybrid
- **<50%**: Poor utilization, stick with PAYGO

#### Break-even Analysis
- Shows the usage level where PTU becomes cost-effective
- Helps predict when to switch as you scale

---

## 💼 Common Use Cases

### Customer Discovery Sessions
1. **Preparation**: Have customer run KQL query beforehand
2. **Live Demo**: Walk through calculator together
3. **Immediate Value**: Show real savings with their data
4. **Next Steps**: Provide PTU sizing recommendations

### Executive Presentations
1. **Focus on Outcomes**: Highlight dollar savings
2. **Use Charts**: Export visual cost comparisons
3. **ROI Story**: Show investment payback period
4. **Risk Mitigation**: Explain capacity planning benefits

### Technical Planning
1. **Capacity Modeling**: Model different growth scenarios
2. **Architecture Decisions**: PTU placement and sizing
3. **Budget Planning**: Annual cost projections
4. **Performance Planning**: Avoid throttling with proper sizing

### Proposal Development
1. **Cost Justification**: Include calculator screenshots
2. **Scenario Modeling**: Show different usage patterns
3. **Competitive Analysis**: Compare with other solutions
4. **Implementation Planning**: PTU deployment strategy

---

## 🔧 Advanced Features

### Export Functionality
1. Click **"Export Analysis"** button
2. Choose format: **CSV** (for Excel) or **JSON** (for systems)
3. Includes:
   - Complete cost breakdown
   - Recommendation details
   - Usage analysis
   - Configuration settings

### Custom Pricing
For enterprise customers with negotiated rates:
1. Toggle **"Use Custom Pricing"**
2. Enter your specific rates:
   - PAYGO Input/Output costs
   - PTU hourly rates
   - Monthly/yearly commitments
3. Calculator updates automatically

### Regional Pricing
- Supports 30+ Azure regions
- Automatic pricing adjustments
- Regional availability validation
- Multi-region cost comparison

---

## 🚨 Important Notes & Limitations

### Data Accuracy
- **Most Accurate**: Log Analytics with 30+ days of data
- **Good**: Azure Portal metrics over 2+ weeks
- **Estimates Only**: Manual projections for new workloads

### PTU Minimums
Each model has minimum PTU requirements:
- **GPT-4o**: 15 PTU minimum (Global/Data Zone), 50 PTU (Regional)
- **GPT-4o-mini**: 15 PTU minimum (Global/Data Zone), 25 PTU (Regional)
- Calculator enforces these minimums automatically

### Pricing Updates
- Tool uses official Microsoft pricing
- Updates automatically when available
- Always verify with current Azure pricing for final decisions

### Regional Availability
- Not all models available in all regions
- Calculator shows availability warnings
- Check Azure OpenAI Service page for latest availability

---

## 🆘 Troubleshooting

### Common Issues

#### "No recommendation showing"
- **Check**: Ensure you've entered Average TPM > 0
- **Fix**: Enter usage data in at least one field

#### "Warning: Below minimum PTU"
- **Meaning**: Your calculated PTU is below model minimum
- **Impact**: You'll pay for minimum anyway but get extra capacity
- **Action**: Consider higher-capacity models or PAYGO

#### "Invalid region/model combination"
- **Meaning**: Selected model not available in chosen region
- **Fix**: Choose different region or model
- **Check**: Azure OpenAI Service availability page

#### "Calculations seem wrong"
- **Verify**: Check your TPM input (common mistake: RPM vs TPM)
- **Validate**: Compare with Azure Portal billing data
- **Contact**: Reach out if calculations consistently don't match

### Getting Help
1. **Documentation**: Check this guide first
2. **Internal Support**: Contact the tool maintainer
3. **Azure Support**: For official pricing questions
4. **Community**: Share feedback for improvements

---

## 📈 Best Practices

### For Accurate Analysis
1. **Use 30+ days** of data for reliable patterns
2. **Include peak periods** (weekdays, month-end, etc.)
3. **Account for seasonality** in your industry
4. **Update regularly** as usage evolves

### For Cost Optimization
1. **Start with hybrid** for unknown workloads
2. **Monitor utilization** after PTU deployment
3. **Plan for growth** with headroom capacity
4. **Review quarterly** and adjust as needed

### For Customer Conversations
1. **Lead with savings** potential
2. **Use their data** not generic examples
3. **Explain trade-offs** clearly
4. **Provide next steps** and implementation guidance

---

## 🔗 Quick Reference

### Essential Formulas
- **PTU Calculation**: `Average TPM ÷ 50,000 = Required PTUs`
- **Monthly PTU Cost**: `PTUs × Hourly Rate × 730 hours`
- **Break-even Point**: `PTU Monthly Cost ÷ PAYGO Monthly Cost`

### Typical Usage Patterns
- **Customer Service Bot**: 1,000-10,000 TPM
- **Content Generation**: 5,000-25,000 TPM
- **Document Processing**: 10,000-100,000 TPM
- **Large Applications**: 100,000+ TPM

### When to Use Each Model
- **PAYGO**: <50% capacity utilization, highly variable workloads
- **Hybrid**: 50-80% utilization, predictable base with spikes
- **Full PTU**: >80% utilization, consistent high-volume workloads

---

*This guide covers the essential features and use cases. For the latest updates and advanced scenarios, check with the tool maintainer or internal documentation.*
