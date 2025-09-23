// Official Azure OpenAI Token Pricing per Million Tokens (USD)
// Updated: September 2025
// Source: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

export const OFFICIAL_TOKEN_PRICING = {
  // GPT-5 Series
  "gpt-5": {
    input: 10.00,    // $10 per million input tokens
    output: 30.00,   // $30 per million output tokens
    description: "Most advanced reasoning model for coding and agentic tasks"
  },
  "gpt-5-mini": {
    input: 3.00,     // $3 per million input tokens
    output: 12.00,   // $12 per million output tokens
    description: "Faster, cost-efficient version of GPT-5"
  },
  "gpt-5-nano": {
    input: 1.50,     // $1.50 per million input tokens
    output: 6.00,    // $6 per million output tokens
    description: "Lightweight GPT-5 variant optimized for speed"
  },
  "gpt-5-chat": {
    input: 2.50,     // $2.50 per million input tokens
    output: 10.00,   // $10 per million output tokens
    description: "Text-only chat optimized version of GPT-5"
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

// Function to get pricing for a specific model
export function getTokenPricing(modelName) {
  const pricing = OFFICIAL_TOKEN_PRICING[modelName];
  if (!pricing) {
    // Fallback to GPT-4o-mini pricing if model not found
    console.warn(`Pricing not found for model: ${modelName}. Using GPT-4o-mini fallback.`);
    return OFFICIAL_TOKEN_PRICING["gpt-4o-mini"];
  }
  return pricing;
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