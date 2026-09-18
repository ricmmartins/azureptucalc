import { describe, expect, it } from 'vitest';
import { ExportService } from './ExportService.js';

const makeFixture = () => ({
  model: 'gpt-5.6-sol',
  region: 'eastus',
  deployment: 'global',
  ptuCount: 50,
  usageScenario: 'business-hours',
  throughputNeeded: 30000,
  ptuCostCalculation: { hourly: 50, monthly: 36500, yearly: 132000 },
  paygCostCalculation: {
    inputCost: 6250,
    outputCost: 3750,
    inputPricePerK: 6.25,
    outputPricePerK: 37.5,
    inputTokens: 1e9,
    outputTokens: 1e8,
    total: 10000,
    pricing: { source: 'mixed', context: 'short-context', priorityShare: 25 }
  },
  breakEvenAnalysis: { breakEvenPTUs: 20, breakEvenTPM: 24000, breakEvenUtilization: 0.4 },
  processingScenario: {
    priorityShare: 25,
    spilloverPriorityShare: 100,
    isLatencyCritical: true,
    standardPricing: {
      available: true, source: 'custom', context: 'short-context', asOf: '2026-09-18',
      input: 5, output: 30, sourceUrl: null
    },
    priorityPricing: {
      available: true, source: 'published', context: 'short', verifiedAt: '2026-09-18',
      input: 10, output: 60, sourceUrl: 'https://azure.microsoft.com/en-us/pricing/details/azure-openai/'
    },
    assumption: 'The same fraction of input and output tokens, not requests.'
  },
  scenarioAnalysis: {
    monthlyStandardCost: 8000,
    monthlyPriorityCost: 16000,
    hybridBasePTU: 15,
    hybridBaseCost: 3300,
    hybridYearlyBaseCost: 3000,
    hybridOverflowCost: 700,
    hybridTotalCost: 4000,
    hybridYearlyTotalCost: 3700,
    spilloverUnavailableReason: null,
    recommendationDetails: {
      strategy: 'spillover',
      label: 'Consider PTU + Priority overflow',
      reason: 'Lower estimated cost, but validate "Priority" routing.',
      monthlyCost: 4000,
      costLeader: 'spillover',
      requiresReview: true,
      nextSteps: ['Measure actual overflow.'],
      considerations: ['Priority can downgrade.\nValidate latency under load.']
    },
    monthlySavings: 6000,
    yearlyReservationMonthly: 11000,
    monthlyPtuReservationCost: 13000,
    breakEvenAnalysis: { breakEvenPTUs: 25, breakEvenTPM: 30000, breakEvenUtilization: 0.5 }
  }
});

// Parse quoted cells, including embedded commas, quotes, and line breaks.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (char === ',' || char === '\n')) {
      row.push(cell);
      cell = '';
      if (char === '\n') {
        rows.push(row);
        row = [];
      }
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

