const PRICING_URL = 'https://azure.microsoft.com/en-us/pricing/details/azure-openai/';
const AVAILABILITY_URL = 'https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/priority-processing';
const VERIFIED_AT = '2026-09-18';

// USD per million uncached input/output tokens, read from the rendered Azure
// pricing table on VERIFIED_AT. Each deployment is quoted independently.
// These are short-context quotes, not long-context or cache-write prices.
const PRIORITY_RATES = {
  global: {
    'gpt-5.6-sol': { input: 10, output: 60 },
    'gpt-5.6-terra': { input: 4, output: 24 },
    'gpt-5.5': { input: 12.5, output: 75 },
    'gpt-5.4': { input: 5, output: 30 },
    'gpt-5.4-mini': { input: 1.5, output: 9 },
    'gpt-5.2': { input: 3.5, output: 28 },
    'gpt-5.1': { input: 2.5, output: 20 },
    'gpt-4.1': { input: 3.5, output: 14 },
  },
  dataZone: {
    'gpt-5.5': { input: 13.75, output: 82.5 },
    'gpt-5.4': { input: 5.5, output: 33 },
    'gpt-5.4-mini': { input: 1.65, output: 9.9 },
    'gpt-5.2': { input: 3.85, output: 30.8 },
    'gpt-5.1': { input: 2.75, output: 22 },
    'gpt-4.1': { input: 3.85, output: 15.4 },
  },
};

// Exact rows of the deployment-specific Learn availability tables, not a
// general Azure region list. In particular, westus2 is not listed.
const GLOBAL_REGIONS = new Set([
  'australiaeast', 'brazilsouth', 'canadacentral', 'canadaeast', 'centralus',
  'eastus', 'eastus2', 'francecentral', 'germanywestcentral', 'italynorth',
  'japaneast', 'koreacentral', 'northcentralus', 'norwayeast', 'polandcentral',
  'southafricanorth', 'southcentralus', 'southeastasia', 'southindia',
  'spaincentral', 'swedencentral', 'switzerlandnorth', 'switzerlandwest',
  'uaenorth', 'uksouth', 'westeurope', 'westus', 'westus3',
]);
const DATA_ZONE_REGIONS = new Set([
  'centralus', 'eastus', 'eastus2', 'northcentralus', 'southcentralus',
  'westus', 'westus3',
]);

/**
 * Return a verified short-context Priority quote for exact calculator IDs.
 * Availability is the intersection of the pricing and Learn tables.
 * Learn downgrades Sol/Terra prompts above 272k and GPT-5.4/GPT-4.1 above
 * 128k to Standard; GPT-5.4's pricing row alone says <272k. Aggregate monthly
 * token volumes cannot determine per-request eligibility or actual downgrades.
 */
export function getPriorityPricing(model, deployment, region) {
  const metadata = {
    model, deployment, region, context: 'short', verifiedAt: VERIFIED_AT,
  };
  const unavailable = (reason) => ({
    ...metadata, available: false, input: null, output: null,
    source: 'unavailable', sourceUrl: AVAILABILITY_URL, reason,
  });

  if (deployment !== 'global' && deployment !== 'dataZone') {
    return unavailable('Priority processing supports only Global Standard and US Data Zone Standard deployments; Regional is not supported.');
  }
  const regions = deployment === 'global' ? GLOBAL_REGIONS : DATA_ZONE_REGIONS;
  if (!regions.has(region)) {
    return unavailable(deployment === 'dataZone'
      ? 'Priority Data Zone processing is supported only in the explicitly listed US regions, not EU or government regions.'
      : 'Priority Global processing is not confirmed in this region; only explicitly listed public Azure regions are supported, not government regions.');
  }
  if (deployment === 'dataZone' && (model === 'gpt-5.6-sol' || model === 'gpt-5.6-terra')) {
    // Published Data Zone rates (Sol 11/66, Terra 4.4/26.4) do not establish
    // availability: neither model appears in the Learn Data Zone table.
    return unavailable('Conflicting/unconfirmed Priority availability: Azure publishes Data Zone prices for this model, but the official Data Zone availability table does not list it.');
  }
  if (model === 'gpt-4.1-mini') {
    return unavailable('Conflicting/unconfirmed Priority availability: pricing is published, but the official availability tables do not list GPT-4.1-mini.');
  }
  if (!Object.hasOwn(PRIORITY_RATES[deployment], model)) {
    return unavailable('Priority processing and exact prices are not verified for this model and deployment.');
  }

  return {
    ...metadata, ...PRIORITY_RATES[deployment][model], available: true,
    source: 'published', sourceUrl: PRICING_URL, reason: null,
  };
}

