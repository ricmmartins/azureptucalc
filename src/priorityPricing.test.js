import { describe, expect, it } from 'vitest';
import { calculateMixedTokenCost, getPriorityPricing } from './priorityPricing.js';

const pricingUrl = 'https://azure.microsoft.com/en-us/pricing/details/azure-openai/';
const availabilityUrl = 'https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/priority-processing';

const publishedRates = [
  ['gpt-5.6-sol', 'global', 10, 60],
  ['gpt-5.6-terra', 'global', 4, 24],
  ['gpt-5.5', 'global', 12.5, 75],
  ['gpt-5.4', 'global', 5, 30],
  ['gpt-5.4-mini', 'global', 1.5, 9],
  ['gpt-5.2', 'global', 3.5, 28],
  ['gpt-5.1', 'global', 2.5, 20],
  ['gpt-4.1', 'global', 3.5, 14],
  ['gpt-5.5', 'dataZone', 13.75, 82.5],
  ['gpt-5.4', 'dataZone', 5.5, 33],
  ['gpt-5.4-mini', 'dataZone', 1.65, 9.9],
  ['gpt-5.2', 'dataZone', 3.85, 30.8],
  ['gpt-5.1', 'dataZone', 2.75, 22],
  ['gpt-4.1', 'dataZone', 3.85, 15.4],
];

describe('verified deployment-specific Priority pricing', () => {
  it.each(publishedRates)('%s %s matches the rendered official USD table', (model, deployment, input, output) => {
    expect(getPriorityPricing(model, deployment, 'eastus2')).toEqual({
      model, deployment, region: 'eastus2', input, output, available: true,
      context: 'short', source: 'published', sourceUrl: pricingUrl,
      verifiedAt: '2026-09-18', reason: null,
    });
  });

  it.each([
    'australiaeast', 'brazilsouth', 'canadacentral', 'canadaeast', 'centralus',
    'eastus', 'eastus2', 'francecentral', 'germanywestcentral', 'italynorth',
    'japaneast', 'koreacentral', 'northcentralus', 'norwayeast', 'polandcentral',
    'southafricanorth', 'southcentralus', 'southeastasia', 'southindia',
    'spaincentral', 'swedencentral', 'switzerlandnorth', 'switzerlandwest',
    'uaenorth', 'uksouth', 'westeurope', 'westus', 'westus3',
  ])('accepts the explicitly documented Global region %s for all supported models', (region) => {
    for (const [model, deployment] of publishedRates.filter((row) => row[1] === 'global')) {
      expect(getPriorityPricing(model, deployment, region).available).toBe(true);
    }
  });

  it.each([
    'centralus', 'eastus', 'eastus2', 'northcentralus', 'southcentralus', 'westus', 'westus3',
  ])('accepts the explicitly documented US Data Zone region %s', (region) => {
    for (const [model, deployment] of publishedRates.filter((row) => row[1] === 'dataZone')) {
      expect(getPriorityPricing(model, deployment, region).available).toBe(true);
    }
  });

  it.each([
    ['gpt-5.6-luna', 'global', 'eastus2'],
    ['gpt-5.6-luna', 'dataZone', 'eastus2'],
    ['gpt-4.1-mini', 'global', 'eastus2'],
    ['gpt-4.1-mini', 'dataZone', 'eastus2'],
    ['gpt-5.6-sol', 'dataZone', 'eastus2'],
    ['gpt-5.6-terra', 'dataZone', 'eastus2'],
    ['gpt-5.5', 'dataZone', 'westeurope'],
    ['gpt-5.5', 'dataZone', 'swedencentral'],
    ['gpt-5.5', 'dataZone', 'canadacentral'],
    ['gpt-5.5', 'regional', 'eastus2'],
    ['gpt-5.5', 'global', 'usgovvirginia'],
    ['gpt-5.5', 'dataZone', 'usgovarizona'],
    ['gpt-5.5', 'global', 'westus2'],
    ['gpt-5.5', 'dataZone', 'westus2'],
    ['gpt-5.5', 'global', 'northeurope'],
    ['gpt-5.5', 'global', undefined],
    ['gpt-5.5', undefined, 'eastus2'],
    ['gpt-5.5', 'unknown', 'eastus2'],
    ['gpt-5.5', 'Global', 'eastus2'],
    ['gpt-5.5', 'global', 'East US 2'],
    ['gpt-5.5-pro', 'global', 'eastus2'],
    ['unknown-model', 'global', 'eastus2'],
    ['toString', 'global', 'eastus2'],
    [undefined, 'global', 'eastus2'],
  ])('fails closed for %s / %s / %s', (model, deployment, region) => {
    expect(getPriorityPricing(model, deployment, region)).toMatchObject({
      model, deployment, region, available: false, input: null, output: null,
      source: 'unavailable', sourceUrl: availabilityUrl, reason: expect.any(String),
    });
  });

  it.each(['gpt-5.6-sol', 'gpt-5.6-terra'])('explains conflicting Data Zone evidence for %s', (model) => {
    expect(getPriorityPricing(model, 'dataZone', 'eastus2').reason).toMatch(/Conflicting\/unconfirmed.*availability/);
  });

  it('returns independent quotes without exposing the rate table to mutation', () => {
    const quote = getPriorityPricing('gpt-5.6-sol', 'global', 'eastus2');
    quote.input = 0;
    expect(getPriorityPricing('gpt-5.6-sol', 'global', 'eastus2').input).toBe(10);
  });
});

