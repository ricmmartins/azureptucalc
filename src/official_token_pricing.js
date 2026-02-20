// Official Azure OpenAI Token Pricing per Million Tokens (USD)
// Updated: February 2026
// Source: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

export const OFFICIAL_TOKEN_PRICING = {
  // GPT-5 Series (prices per 1M tokens from official Azure pricing page)
  "gpt-5": {
    input: 1.25,     // $1.25 per million input tokens (Global Standard)
    output: 10.00,   // $10 per million output tokens
    description: "Most advanced reasoning model for coding and agentic tasks"
  },
  "gpt-5-mini": {
    input: 0.25,     // $0.25 per million input tokens
    output: 2.00,    // $2 per million output tokens
    description: "Faster, cost-efficient version of GPT-5"
  },
  "gpt-5-nano": {
    input: 0.05,     // $0.05 per million input tokens
    output: 0.40,    // $0.40 per million output tokens
    description: "Lightweight GPT-5 variant optimized for speed"
  },
  "gpt-5-chat": {
    input: 1.25,     // $1.25 per million input tokens
    output: 10.00,   // $10 per million output tokens
    description: "Text-only chat optimized version of GPT-5"
  },
  "gpt-5.1": {
    input: 1.25,     // $1.25 per million input tokens (Global Standard)
    output: 10.00,   // $10 per million output tokens
    description: "Enhanced GPT-5 with improved reasoning and problem-solving capabilities"
  },
  "gpt-5.2": {
    input: 1.75,     // $1.75 per million input tokens (Global Standard)
    output: 14.00,   // $14 per million output tokens
    description: "Latest GPT-5 iteration with advanced agentic capabilities and enhanced performance"
  },

  // GPT-4 Series
  "gpt-4o": {
    input: 2.50,     // $2.50 per million input tokens
    output: 10.00,   // $10 per million output tokens
    description: "Latest multimodal model with text and image capabilities"
  },
  "gpt-4o-mini": {
    input: 0.15,     // $0.15 per million input tokens
    output: 0.60,    // $0.60 per million output tokens
    description: "Smaller, faster version of GPT-4o with cost optimization"
  },
  "gpt-4": {
    input: 30.00,    // $30 per million input tokens
    output: 60.00,   // $60 per million output tokens
    description: "Advanced language model with superior reasoning capabilities"
  },
  "gpt-4-turbo": {
    input: 10.00,    // $10 per million input tokens
    output: 30.00,   // $30 per million output tokens
    description: "Enhanced GPT-4 with improved performance and larger context window"
  },

  // GPT-3.5 Series
  "gpt-35-turbo": {
    input: 0.50,     // $0.50 per million input tokens
    output: 1.50,    // $1.50 per million output tokens
    description: "Fast and efficient model for most conversational tasks"
  },

  // Embedding Models (no output tokens for embeddings)
  "text-embedding-ada-002": {
    input: 0.10,     // $0.10 per million tokens
    output: 0.00,    // No output tokens for embeddings
    description: "High-quality text embeddings for semantic search"
  },
  "text-embedding-3-large": {
    input: 0.13,     // $0.13 per million tokens
    output: 0.00,    // No output tokens for embeddings
    description: "Latest large embedding model with improved performance"
  },
  "text-embedding-3-small": {
    input: 0.02,     // $0.02 per million tokens
    output: 0.00,    // No output tokens for embeddings
    description: "Efficient embedding model for cost-sensitive applications"
  },

  // Audio Models
  "whisper": {
    input: 6.00,     // $6 per million tokens (estimated based on audio processing)
    output: 0.00,    // No output tokens for transcription
    description: "Speech-to-text model for audio transcription"
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
      console.log(`Auto-populated token pricing for model ${modelId} from corrected_pricing_data.json`);
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
    console.warn(`Pricing not found in OFFICIAL_TOKEN_PRICING for model: ${modelName}. Using corrected_pricing_data.json rates.`);
    return { input: corrected.input ?? 0, output: corrected.output ?? 0, isFallback: true };
  }

  // Final fallback to GPT-4o-mini pricing
  console.warn(`Pricing not found for model: ${modelName}. Using GPT-4o-mini fallback.`);
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