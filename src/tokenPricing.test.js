import { describe, expect, it, vi, afterEach } from 'vitest';
import { calculatePAYGCost, getTokenPricing, resolveTokenPricing } from './official_token_pricing.js';
import AzureOpenAIPricingService from './enhanced_pricing_service.js';
import ExternalPricingService from './ExternalPricingService.js';
import { ExportService } from './ExportService.js';
import externalConfig from './external_pricing_config.json';
import { parsePaygoItems } from '../api/azure-pricing.js';

afterEach(() => vi.unstubAllGlobals());

const publishedRates = [
  ['gpt-5.6-sol', 'global', 5, 30],
  ['gpt-5.6-sol', 'dataZone', 5.5, 33],
  ['gpt-5.6-terra', 'global', 2, 12],
  ['gpt-5.6-luna', 'global', 0.2, 1.2],
  ['gpt-5.6-luna', 'dataZone', 0.22, 1.32],
];

describe.each(publishedRates)('%s %s published PAYGO', (model, deployment, input, output) => {
  it('returns verified short-context rates, not GPT-4o Mini prices', () => {
    expect(getTokenPricing(model, deployment)).toMatchObject({
      input, output, available: true, source: 'published', context: 'short', verifiedAt: '2026-09-18'
    });
    expect(new ExternalPricingService().getTokenPricing(model, deployment)).toMatchObject({ input, output });
    expect(new AzureOpenAIPricingService().getFallbackPricing(model, deployment).paygo).toMatchObject({ input, output });
    if (deployment === 'global') {
      expect(externalConfig.tokenPricing[model]).toEqual({ input, output });
    }
  });

  it('uses those deployment rates in the cost breakdown', () => {
    expect(calculatePAYGCost(model, 2, 3, deployment)).toMatchObject({
      inputCost: 2 * input,
      outputCost: 3 * output,
      totalCost: 2 * input + 3 * output,
      breakdown: { inputRate: input, outputRate: output }
    });
  });
});

describe.each([
  ['unknown-model', 'global'],
  ['gpt-5.6-sol', 'regional'],
  ['gpt-5.6-terra', 'regional'],
  ['gpt-5.6-terra', 'dataZone'],
  ['gpt-5.6-luna', 'regional'],
])('%s %s missing prices', (model, deployment) => {
  it('does not substitute another model, deployment, or zero-cost result', () => {
    expect(getTokenPricing(model, deployment)).toMatchObject({ input: null, output: null, available: false });
    expect(new ExternalPricingService().getTokenPricing(model, deployment).available).toBe(false);
    expect(new AzureOpenAIPricingService().getFallbackPricing(model, deployment).paygo.available).toBe(false);
    expect(() => calculatePAYGCost(model, 1, 1, deployment)).toThrow(/pricing unavailable/);
  });
});

const liveQuote = (overrides = {}) => ({
  model: 'gpt-5.6-sol', deployment: 'dataZone', source: 'live',
  paygo: { context: 'short', byDeployment: { dataZone: { input: 6, output: 36 } } },
  ...overrides,
});

it('uses a complete matching live quote in calculation and export', () => {
  const pricing = resolveTokenPricing('gpt-5.6-sol', 'dataZone', liveQuote());
  expect(pricing).toMatchObject({ source: 'live', input: 6, output: 36 });
  const cost = calculatePAYGCost('gpt-5.6-sol', 1, 1, 'dataZone', pricing);
  expect(cost.totalCost).toBe(42);
  const service = new ExportService();
  service.generateReport({
    model: 'gpt-5.6-sol', deployment: 'dataZone', ptuCount: 15,
    ptuCostCalculation: { hourly: 16.5, monthly: 4290, yearly: 43740 },
    paygCostCalculation: { pricing: cost.pricing, inputCost: cost.inputCost, outputCost: cost.outputCost, total: cost.totalCost,
      inputPricePerK: cost.breakdown.inputRate, outputPricePerK: cost.breakdown.outputRate },
    breakEvenAnalysis: {},
  });
  expect(JSON.parse(service.exportAsJSON()).costBreakdown.payg).toMatchObject({
    total: 42, inputTokens: { pricePer1M: 6 }, outputTokens: { pricePer1M: 36 }
  });
  expect(JSON.parse(service.exportAsJSON()).configuration.paygoPricing).toMatchObject({ source: 'live', context: 'short' });
  expect(service.exportAsCSV()).toContain('PAYGO Context,short');
});