describe('mixed token-share costs', () => {
  const standardPricing = Object.freeze({
    input: 5, output: 30, available: true, source: 'published', context: 'short', sourceUrl: pricingUrl,
  });
  const priorityPricing = Object.freeze(getPriorityPricing('gpt-5.6-sol', 'global', 'eastus2'));
  const base = { inputMillions: 2, outputMillions: 3, priorityShare: 25, standardPricing, priorityPricing };
  const unavailableFields = {
    available: false, reason: expect.any(String), totalCost: null,
    inputCost: null, outputCost: null, inputPrice: null, outputPrice: null,
    standardCost: null, priorityCost: null,
    effectiveCostPerMillionTokens: null,
    pricing: { input: null, output: null, available: false },
  };

  it.each([
    [0, 5, 30, 100, 0],
    [25, 6.25, 37.5, 75, 50],
    [100, 10, 60, 0, 200],
  ])('computes %s%% Priority by weighting input and output independently', (priorityShare, inputPrice, outputPrice, standardCost, priorityCost) => {
    expect(calculateMixedTokenCost({ ...base, priorityShare })).toMatchObject({
      available: true, reason: null, inputPrice, outputPrice, priorityShare,
      inputCost: 2 * inputPrice, outputCost: 3 * outputPrice,
      totalCost: standardCost + priorityCost, standardCost, priorityCost,
      inputTokens: 2, outputTokens: 3,
      totalTokens: 5, effectiveCostPerMillionTokens: (standardCost + priorityCost) / 5,
      pricing: {
        input: inputPrice, output: outputPrice, available: true,
        source: priorityShare === 25 ? 'mixed' : 'published',
        standard: standardPricing, priority: priorityPricing,
        priorityShare, context: 'short', sourceUrl: pricingUrl,
      },
      breakdown: { inputTokens: 2, outputTokens: 3, inputRate: inputPrice, outputRate: outputPrice },
    });
  });

  it('does not infer a universal Priority multiplier', () => {
    const cost = calculateMixedTokenCost({
      ...base, standardPricing: { input: 2, output: 11 },
      priorityPricing: { input: 5, output: 19 },
    });
    expect(cost).toMatchObject({ inputPrice: 2.75, outputPrice: 13, totalCost: 44.5 });
  });

  it.each([undefined, null, { available: false }, { input: NaN, output: Infinity }])('needs no Priority quote at 0%% (%j)', (inactive) => {
    expect(calculateMixedTokenCost({ ...base, priorityShare: 0, priorityPricing: inactive })).toMatchObject({
      available: true, totalCost: 100, priorityCost: 0,
      pricing: { source: 'published', context: 'short', sourceUrl: pricingUrl },
    });
  });

  it.each([undefined, null, { available: false }, { input: NaN, output: Infinity }])('needs no Standard quote at 100%% (%j)', (inactive) => {
    expect(calculateMixedTokenCost({ ...base, priorityShare: 100, standardPricing: inactive })).toMatchObject({
      available: true, totalCost: 200, standardCost: 0,
      pricing: { source: 'published', context: 'short', sourceUrl: pricingUrl },
    });
  });

  it.each([
    undefined, null, {}, { input: 1 }, { output: 1 },
    { input: null, output: 1 }, { input: 1, output: null },
    { input: '', output: 1 }, { input: 1, output: '2' },
    { input: NaN, output: 1 }, { input: 1, output: Infinity },
    { input: Infinity, output: 1 }, { input: 1, output: NaN },
    { input: -1, output: 1 }, { input: 1, output: -1 },
    { input: 1, output: 1, available: false },
  ])('rejects any required incomplete/nonfinite/unavailable tier (%j)', (invalid) => {
    for (const [key, endpoint] of [['standardPricing', 0], ['priorityPricing', 100]]) {
      for (const priorityShare of [25, endpoint]) {
        expect(calculateMixedTokenCost({ ...base, priorityShare, [key]: invalid })).toMatchObject(unavailableFields);
      }
    }
  });

  it.each([0, 25, 100])('does not waive missing active quotes at %s%% even for zero volumes', (priorityShare) => {
    expect(calculateMixedTokenCost({
      inputMillions: 0, outputMillions: 0, priorityShare,
    })).toMatchObject({ ...unavailableFields, priorityShare, totalTokens: 0 });
  });

  it('allows zero usage and explicit zero custom prices', () => {
    expect(calculateMixedTokenCost({ ...base, inputMillions: 0, outputMillions: 0 })).toMatchObject({
      available: true, inputCost: 0, outputCost: 0, totalCost: 0, standardCost: 0, priorityCost: 0,
      totalTokens: 0, effectiveCostPerMillionTokens: 0,
    });
    expect(calculateMixedTokenCost({
      ...base, priorityShare: 0, standardPricing: { input: 0, output: 0 },
    })).toMatchObject({ available: true, totalCost: 0, pricing: { source: 'custom' } });
  });

  it('preserves the source of the active tier', () => {
    expect(calculateMixedTokenCost({
      ...base, priorityShare: 0, standardPricing: { ...standardPricing, source: 'live' },
    }).pricing.source).toBe('live');
  });

  it('preserves the Priority unavailability explanation without substituting Standard', () => {
    const unsupported = getPriorityPricing('gpt-5.6-luna', 'global', 'eastus2');
    const cost = calculateMixedTokenCost({ ...base, priorityPricing: unsupported });
    expect(cost).toMatchObject(unavailableFields);
    expect(cost.reason).toContain(unsupported.reason);
  });

  it('rejects mixing incompatible context tiers, but ignores inactive metadata', () => {
    const long = { ...standardPricing, context: 'long' };
    expect(calculateMixedTokenCost({ ...base, standardPricing: long })).toMatchObject(unavailableFields);
    expect(calculateMixedTokenCost({ ...base, standardPricing: long, priorityShare: 100 }).available).toBe(true);
    expect(calculateMixedTokenCost({ ...base, standardPricing: long, priorityShare: 0 }).pricing.context).toBe('long');
  });

  it.each(['inputMillions', 'outputMillions', 'priorityShare'])('validates %s strictly without coercion', (field) => {
    for (const value of [undefined, null, NaN, Infinity, -Infinity, -1, '25', '', true]) {
      expect(() => calculateMixedTokenCost({ ...base, [field]: value })).toThrow(RangeError);
    }
  });

  it('rejects percentages above 100 and missing arguments', () => {
    expect(() => calculateMixedTokenCost({ ...base, priorityShare: 100.01 })).toThrow(RangeError);
    expect(() => calculateMixedTokenCost()).toThrow(RangeError);
  });

  it('accepts fractional volumes and percentages without rounding prices', () => {
    const cost = calculateMixedTokenCost({ ...base, inputMillions: 0.125, outputMillions: 0.5, priorityShare: 12.5 });
    expect(cost.inputPrice).toBe(5.625);
    expect(cost.outputPrice).toBe(33.75);
    expect(cost.totalCost).toBe(17.578125);
    expect(cost.totalTokens).toBe(0.625);
    expect(cost.effectiveCostPerMillionTokens).toBe(28.125);
  });

  it('fails closed on arithmetic overflow rather than returning Infinity', () => {
    expect(calculateMixedTokenCost({ ...base, inputMillions: Number.MAX_VALUE })).toMatchObject(unavailableFields);
    expect(calculateMixedTokenCost({
      ...base, priorityShare: 0, standardPricing: { input: 0, output: 0 },
      inputMillions: Number.MAX_VALUE, outputMillions: Number.MAX_VALUE,
    })).toMatchObject({ ...unavailableFields, totalTokens: null });
  });

  it('does not mutate caller-owned frozen quotes', () => {
    expect(() => calculateMixedTokenCost(Object.freeze(base))).not.toThrow();
    expect(standardPricing.input).toBe(5);
    expect(priorityPricing.input).toBe(10);
  });
});
