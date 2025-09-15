// Official Azure OpenAI Token Pricing (as of September 2025)
// Prices are per million tokens in USD

export const TOKEN_PRICING = {
  'gpt-5': {
    input: 10.00,    // $10.00 per 1M input tokens
    output: 30.00    // $30.00 per 1M output tokens
  },
  'gpt-5-mini': {
    input: 3.00,     // $3.00 per 1M input tokens
    output: 12.00    // $12.00 per 1M output tokens
  },
  'gpt-5-nano': {
    input: 1.50,     // $1.50 per 1M input tokens
    output: 6.00     // $6.00 per 1M output tokens
  },
  'gpt-5-chat': {
    input: 5.00,     // $5.00 per 1M input tokens
    output: 15.00    // $15.00 per 1M output tokens
  },
  'gpt-4o': {
    input: 2.50,     // $2.50 per 1M input tokens
    output: 10.00    // $10.00 per 1M output tokens
  },
  'gpt-4o-mini': {
    input: 0.15,     // $0.15 per 1M input tokens
    output: 0.60     // $0.60 per 1M output tokens
  },
  'gpt-4': {
    input: 30.00,    // $30.00 per 1M input tokens
    output: 60.00    // $60.00 per 1M output tokens
  },
  'gpt-4-turbo': {
    input: 10.00,    // $10.00 per 1M input tokens
    output: 30.00    // $30.00 per 1M output tokens
  },
  'gpt-35-turbo': {
    input: 0.50,     // $0.50 per 1M input tokens
    output: 1.50     // $1.50 per 1M output tokens
  },
  'text-embedding-ada-002': {
    input: 0.10,     // $0.10 per 1M input tokens
    output: 0.00     // No output tokens for embeddings
  },
  'text-embedding-3-large': {
    input: 0.13,     // $0.13 per 1M input tokens
    output: 0.00     // No output tokens for embeddings
  },
  'text-embedding-3-small': {
    input: 0.02,     // $0.02 per 1M input tokens
    output: 0.00     // No output tokens for embeddings
  },
  'whisper': {
    input: 6.00,     // $6.00 per hour (converted to token equivalent)
    output: 0.00     // No output tokens for audio transcription
  }
};

/**
 * Get token pricing for a specific model
 * @param {string} modelName - The model name (e.g., 'gpt-4o-mini')
 * @returns {object} - Object with input and output pricing
 */
export function getTokenPricing(modelName) {
  const pricing = TOKEN_PRICING[modelName];
  if (!pricing) {
    console.warn(`Token pricing not found for model: ${modelName}, using GPT-4o-mini as fallback`);
    return TOKEN_PRICING['gpt-4o-mini'];
  }
  return pricing;
}

/**
 * Calculate PAYG cost breakdown for given token usage
 * @param {string} modelName - The model name
 * @param {number} inputTokens - Number of input tokens (in millions)
 * @param {number} outputTokens - Number of output tokens (in millions)
 * @returns {object} - Cost breakdown object
 */
export function calculatePAYGCost(modelName, inputTokens, outputTokens) {
  const pricing = getTokenPricing(modelName);
  
  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  const totalCost = inputCost + outputCost;
  const totalTokens = inputTokens + outputTokens;
  const effectiveCostPerMillion = totalTokens > 0 ? totalCost / totalTokens : 0;
  
  return {
    inputCost,
    outputCost,
    totalCost,
    totalTokens,
    effectiveCostPerMillion,
    inputTokens,
    outputTokens,
    inputRate: pricing.input,
    outputRate: pricing.output
  };
}

/**
 * Auto-calculate token split from total TPM assuming equal input/output ratio
 * @param {number} avgTPM - Average tokens per minute
 * @param {number} monthlyMinutes - Active minutes per month
 * @param {number} inputRatio - Ratio of input tokens (0.5 = 50% input, 50% output)
 * @returns {object} - Object with calculated input and output tokens in millions
 */
export function calculateTokenSplit(avgTPM, monthlyMinutes, inputRatio = 0.5) {
  const totalMonthlyTokens = (avgTPM * monthlyMinutes) / 1000000; // Convert to millions
  
  // Calculate split based on ratio
  const inputTokens = totalMonthlyTokens * inputRatio;
  const outputTokens = totalMonthlyTokens * (1 - inputRatio);
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: totalMonthlyTokens
  };
}