it.each([
  liveQuote({ model: 'gpt-4o-mini' }),
  liveQuote({ deployment: 'global' }),
  liveQuote({ source: 'fallback' }),
  liveQuote({ paygo: { input: 0.15, output: 0.6 } }),
  liveQuote({ paygo: { context: 'short', byDeployment: { global: { input: 5, output: 30 } } } }),
  liveQuote({ paygo: { context: 'short', byDeployment: { dataZone: { input: 6, output: 0 } } } }),
  liveQuote({ paygo: { context: 'long', byDeployment: { dataZone: { input: 11, output: 49.5 } } } }),
])('rejects mismatched, partial and unclassified live quotes %#', (quote) => {
  expect(resolveTokenPricing('gpt-5.6-sol', 'dataZone', quote)).toMatchObject({
    source: 'published', input: 5.5, output: 33
  });
});

it('honors custom rates including explicit zero, but rejects blank/partial rates', () => {
  expect(calculatePAYGCost('gpt-5.6-sol', 2, 3, 'global', { input: 7, output: 40 }).totalCost).toBe(134);
  expect(calculatePAYGCost('unknown', 2, 3, 'global', { input: 0, output: 0 }).totalCost).toBe(0);
  expect(() => calculatePAYGCost('unknown', 1, 1, 'global', { input: '', output: 0 })).toThrow();
  expect(() => calculatePAYGCost('unknown', 1, 1, 'global', { input: 1 })).toThrow();
});

it('falls back to exact deployment prices when the API is unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    headers: new Headers({ 'content-type': 'text/html' })
  }));
  const service = new AzureOpenAIPricingService();
  expect(await service.getPricing('gpt-5.6-sol', 'eastus2', 'dataZone')).toMatchObject({
    model: 'gpt-5.6-sol', region: 'eastus2', deployment: 'dataZone',
    source: 'fallback', paygo: { input: 5.5, output: 33 }
  });
});

it('retains live quote identity and does not fill missing token prices with another deployment', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ success: true, ptu: { global: 1 }, paygo: { input: 0, output: 0 } })
  }));
  const quote = await new AzureOpenAIPricingService().getPricing('gpt-5.6-sol', 'eastus2', 'regional');
  expect(quote).toMatchObject({ model: 'gpt-5.6-sol', region: 'eastus2', deployment: 'regional' });
  expect(resolveTokenPricing('gpt-5.6-sol', 'regional', quote).available).toBe(false);
});

it('does not change existing supported model prices', () => {
  expect(getTokenPricing('gpt-4o-mini')).toMatchObject({ input: 0.15, output: 0.6, available: true });
  expect(getTokenPricing('gpt-5.5', 'dataZone')).toMatchObject({ input: 5.5, output: 33, available: true });
});

it('only parses GPT-5.6 standard short-context meters, never cache, priority or long context', () => {
  const meter = (name, price) => ({
    meterName: name, skuName: '', productName: 'Azure OpenAI GPT5',
    unitOfMeasure: '1M Tokens', retailPrice: price
  });
  const result = parsePaygoItems([
    meter('GPT 5.6 Sol long context input Global', 10),
    meter('GPT 5.6 Sol short context cache writes input Global', 6.25),
    meter('GPT 5.6 Sol short context priority output Global', 60),
    meter('GPT 5.6 Sol input Global', 99),
    meter('GPT 5.6 Sol short context input Global', 5),
    meter('GPT 5.6 Sol short context output Global', 30),
    meter('GPT 5.6 Sol short context input Data Zone', 5.5),
    meter('GPT 5.6 Sol short context output Data Zone', 33),
  ], 'gpt-5.6-sol');
  expect(result).toMatchObject({
    context: 'short',
    byDeployment: { global: { input: 5, output: 30 }, dataZone: { input: 5.5, output: 33 } }
  });
});