function hasPricing(pricing) {
  return pricing != null && pricing.available !== false
    && Number.isFinite(pricing.input) && pricing.input >= 0
    && Number.isFinite(pricing.output) && pricing.output >= 0;
}

/**
 * Apply the same Priority token percentage separately to input and output.
 * Volumes are in millions. standardCost/priorityCost are allocated tier costs,
 * not hypothetical all-Standard/all-Priority baselines. An inactive tier needs
 * no quote; an active missing tier never falls back or becomes a free quote.
 */
export function calculateMixedTokenCost({
  inputMillions, outputMillions, priorityShare, standardPricing, priorityPricing,
} = {}) {
  for (const [name, value] of Object.entries({ inputMillions, outputMillions, priorityShare })) {
    if (!Number.isFinite(value) || value < 0 || (name === 'priorityShare' && value > 100)) {
      throw new RangeError(`${name} must be a finite nonnegative number${name === 'priorityShare' ? ' from 0 to 100' : ''}.`);
    }
  }

  const usesStandard = priorityShare < 100;
  const usesPriority = priorityShare > 0;
  const totalTokens = inputMillions + outputMillions;
  const activePricing = usesPriority ? priorityPricing : standardPricing;
  const pricing = {
    input: null, output: null, available: false,
    source: usesStandard && usesPriority ? 'mixed' : (activePricing?.source ?? 'custom'),
    standard: standardPricing, priority: priorityPricing, priorityShare,
    context: activePricing?.context ?? (usesStandard ? standardPricing?.context : null) ?? null,
    sourceUrl: activePricing?.sourceUrl ?? (usesStandard ? standardPricing?.sourceUrl : null) ?? null,
  };
  const unavailable = (reason) => ({
    available: false, reason, totalCost: null, inputCost: null, outputCost: null,
    inputPrice: null, outputPrice: null, priorityShare,
    standardCost: null, priorityCost: null,
    inputTokens: inputMillions, outputTokens: outputMillions, pricing,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : null,
    effectiveCostPerMillionTokens: null,
    breakdown: {
      inputTokens: inputMillions, outputTokens: outputMillions,
      inputRate: null, outputRate: null,
    },
  });
  if (usesStandard && !hasPricing(standardPricing)) {
    return unavailable('Standard pricing unavailable: a complete, finite, nonnegative quote is required for the Standard token share.');
  }
  if (usesPriority && !hasPricing(priorityPricing)) {
    return unavailable(`Priority pricing unavailable: ${priorityPricing?.reason || 'a complete, finite, nonnegative quote is required for the Priority token share.'}`);
  }
  if (usesStandard && usesPriority && standardPricing.context && priorityPricing.context
      && standardPricing.context !== priorityPricing.context) {
    return unavailable('Standard and Priority pricing context tiers do not match.');
  }

  const priorityFraction = priorityShare / 100;
  const standardFraction = 1 - priorityFraction;
  const standardInputPrice = usesStandard ? standardPricing.input * standardFraction : 0;
  const standardOutputPrice = usesStandard ? standardPricing.output * standardFraction : 0;
  const priorityInputPrice = usesPriority ? priorityPricing.input * priorityFraction : 0;
  const priorityOutputPrice = usesPriority ? priorityPricing.output * priorityFraction : 0;
  const inputPrice = standardInputPrice + priorityInputPrice;
  const outputPrice = standardOutputPrice + priorityOutputPrice;
  const inputCost = inputMillions * inputPrice;
  const outputCost = outputMillions * outputPrice;
  const totalCost = inputCost + outputCost;
  const standardCost = inputMillions * standardInputPrice + outputMillions * standardOutputPrice;
  const priorityCost = inputMillions * priorityInputPrice + outputMillions * priorityOutputPrice;
  if (![totalTokens, inputPrice, outputPrice, inputCost, outputCost, totalCost, standardCost, priorityCost].every(Number.isFinite)) {
    return unavailable('Mixed token cost exceeds the finite numeric range.');
  }

  return {
    available: true, reason: null, totalCost, inputCost, outputCost,
    inputPrice, outputPrice, priorityShare, standardCost, priorityCost,
    inputTokens: inputMillions, outputTokens: outputMillions,
    totalTokens,
    effectiveCostPerMillionTokens: totalTokens > 0 ? totalCost / totalTokens : 0,
    pricing: { ...pricing, input: inputPrice, output: outputPrice, available: true },
    breakdown: {
      inputTokens: inputMillions, outputTokens: outputMillions,
      inputRate: inputPrice, outputRate: outputPrice,
    },
  };
}
