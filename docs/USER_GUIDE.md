# Azure OpenAI PTU Calculator - User Guide

## What is the Azure OpenAI PTU Calculator?

The Azure OpenAI PTU Calculator is a free, open-source tool that helps you optimize your Azure OpenAI costs by comparing PAYGO, PTU reservations, spillover (hybrid), and Priority Processing pricing. It supports 17 PTU models, 3 deployment types, and fetches live pricing from the Azure Retail Prices API.

Try it live at [ptucalc.com](https://www.ptucalc.com)

---

## Who Should Use This Tool?

- **Azure OpenAI customers** looking to control costs and right-size their deployments
- **Solution architects** and **developers** planning new workloads
- **FinOps teams** seeking cost transparency and optimization
- **Anyone** evaluating PTU vs PAYGO for Azure OpenAI

---

## Key Benefits

- **Save Money:** Find the most cost-effective mix of PTU and PAYGO for your workload
- **Data-Driven Decisions:** Use real KQL data or manual estimates to size your deployment
- **Live Pricing:** Fetches real-time rates from the Azure Retail Prices API (cached 3 hours)
- **No Sign-In Required:** Works entirely in your browser - no data sent to external servers
- **Export:** Download analysis as CSV or copy results as JSON

---

## Step-by-Step Walkthrough

### 1. Select Your Model, Region, and Deployment Type

- **Model:** Choose from 17 supported PTU models (GPT-5.4, GPT-5.2, GPT-4.1, GPT-4o, o3, o4-mini, and more)
- **Region:** Select your Azure region (30+ supported)
- **Deployment Type:**
  - **Global** - multi-region, lowest PTU cost ($1.00/PTU/hr base)
  - **Data Zone** - EU/US data residency ($1.10/PTU/hr)
  - **Regional** - single-region, lowest latency ($2.00/PTU/hr)

Pricing updates automatically when you change any of these selections.

### 2. Input Your Usage Data

#### Method A: KQL / TPM Input (Recommended)
Run the built-in KQL query in Azure Monitor Log Analytics, then enter:
- **AvgTPM** - average tokens per minute
- **P99TPM** - 99th percentile (burst patterns)
- **MaxTPM** - absolute peak usage
- **AvgPTU, P99PTU, MaxPTU, RecommendedPTU** - optional KQL-calculated values

#### Method B: Token Counts
If you don't have Log Analytics, enter:
- **Total input tokens per month**
- **Total output tokens per month**
- Token counts take priority when both methods are provided

#### Input/Output Ratio
Adjust the ratio (0.0-1.0) to reflect your workload:
- **0.7-0.9** - data analysis, summarization (high input)
- **0.5** - balanced chat
- **0.2-0.4** - content generation (high output)

### 3. Review Results

Results appear in three tabs:

#### Cost Analysis Tab
- **Cost comparison cards** - PAYGO, PTU On-Demand, PTU Monthly Reserved, PTU 1-Year Reserved, and Priority Processing (when available)
- **Interactive chart** - visual comparison of all pricing tiers
- **Recommendation** - context-aware suggestion (PAYGO, Full PTU, or Spillover)

#### Usage Patterns Tab
- **Reservation savings opportunity** - Monthly vs 1-Year reservation comparison
- **Usage efficiency metrics** - utilization rate, burst ratio

#### Advanced Tab
- **Official PTU pricing transparency** - see exact rates, multipliers, and discount percentages
- **External pricing data status** - version and update status of fallback data

### 4. Understand the Pricing Tiers

| Tier | Description | Best For |
|------|-------------|----------|
| **PAYGO** | Pay per token, no commitment | Low/variable usage |
| **PTU On-Demand** | Hourly PTU rate, no reservation | Testing, short-term |
| **PTU Monthly** | 1-month reservation (~64% off on-demand) | Steady usage, no long commitment |
| **PTU 1-Year** | 1-year reservation (~70% off on-demand) | Predictable, high-volume workloads |
| **Spillover** | Base PTUs + PAYGO overflow | Predictable baseline with occasional bursts |
| **Priority Processing** | PAYGO with SLA-backed latency | Latency-sensitive production apps |

> **Note:** Azure does not offer a 3-year PTU reservation.

### 5. Export and Share

- **Export Summary** - download comprehensive CSV report
- **Copy Results** - copy full JSON to clipboard
- **Guided Tour** - click "Quick Tour" for an interactive walkthrough

---

## Spillover Strategy

The spillover (hybrid) model combines PTU reservations with PAYGO overflow:

1. **Set base PTUs** for your average usage (use AvgPTU from KQL)
2. **Burst traffic** automatically spills over to PAYGO rates
3. **Best for** workloads with predictable baseline + occasional 2-5x spikes

Example: Need 2 PTU average, 8 PTU peaks. Reserve 2-3 PTUs, let extra 5-6 PTUs use PAYGO.

---

## Priority Processing

A GA pay-per-token option with SLA-backed low-latency guarantees:

- **Supported models:** GPT-5.4, GPT-5.2, GPT-5.1, GPT-4.1, GPT-4.1 Mini, o4-mini
- **Deployments:** Global Standard, Data Zone Standard only
- **Pricing:** varies by model (approximately 70% premium over standard PAYGO)
- **When to use:** latency-sensitive production apps needing guaranteed throughput

---

## How Pricing Is Obtained

The calculator uses a **4-tier pricing priority system**:

1. **Custom Override** - your own rates (for enterprise/negotiated pricing)
2. **Live Azure API** - real-time from Azure Retail Prices API via a Vercel serverless proxy
3. **Official Hardcoded** - curated rates from Microsoft documentation
4. **Fallback** - conservative estimates when all else fails

Live pricing is cached for 3 hours. All calculations happen in your browser.

---

## KQL Query

Use this in Azure Monitor Log Analytics:

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

> **Note:** The 50000.0 divisor is a generic placeholder. Check the [official TPM-per-PTU table](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding#latest-azure-openai-models) for your specific model.

---

## Practical Tips

- **No Log Analytics?** Use Method B (token counts) or estimate TPM from your app's API logs
- **Start conservative** - begin with lower estimates and adjust as you gather data
- **Check deployment type** - Global is cheapest but Regional gives lowest latency
- **Review regularly** - revisit sizing as usage patterns change
- **Use the Guided Tour** - click "Quick Tour" for an interactive walkthrough with sample data

---

## Best Practices

- **Always verify** - compare calculator results with the [official Azure pricing page](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) before purchasing
- **Don't forget burst patterns** - use P99 or Max TPM for sizing, not just average
- **Consider spillover** - for bursty workloads, hybrid is often cheaper than sizing PTUs for peak
- **Check utilization** - PTU is typically cost-effective above 60% utilization; below that, PAYGO wins

---

## References

- [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
- [Provisioned Throughput Guide](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/provisioned-throughput)
- [TPM-per-PTU Table](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding#latest-azure-openai-models)
- [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)

---

## Need Help?

- [Open an issue on GitHub](https://github.com/ricmmartins/azureptucalc/issues)
- [GitHub Discussions](https://github.com/ricmmartins/azureptucalc/discussions)

---

**Made with love for the Azure community** - [ptucalc.com](https://www.ptucalc.com)