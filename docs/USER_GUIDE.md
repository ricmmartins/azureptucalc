# Azure OpenAI PTU Calculator – User Guide

## What is the Azure OpenAI PTU Calculator?

The Azure OpenAI PTU Calculator is a free, open-source tool that helps you optimize your Azure OpenAI costs by intelligently sizing Provisioned Throughput Units (PTUs), comparing PAYGO and PTU pricing, and analyzing your usage patterns. It supports all major Azure OpenAI models and provides real-time pricing, cost projections, and actionable recommendations.

---

## Who Should Use This Tool?

- **Azure OpenAI customers** looking to control costs and right-size their deployments.
- **Solution architects** and **developers** planning new workloads.
- **Business owners** and **finops teams** seeking cost transparency and optimization.

---

## Key Benefits

- **Save Money:** Find the most cost-effective mix of PTU and PAYGO for your workload.
- **Data-Driven Decisions:** Use real usage data or estimates to size your deployment.
- **Easy to Use:** No sign-in required, works in your browser, and supports export to CSV/JSON.
- **Always Up-to-Date:** Pulls live pricing from Azure’s official API.

---

## Step-by-Step Walkthrough

### 1. Input Your Usage Data

#### With Log Analytics (Recommended)
- Run the provided KQL query in your Azure Monitor Log Analytics workspace.
- Copy the results (tokens per minute) into the calculator.

#### Without Log Analytics
- Estimate your usage using:
  - **API logs:** Count requests and average tokens per request.
  - **Billing data:** Divide total tokens billed by total minutes in your usage period.
  - **Business metrics:** Estimate based on users, documents, or requests.
- Enter your estimated average and peak tokens per minute (TPM).

### 2. Select Your Model and Region

- Choose your Azure region and the OpenAI model you use.
- The calculator will automatically adjust for model-specific throughput and regional pricing.

### 3. Adjust Throughput per PTU

- Each model has a specific “tokens per minute per PTU” value.
- Reference the official [Provisioned Throughput Table](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding#latest-azure-openai-models) for your model.
- Update the calculator’s throughput_per_ptu value if needed.

### 4. Analyze Results

- **Cost Comparison:** See side-by-side PAYGO, PTU, and hybrid costs.
- **Break-even Analysis:** Find when PTU becomes cheaper than PAYGO.
- **Utilization Metrics:** Understand how efficiently you’d use PTUs.
- **Savings Opportunities:** Identify potential cost reductions.

### 5. Export and Share

- Download your analysis as CSV or JSON for reporting or further analysis.

---

## Practical Tips

- **No Log Analytics?** Use your app’s logs, API gateway, or Application Insights to estimate requests per minute and tokens per request.
- **Start Conservative:** If unsure, start with lower usage estimates and adjust upward as you gather more data.
- **Review Regularly:** Revisit your sizing as your usage patterns change.

---

## Best Practices & Common Pitfalls

- **Always use the correct throughput_per_ptu for your model.** Using a generic value may lead to over- or under-provisioning.
- **Don’t forget burst patterns.** Use P99 or Max TPM for sizing, not just average.
- **Check for regional pricing differences.** Some regions may have different PTU or PAYGO rates.

---

## References

- [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
- [Provisioned Throughput Table](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding#latest-azure-openai-models)
- [KQL Reference](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)

---

## Need Help?

- Open an issue on [GitHub](https://github.com/ricmmartins/azureptucalc/issues)
- Join the discussion in [GitHub Discussions](https://github.com/ricmmartins/azureptucalc/discussions)

---

**Made with ❤️ for the Azure community**
