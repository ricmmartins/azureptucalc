# Microsoft Foundry PTU Calculator - User Guide

## What is the Microsoft Foundry PTU Calculator?

The Microsoft Foundry PTU Calculator is a free, open-source tool that helps you optimize your Azure OpenAI costs by comparing PAYGO, PTU reservations, spillover (hybrid), and Priority Processing pricing. It supports 14 current PTU models, 3 deployment types, and fetches live pricing from the Azure Retail Prices API.

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

### 0. "Do I Need PTU?" — Qualification Wizard

If you're new to Azure OpenAI pricing or unsure whether PTU is right for you, the calculator starts with a **60-second guided assessment**:

1. **Familiarity** — How much do you know about Azure OpenAI pricing? (adjusts explanations to your level)
2. **Monthly Spend** — Approximate Azure OpenAI charges (the #1 factor in the decision)
3. **Usage Pattern** — Is your load steady, business-hours, spiky, or growing?
4. **Priorities** — What matters most: cost, latency, throughput, or simplicity?

At the end, you get a **clear recommendation** with:
- Whether to stay with PAYGO, consider PTU, or try a spillover approach
- Estimated savings percentage
- Confidence level (high/medium/low)
- An explanation of PTU in plain language (for new users)

**Returning users** can re-access this at any time via the "Do I Need PTU?" button in the header.

> **Tip:** If you already know about PTU and just need the calculator, click "Skip to calculator" on the first screen.

### 1. Select Your Model, Region, and Deployment Type

- **Model:** Choose from 14 current PTU models, including GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna, GPT-5.5, GPT-5.4, GPT-5.4 Mini, GPT-5.3 Codex, GPT-5.2, GPT-5.1, GPT-5, GPT-5 Mini, and o3
- **Region:** Select your Azure region (30+ supported)
- **Deployment Type:**
  - **Global** - multi-region, lowest PTU cost ($1.00/PTU/hr base)
  - **Data Zone** - EU/US data residency ($1.10/PTU/hr)
  - **Regional** - single-region, lowest latency ($2.00/PTU/hr)

Pricing updates automatically when you change any of these selections.

#### PAYGO price scope and missing rates

GPT-5.6 estimates use **short-context standard PAYGO list prices in USD per million tokens**, verified against the [Azure pricing page](https://azure.microsoft.com/en-us/pricing/details/azure-openai/) on September 18, 2026:

| Model | Global input / output | Data Zone input / output |
| --- | --- | --- |
| GPT-5.6 Sol | $5 / $30 | $5.50 / $33 |
| GPT-5.6 Terra | $2 / $12 | Not available |
| GPT-5.6 Luna | $0.20 / $1.20 | $0.22 / $1.32 |

The table above is the **Standard** baseline. Long-context, cached-input, and cache-write billing are not included. Selecting a Priority share uses separate verified published Priority prices. The cache-rate control adjusts PTU capacity utilization, not PAYGO billing discounts.

Prices are never borrowed from another model or deployment, and Priority prices are never estimated by applying an arbitrary premium. Missing or unsupported prices block the relevant calculation, not PTU sizing; the calculator does not silently reset either selected share. For missing **Standard** prices (including unlisted GPT-5.6 Regional rates), enter verified input and output prices under **Use Custom Pricing**. This does not make an unsupported Priority scenario available. Custom values are labeled **Custom**, not official.

#### Choose the processing scenario

Set the **Priority token share** and indicate whether the workload is **latency-critical**. The percentage applies equally to **input and output tokens**, not to the percentage of requests. A 25% share prices 25% of input tokens and 25% of output tokens at Priority rates; the other 75% uses Standard rates. Each effective rate is `(1 - share) × Standard rate + share × Priority rate`, with share expressed as a fraction.

- **0%** is Standard-only and requires no Priority quote.
- **100%** is Priority-only and can be priced without a Standard quote when Priority is available.
- Between those endpoints, both rates must be available for the selected model, region, deployment, and context.
- **Spillover Priority share** is an independent setting for estimated PAYGO overflow; changing the main share does not change it.
- Custom pricing overrides **Standard only**. Mixed scenarios disclose custom Standard plus published Priority; this iteration has no Priority custom-pricing UI.

These controls affect token costs and recommendation qualifications, **not PTU throughput, output weighting, minimums, increments, or sizing**.

Recalculate older GPT-5.6 financial analyses: missing prices previously fell back to GPT-4o Mini's $0.15/$0.60, understating PAYGO costs.

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

#### Prompt Cache Hit Rate
Set the fraction of input tokens served from Azure's prompt cache (0.0-1.0):
- **0** - no caching (default)
- **0.5** - 50% cache hits (typical with reused system prompts)
- **0.8** - 80% cache hits (heavy prompt reuse, e.g., RAG with common prefixes)

Cached tokens consume fewer PTU resources, so this reduces the effective input TPM used for PTU sizing.

### 3. Review Results

Results appear in four tabs:

#### Cost Analysis Tab
- **Cost comparison cards** - PAYGO, PTU On-Demand, PTU Monthly Reserved, PTU 1-Year Reserved, and Priority Processing (when available)
- **Interactive chart** - visual comparison of all pricing tiers
- **Recommendation** - compares actual available costs for the selected PAYGO mix, PTU on-demand, monthly and 1-year reservations, and spillover with either reservation term; it does not select a strategy using utilization thresholds. PTU and spillover results identify the term, such as **PTU Monthly Reservation** or **PTU 1-Year Reservation**.
- **Latency review** - when latency-critical is selected and the lowest-cost option includes Standard processing in the primary PAYGO mix or spillover overflow, the result requires review. Its recommended monthly cost is `null`, while the economic cost leader is retained. Priority-only scenarios still carry downgrade and validation qualifications.
- **Savings** - selected PAYGO cost minus the **1-year PTU reservation monthly equivalent**. This comparison is independent of the recommended strategy; it is not claimed savings for a recommended monthly reservation or spillover.
- **Break-even utilization** - based on the **monthly PTU reservation**, not the annual-equivalent savings comparison. The value is not clipped at 100%; a higher figure indicates that the estimated break-even point exceeds the selected capacity.

#### Usage Patterns Tab
- **Reservation savings opportunity** - Monthly vs 1-Year reservation comparison
- **Usage efficiency metrics** - utilization rate, burst ratio

#### Optimization Tab (NEW)
- **Workload Configuration** — set your max_tokens, actual output tokens, prompt tokens, and toggle retry logic, streaming, latency-critical, and APIM gateway settings
- **429 Risk Score** — circular gauge (0-100) analyzing your configuration for throttling risk with a prioritized mitigation checklist
- **max_tokens Concurrency Optimizer** — shows how tightening max_tokens dramatically increases effective concurrent capacity with before/after comparison
- **Interactive Leaky Bucket Simulation** — visualize how Azure's rate-limiting algorithm works in real-time, with burst testing
- **Spillover Architecture Comparison** — side-by-side comparison of PTU→PayGo, PTU→Priority Processing, and APIM AI Gateway patterns with pros/cons
- **Retry & Backoff Calculator** — configure retry strategies with exponential backoff and jitter, with ready-to-use code snippets in Python, JavaScript, and C#
- **Right-Size Wizard** — 4-step guided wizard that walks you through defining your workload, selecting your model, sizing PTUs, and applying the recommendation

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
| **Priority Processing** | PAYGO with model-specific latency targets and downgrade limitations | Eligible latency-sensitive workloads, subject to validation |

> **Note:** Azure does not offer a 3-year PTU reservation.

### 5. Export and Share

- **Export Summary** - download comprehensive CSV report
- **Copy Results** - copy full JSON to clipboard
- **Guided Tour** - click "Quick Tour" for an interactive walkthrough
- **User Guide** — click the "User Guide" link in the footer for comprehensive documentation

CSV and JSON use the same computed recommendation as the primary result, including its selected PTU term where applicable, label, reason, monthly cost, and review flag. They also include the two Priority token shares, latency-critical flag, Standard/Priority quote sources, context, price dates, published rates, selected weighted rates, Standard and 100% Priority monthly baselines, and estimated spillover costs. Unavailable costs are **`null` in JSON and `N/A` in CSV**, not zero. A valid zero cost remains zero. The PTU economic comparison and savings use the 1-year reservation monthly equivalent when scenario analysis is supplied; break-even remains based on the monthly reservation.

In JSON, `costBreakdown.spillover.baseCost` and `.total` retain the **monthly-reservation base** comparison. `.yearlyBaseCost` and `.yearlyTotalCost` contain the **1-year-reservation monthly equivalents**, with the same `.overflowCost` added to either base. The recommended monthly cost can select either term; its explicit label identifies which. CSV includes both term comparisons.

---

## Spillover Strategy

The spillover (hybrid) model combines PTU reservations with PAYGO overflow:

1. **Set base PTUs** for your average usage (use AvgPTU from KQL), rounded to the selected model/deployment minimum and increment; compare monthly-reservation cost with the 1-year-reservation monthly equivalent
2. **Estimate PAYGO overflow** using the actual monthly input/output token split and its separately selected Priority token share
3. **Best for** workloads with predictable baseline + occasional 2-5x spikes

For example, a 17-PTU average requirement with a 15-PTU minimum and 5-PTU increment yields a 20-PTU base, not a 17-PTU reservation. Estimated excess usage is priced separately; the model's capacity parameters are unchanged.

The calculator's existing P99-based monthly extrapolation is a **planning approximation**, not measured monthly burst traffic. It does not establish how many requests will overflow, configure spillover, validate a routing architecture, or guarantee the delivered service tier. Confirm routing support and measure actual overflow before using the estimate for a purchasing decision. If the selected overflow mix is unsupported, that spillover cost is unavailable even when the main PAYGO calculation is available.

---

## Priority Processing

A pay-per-token option with model-specific latency targets, not a blanket latency SLA or guaranteed throughput promise. Availability was checked against [Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/priority-processing) on **September 18, 2026**:

- **Global Standard:** GPT-5.6 Sol and Terra support is verified, alongside the documented GPT-5.5, GPT-5.4, GPT-5.4 Mini, GPT-5.2, GPT-5.1, and GPT-4.1 models. Availability still depends on the exact region and model.
- **Data Zone Standard:** only documented US model/region combinations are eligible. Sol/Terra Data Zone **prices exist**, but these models are omitted from the availability table; the calculator fails closed rather than treating a listed price as deployment support.
- **Unsupported:** Regional Standard, EU Data Zone Standard, and GPT-5.6 Luna. GPT-4.1 Mini is not on the documented Priority support list.
- **Pricing:** independently published model/deployment/context-specific input and output rates; no generic premium, no cross-deployment borrowing. This iteration does not model long-context billing or infer a long-context rate from the short-context quote.
- **Downgrades:** Priority requests may be processed and billed as Standard at ramp-rate limits, peak demand, or applicable long-context limits. Monitor the response service tier and actual latency rather than assuming every requested Priority token receives Priority service.

For latency-critical workloads, use the recommendation's qualifications, next steps, and review flag. The lowest estimated bill alone does not validate latency, capacity, spillover routing, or Priority delivery.

---

## How Pricing Is Obtained

The calculator uses a **4-tier pricing priority system**:

1. **Custom Override** - your own Standard rates (for enterprise/negotiated pricing)
2. **Live Azure API** - real-time from Azure Retail Prices API via a Vercel serverless proxy
3. **Official Hardcoded** - curated rates from Microsoft documentation
4. **Unavailable** - block the relevant calculation when no complete, supported quote exists

Priority uses verified published rates and availability checks separately; Custom Standard rates do not override Priority.

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

> **Note:** The 50000.0 divisor is a generic placeholder. Check the [official TPM-per-PTU table](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/provisioned-throughput-sizing#latest-azure-openai-models) for your specific model.

---

## Practical Tips

- **Not sure if you need PTU?** Start with the "Do I Need PTU?" wizard — it takes 60 seconds and gives a clear answer
- **No Log Analytics?** Use Method B (token counts) or estimate TPM from your app's API logs
- **Start conservative** - begin with lower estimates and adjust as you gather data
- **Check deployment type** - Global is cheapest but Regional gives lowest latency
- **Review regularly** - revisit sizing as usage patterns change
- **Use the Guided Tour** - click "Quick Tour" for an interactive walkthrough with sample data
- **Optimize max_tokens** — setting max_tokens close to your actual output size is the single biggest lever to avoid 429 errors and maximize concurrency
- **Check the Optimization tab** — use the 429 Risk Score and Right-Size Wizard before increasing PTU count

---

## Best Practices

- **Always verify** - compare calculator results with the [official Azure pricing page](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) before purchasing
- **Don't forget burst patterns** - use P99 or Max TPM for sizing, not just average
- **Consider spillover** - for bursty workloads, hybrid is often cheaper than sizing PTUs for peak
- **Check actual costs** - compare the selected PAYGO mix, available PTU terms, and spillover estimate; utilization is a capacity signal, not a universal cost threshold
- **Prevent 429 errors proactively** — use the Optimization tab to analyze your request shape, implement proper retry logic, and compare spillover architectures

---

## References

- [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
- [Provisioned Throughput Guide](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/provisioned-throughput)
- [TPM-per-PTU Table](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/provisioned-throughput-sizing#latest-azure-openai-models)
- [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)
- [Monitor Model Deployments in Microsoft Foundry Models](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/monitor-models) — configure diagnostic settings to send metrics and logs to Log Analytics for new Foundry deployments
- [Right-Size Your PTU Deployment](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/right-size-your-ptu-deployment-and-save-big/4053857)
- [PTU Spillover Traffic Management](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/spillover-traffic-management)
- [Priority Processing](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/priority-processing)
- [APIM GenAI Gateway Capabilities](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities)

---

## Need Help?

- [Open an issue on GitHub](https://github.com/ricmmartins/azureptucalc/issues)
- [GitHub Discussions](https://github.com/ricmmartins/azureptucalc/discussions)

---

**Made with love for the Azure community** - [ptucalc.com](https://www.ptucalc.com)