describe('Priority scenario exports', () => {
  it('exports a 25% token mix with independent overflow and the shared recommendation', () => {
    const fixture = makeFixture();
    const service = new ExportService();
    const report = service.generateReport(fixture);

    expect(report.configuration.processingScenario).toEqual(fixture.processingScenario);
    expect(report.costBreakdown.payg).toMatchObject({
      inputTokens: { pricePer1M: 6.25, cost: 6250 },
      outputTokens: { pricePer1M: 37.5, cost: 3750 },
      total: 10000
    });
    expect(report.costBreakdown.baselines).toEqual({
      monthlyStandardCost: 8000,
      monthlyPriorityCost: 16000,
      yearlyReservationMonthly: 11000,
      monthlyPtuReservationCost: 13000
    });
    expect(report.costBreakdown.spillover).toMatchObject({
      priorityShare: 100, basePTU: 15, baseCost: 3300, overflowCost: 700, total: 4000,
      yearlyBaseCost: 3000, yearlyTotalCost: 3700,
      unavailableReason: null
    });
    expect(report.analysis.recommendationDetails).toEqual(fixture.scenarioAnalysis.recommendationDetails);
    expect(report.analysis.costComparison.selected).toEqual({
      strategy: 'spillover', label: fixture.scenarioAnalysis.recommendationDetails.label,
      monthlyCost: 4000, monthlySavings: 6000, costLeader: 'spillover', requiresReview: true
    });
    expect(report.analysis.costComparison.ptuVsPayg.monthly).toEqual({
      ptu: 11000, payg: 10000, difference: 1000, percentageDifference: '10.0'
    });
    expect(report.costBreakdown.breakEven.utilizationAtBreakEven).toBe(0.5);
    expect(report.analysis.recommendations).toEqual([
      fixture.scenarioAnalysis.recommendationDetails.label,
      fixture.scenarioAnalysis.recommendationDetails.reason,
      ...fixture.scenarioAnalysis.recommendationDetails.nextSteps,
      ...fixture.scenarioAnalysis.recommendationDetails.considerations
    ]);
    expect(service.generateSummaryReport().recommendation).toBe(fixture.scenarioAnalysis.recommendationDetails.label);
  });

  it('preserves exact CSV/JSON parity for scenario economics and quote metadata', () => {
    const service = new ExportService();
    const report = service.generateReport(makeFixture());
    const json = JSON.parse(service.exportAsJSON());
    expect(json).toEqual(JSON.parse(JSON.stringify(report)));
    const rows = parseCSV(service.exportAsCSV());
    const csvValue = label => rows.find(row => row[0] === label)?.[1];
    const scenario = json.configuration.processingScenario;
    const recommendation = json.analysis.recommendationDetails;
    const expected = {
      'Priority Token Share (%)': scenario.priorityShare,
      'Spillover Priority Token Share (%)': scenario.spilloverPriorityShare,
      'Latency Critical': scenario.isLatencyCritical,
      'Processing Assumption': scenario.assumption,
      'Weighted Input Price per 1M': json.costBreakdown.payg.inputTokens.pricePer1M,
      'Weighted Output Price per 1M': json.costBreakdown.payg.outputTokens.pricePer1M,
      'Standard Baseline Cost': json.costBreakdown.baselines.monthlyStandardCost,
      '100% Priority Baseline Cost': json.costBreakdown.baselines.monthlyPriorityCost,
      'Selected PAYGO Cost': json.costBreakdown.payg.total,
      'PTU 1-Year Reservation Monthly Equivalent': json.costBreakdown.baselines.yearlyReservationMonthly,
      'PTU Monthly Reservation Cost': json.costBreakdown.baselines.monthlyPtuReservationCost,
      'Spillover Base PTUs': json.costBreakdown.spillover.basePTU,
      'Spillover Base Cost': json.costBreakdown.spillover.baseCost,
      'Spillover 1-Year Base Monthly Equivalent': json.costBreakdown.spillover.yearlyBaseCost,
      'Spillover Overflow Cost': json.costBreakdown.spillover.overflowCost,
      'Spillover Total Cost': json.costBreakdown.spillover.total,
      'Spillover 1-Year Total Monthly Equivalent': json.costBreakdown.spillover.yearlyTotalCost,
      'Spillover Unavailable Reason': json.costBreakdown.spillover.unavailableReason,
      'Recommended Strategy': recommendation.strategy,
      'Recommendation Label': recommendation.label,
      'Recommendation Reason': recommendation.reason,
      'Recommendation Monthly Cost': recommendation.monthlyCost,
      'Recommendation Requires Review': recommendation.requiresReview,
      'Cost Leader': recommendation.costLeader,
      'Monthly Savings': json.analysis.costComparison.selected.monthlySavings,
      'Next Step': recommendation.nextSteps[0],
      'Consideration': recommendation.considerations[0]
    };
    for (const [tier, quote] of [['Standard', scenario.standardPricing], ['Priority', scenario.priorityPricing]]) {
      Object.assign(expected, {
        [`${tier} Available`]: quote.available,
        [`${tier} Price Source`]: quote.source,
        [`${tier} Context`]: quote.context,
        [`${tier} Price Date`]: quote.verifiedAt ?? quote.asOf,
        [`${tier} Reference`]: quote.sourceUrl,
        [`${tier} Input Price per 1M`]: quote.input,
        [`${tier} Output Price per 1M`]: quote.output,
        [`${tier} Unavailable Reason`]: quote.reason
      });
    }
    for (const [label, value] of Object.entries(expected)) {
      expect(csvValue(label), label).toBe(String(value ?? 'N/A'));
    }
    expect(csvValue('Utilization at Break-Even')).toBe('50.0%');
  });

  it('keeps unsupported Priority and spillover costs null without changing Standard-only selection', () => {
    const fixture = makeFixture();
    fixture.processingScenario.priorityShare = 0;
    fixture.processingScenario.priorityPricing = {
      available: false, source: 'unavailable', input: null, output: null,
      reason: 'Unsupported deployment, no verified availability.'
    };
    fixture.scenarioAnalysis.monthlyPriorityCost = null;
    fixture.scenarioAnalysis.hybridOverflowCost = null;
    fixture.scenarioAnalysis.hybridTotalCost = null;
    fixture.scenarioAnalysis.spilloverUnavailableReason = fixture.processingScenario.priorityPricing.reason;
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.configuration.processingScenario.priorityShare).toBe(0);
    expect(report.configuration.processingScenario.spilloverPriorityShare).toBe(100);
    expect(report.costBreakdown.baselines.monthlyPriorityCost).toBeNull();
    expect(report.costBreakdown.spillover.overflowCost).toBeNull();
    expect(report.costBreakdown.spillover.total).toBeNull();
    const csv = service.exportAsCSV();
    expect(csv).toContain('100% Priority Baseline Cost,N/A');
    expect(csv).toContain('Spillover Total Cost,N/A');
    expect(parseCSV(csv)).toContainEqual(['Priority Unavailable Reason', fixture.processingScenario.priorityPricing.reason]);
    expect(parseCSV(csv)).toContainEqual(['Spillover Unavailable Reason', fixture.processingScenario.priorityPricing.reason]);
  });

  it('exports review with null recommended cost, not a substituted economic leader cost', () => {
    const fixture = makeFixture();
    fixture.scenarioAnalysis.recommendationDetails = {
      strategy: 'review', label: 'Review latency requirements', reason: 'Validate before purchasing.',
      monthlyCost: null, costLeader: 'paygo', requiresReview: true,
      nextSteps: [], considerations: []
    };
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.analysis.costComparison.selected.monthlyCost).toBeNull();
    expect(JSON.parse(service.exportAsJSON()).analysis.recommendationDetails.monthlyCost).toBeNull();
    expect(service.exportAsCSV()).toContain('Recommendation Monthly Cost,N/A');
    expect(service.exportAsCSV()).toContain('Recommendation Requires Review,true');
    expect(report.analysis.recommendations).toEqual(['Review latency requirements', 'Validate before purchasing.']);
  });

  it.each([null, undefined])('preserves unavailable annual spillover costs (%s)', value => {
    const fixture = makeFixture();
    fixture.scenarioAnalysis.hybridYearlyBaseCost = value;
    fixture.scenarioAnalysis.hybridYearlyTotalCost = value;
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.costBreakdown.spillover.yearlyBaseCost).toBeNull();
    expect(report.costBreakdown.spillover.yearlyTotalCost).toBeNull();
    expect(report.costBreakdown.spillover.total).toBe(4000);
    expect(report.costBreakdown.spillover.overflowCost).toBe(700);
    const json = JSON.parse(service.exportAsJSON());
    expect(json.costBreakdown.spillover.yearlyBaseCost).toBeNull();
    expect(json.costBreakdown.spillover.yearlyTotalCost).toBeNull();
    const rows = parseCSV(service.exportAsCSV());
    expect(rows).toContainEqual(['Spillover 1-Year Base Monthly Equivalent', 'N/A']);
    expect(rows).toContainEqual(['Spillover 1-Year Total Monthly Equivalent', 'N/A']);
  });

  it('retains the recommended annual spillover term without replacing monthly-base totals', () => {
    const fixture = makeFixture();
    fixture.scenarioAnalysis.recommendationDetails.label = 'Spillover — PTU 1-Year Reservation';
    fixture.scenarioAnalysis.recommendationDetails.monthlyCost = 3700;
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.costBreakdown.spillover.total).toBe(4000);
    expect(report.costBreakdown.spillover.yearlyTotalCost).toBe(3700);
    expect(report.analysis.costComparison.selected.monthlyCost).toBe(3700);
    expect(report.analysis.recommendationDetails.label).toBe('Spillover — PTU 1-Year Reservation');
    const rows = parseCSV(service.exportAsCSV());
    expect(rows).toContainEqual(['Recommendation Monthly Cost', '3700']);
    expect(rows).toContainEqual(['Spillover Total Cost', '4000']);
    expect(rows).toContainEqual(['Spillover 1-Year Total Monthly Equivalent', '3700']);
  });

  it('does not coerce unavailable selected PAYGO to zero in economic comparisons', () => {
    const fixture = makeFixture();
    fixture.paygCostCalculation.total = null;
    fixture.paygCostCalculation.inputCost = null;
    fixture.paygCostCalculation.outputCost = null;
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.costBreakdown.payg.total).toBeNull();
    expect(report.analysis.costComparison.ptuVsPayg.monthly).toEqual({
      ptu: 11000, payg: null, difference: null, percentageDifference: 'N/A'
    });
    const csv = service.exportAsCSV();
    expect(csv).toContain('Selected PAYGO Cost,N/A');
    expect(csv).toContain('Total,,,N/A');
    expect(csv).not.toContain('$null');
    expect(csv).not.toContain('N/A%');
    expect(service.generateSummaryReport().paygCost).toBe('Unavailable');
  });

  it('preserves zero costs, shares, utilization, and false review flags', () => {
    const fixture = makeFixture();
    fixture.processingScenario.priorityShare = 0;
    fixture.processingScenario.spilloverPriorityShare = 0;
    fixture.processingScenario.isLatencyCritical = false;
    Object.assign(fixture.scenarioAnalysis, {
      monthlyStandardCost: 0, monthlyPriorityCost: 0, hybridBasePTU: 0,
      hybridBaseCost: 0, hybridOverflowCost: 0, hybridTotalCost: 0, monthlySavings: 0,
      hybridYearlyBaseCost: 0, hybridYearlyTotalCost: 0,
      yearlyReservationMonthly: 0, monthlyPtuReservationCost: 0,
      breakEvenAnalysis: { breakEvenPTUs: 0, breakEvenTPM: 0, breakEvenUtilization: 0 }
    });
    fixture.scenarioAnalysis.recommendationDetails.monthlyCost = 0;
    fixture.scenarioAnalysis.recommendationDetails.requiresReview = false;
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.costBreakdown.baselines.monthlyStandardCost).toBe(0);
    expect(report.costBreakdown.spillover.total).toBe(0);
    expect(report.analysis.costComparison.selected.monthlyCost).toBe(0);
    const rows = parseCSV(service.exportAsCSV());
    for (const label of [
      'Priority Token Share (%)', 'Spillover Priority Token Share (%)', 'Standard Baseline Cost',
      '100% Priority Baseline Cost', 'Spillover Total Cost', 'Recommendation Monthly Cost',
      'Spillover 1-Year Base Monthly Equivalent', 'Spillover 1-Year Total Monthly Equivalent',
      'Break-Even PTUs', 'Break-Even TPM', 'Monthly Savings'
    ]) {
      expect(rows).toContainEqual([label, '0']);
    }
    expect(rows).toContainEqual(['Latency Critical', 'false']);
    expect(rows).toContainEqual(['Recommendation Requires Review', 'false']);
    expect(rows).toContainEqual(['Utilization at Break-Even', '0.0%']);
  });

  it('supports 100% Priority without a Standard baseline or quote', () => {
    const fixture = makeFixture();
    fixture.processingScenario.priorityShare = 100;
    fixture.processingScenario.standardPricing = { available: false, reason: 'No Standard quote.' };
    fixture.scenarioAnalysis.monthlyStandardCost = null;
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.costBreakdown.baselines.monthlyStandardCost).toBeNull();
    expect(report.costBreakdown.baselines.monthlyPriorityCost).toBe(16000);
    expect(service.exportAsCSV()).toContain('Standard Baseline Cost,N/A');
    expect(service.exportAsCSV()).toContain('100% Priority Baseline Cost,16000');
  });

  it.each([
    [{ breakEvenUtilization: 0.4 }, 0.4],
    [{ utilizationAtBreakEven: 0.3 }, 0.3],
    [{ utilizationAtBreakEven: 0, breakEvenUtilization: 0.4 }, 0]
  ])('preserves legacy callers and break-even inputs %j', (breakEvenAnalysis, expected) => {
    const fixture = makeFixture();
    delete fixture.processingScenario;
    delete fixture.scenarioAnalysis;
    fixture.breakEvenAnalysis = breakEvenAnalysis;
    const service = new ExportService();
    const report = service.generateReport(fixture);
    expect(report.costBreakdown.breakEven.utilizationAtBreakEven).toBe(expected);
    expect(report.analysis.costComparison.ptuVsPayg.monthly.ptu).toBe(36500);
    expect(report.analysis.recommendations[0]).toContain('PAYG is');
    expect(service.exportAsCSV()).not.toContain('PROCESSING SCENARIO');
    expect(service.exportAsCSV()).not.toContain('SCENARIO MONTHLY COSTS');
    expect(JSON.parse(service.exportAsJSON()).configuration).not.toHaveProperty('processingScenario');
  });
});
