// Official Azure OpenAI Token Pricing per Million Tokens (USD)
// Updated: March 2026
// Source: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

// Priority Processing pricing (per 1M tokens, GlobalStandard/DataZoneStandard only)
// Docs: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/priority-processing
export const PRIORITY_PROCESSING_PRICING = {
  "gpt-5.4": { input: 4.25, output: 17.00, supported: true },
  "gpt-5.2": { input: 4.25, output: 17.00, supported: true },
  "gpt-5.1": { input: 4.25, output: 17.00, supported: true },
  "gpt-4.1": { input: 4.25, output: 17.00, supported: true },
  "gpt-4.1-mini": { input: 0.70, output: 2.80, supported: true },
  "o4-mini": { input: 1.87, output: 7.48, supported: true }
};

// Supported deployment types for Priority Processing
export const PRIORITY_PROCESSING_DEPLOYMENTS = ['global', 'dataZone'];

export const OFFICIAL_TOKEN_PRICING = {
  // GPT-5 Series (prices per 1M tokens from official Azure pricing page)
  "gpt-5.4": {
    input: 2.50,
    output: 10.00,
    description: "Latest frontier model with enhanced reasoning and multimodal capabilities"
  },
  "gpt-5.3-codex": {
    input: 2.50,
    output: 10.00,
    description: "Codex model optimized for code generation"
  },
  "gpt-5.2": {
    input: 2.50,
    output: 10.00,
    description: "Advanced reasoning model with agentic capabilities"
  },
  "gpt-5.2-codex": {
    input: 2.50,
    output: 10.00,
    description: "Codex variant of GPT-5.2 for code tasks"
  },
  "gpt-5.1": {
    input: 2.50,
    output: 10.00,
    description: "Enhanced GPT-5 with improved reasoning and problem-solving"
  },
  "gpt-5.1-codex": {
    input: 2.50,
    output: 10.00,
    description: "Codex variant of GPT-5.1 for code tasks"
  },
  "gpt-5": {
    input: 1.25,
    output: 10.00,
    description: "Advanced reasoning model for coding and agentic tasks"
  },
  "gpt-5-mini": {
    input: 0.30,
    output: 1.25,
    description: "Faster, cost-efficient version of GPT-5"
  },

  // GPT-4.1 Series
  "gpt-4.1": {
    input: 2.50,
    output: 10.00,
    description: "Low-latency model with strong coding and instruction-following"
  },
  "gpt-4.1-mini": {
    input: 0.40,
    output: 1.60,
    description: "Cost-efficient variant of GPT-4.1"
  },
  "gpt-4.1-nano": {
    input: 0.10,
    output: 0.40,
    description: "Fastest and most affordable GPT-4.1 variant"
  },

  // Reasoning Models (o-series)
  "o3": {
    input: 2.50,
    output: 10.00,
    description: "Advanced reasoning model for complex problem-solving"
  },
  "o4-mini": {
    input: 1.10,
    output: 4.40,
    description: "Cost-efficient reasoning model"
  },
  "o3-mini": {
    input: 1.10,
    output: 4.40,
    description: "Smaller, efficient reasoning model"
  },
  "o1": {
    input: 15.00,
    output: 60.00,
    description: "First-generation reasoning model"
  },

  // GPT-4o Series (previous generation)
  "gpt-4o": {
    input: 2.50,
    output: 10.00,
    description: "Multimodal model with text and image capabilities"
  },
  "gpt-4o-mini": {
    input: 0.15,
    output: 0.60,
    description: "Smaller, faster version of GPT-4o"
  }
};

// Auto-populate OFFICIAL_TOKEN_PRICING with any PAYGO rates present in corrected_pricing_data.json
import correctedPricingData from './corrected_pricing_data.json';

for (const [modelId, modelData] of Object.entries(correctedPricingData.models || {})) {
  try {
    const paygo = modelData.paygo?.global;
    if (!OFFICIAL_TOKEN_PRICING[modelId] && paygo && (paygo.input != null || paygo.output != null)) {
      OFFICIAL_TOKEN_PRICING[modelId] = {
        input: paygo.input ?? 0,
        output: paygo.output ?? 0,
        description: modelData.displayName || modelId
      };
      // eslint-disable-next-line no-console
    }
  } catch (e) {
    // ignore
  }
}

// Function to get pricing for a specific model

export function getTokenPricing(modelName) {
  const pricing = OFFICIAL_TOKEN_PRICING[modelName];
  if (pricing) return { ...pricing, isFallback: false };

  // Try to source PAYGO rates from corrected_pricing_data.json if available
  const corrected = correctedPricingData.models?.[modelName]?.paygo?.global;
  if (corrected && (corrected.input != null || corrected.output != null)) {
    return { input: corrected.input ?? 0, output: corrected.output ?? 0, isFallback: true };
  }

  // Final fallback to GPT-4o-mini pricing
  const fallback = OFFICIAL_TOKEN_PRICING["gpt-4o-mini"];
  return { ...fallback, isFallback: true };
}

// Function to calculate PAYG cost based on token usage
export function calculatePAYGCost(modelName, inputTokensInMillions, outputTokensInMillions) {
  const pricing = getTokenPricing(modelName);
  
  const inputCost = inputTokensInMillions * pricing.input;
  const outputCost = outputTokensInMillions * pricing.output;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost,
    outputCost,
    totalCost,
    totalTokens: inputTokensInMillions + outputTokensInMillions,
    effectiveCostPerMillionTokens: (inputTokensInMillions + outputTokensInMillions) > 0 
      ? totalCost / (inputTokensInMillions + outputTokensInMillions) 
      : 0,
    breakdown: {
      inputTokens: inputTokensInMillions,
      outputTokens: outputTokensInMillions,
      inputRate: pricing.input,
      outputRate: pricing.output
    }
  };
}

// Function to auto-calculate input/output tokens from total TPM (assumes 50/50 split by default)
export function calculateTokenSplit(totalTPM, monthlyMinutes, inputRatio = 0.5) {
  const totalMonthlyTokens = (totalTPM * monthlyMinutes) / 1000000; // Convert to millions
  const inputTokens = totalMonthlyTokens * inputRatio;
  const outputTokens = totalMonthlyTokens * (1 - inputRatio);
  
  return {
    totalMonthlyTokens,
    inputTokens,
    outputTokens
  };
}