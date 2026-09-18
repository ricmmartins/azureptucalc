import { describe, expect, it } from 'vitest';
import { getProcessingRecommendation } from './processingRecommendation.js';

const scenario = {
  monthlyPaygoCost: 100,
  monthlyPtuReservationCost: 3900,
  yearlyReservationMonthly: 3315,
  hybridTotalCost: 4000,
  priorityShare: 0,
  spilloverPriorityShare: 0,
  isLatencyCritical: false,
  priorityAvailable: true
};

describe('processing recommendations', () => {
  it('preserves Standard PAYGO for a cost-only workload', () => {
    expect(getProcessingRecommendation(scenario)).toMatchObject({
      strategy: 'paygo', label: 'PAYGO Standard', monthlyCost: 100, requiresReview: false
    });
  });
  it('does not claim cheap Standard satisfies a latency requirement', () => {
    expect(getProcessingRecommendation({ ...scenario, isLatencyCritical: true })).toMatchObject({
      strategy: 'review', label: 'Evaluate PAYGO with Priority Processing', monthlyCost: null,
      costLeader: 'PAYGO Standard', requiresReview: true
    });
  });
  it('does not recommend unsupported Priority for Luna or an ineligible location', () => {
    expect(getProcessingRecommendation({
      ...scenario, priorityAvailable: false, isLatencyCritical: true
    })).toMatchObject({ strategy: 'review', label: 'Review latency requirements', monthlyCost: null });
  });
  it('uses the actual selected mixed cost and identifies the covered share', () => {
    expect(getProcessingRecommendation({
      ...scenario, priorityShare: 25, monthlyPaygoCost: 125, isLatencyCritical: true
    })).toMatchObject({
      strategy: 'paygo', label: 'PAYGO with Priority Processing (25%)', monthlyCost: 125
    });
  });
  it('switches to PTU when the mixed scenario crosses break-even', () => {
    expect(getProcessingRecommendation({
      ...scenario, priorityShare: 100, monthlyPaygoCost: 5000
    })).toMatchObject({ strategy: 'ptu', label: 'PTU 1-Year Reservation', monthlyCost: 3315 });
  });
  it('does not recommend hybrid just from a utilization threshold', () => {
    expect(getProcessingRecommendation({
      ...scenario, hybridTotalCost: 80, spilloverPriorityShare: 40, isLatencyCritical: true
    })).toMatchObject({ strategy: 'spillover', monthlyCost: 80, label: 'PTU (monthly) + Priority spillover (40%)' });
  });
  it('compares yearly-base spillover without confusing reservation terms', () => {
    expect(getProcessingRecommendation({
      ...scenario, hybridTotalCost: 120, hybridYearlyTotalCost: 90, spilloverPriorityShare: 25
    })).toMatchObject({ strategy: 'spillover', monthlyCost: 90, label: 'PTU (1-year) + Priority spillover (25%)' });
  });
  it('qualifies the Standard overflow tier when latency matters', () => {
    expect(getProcessingRecommendation({
      ...scenario, hybridTotalCost: 80, isLatencyCritical: true
    })).toMatchObject({ strategy: 'review', label: 'Review spillover latency', monthlyCost: null });
  });
  it('excludes unavailable spillover instead of treating it as free', () => {
    expect(getProcessingRecommendation({ ...scenario, hybridTotalCost: null }).strategy).toBe('paygo');
  });
  it('preserves zero custom rates and never produces NaN or Infinity', () => {
    expect(getProcessingRecommendation({ ...scenario, monthlyPaygoCost: 0 }).monthlyCost).toBe(0);
    expect(() => getProcessingRecommendation({ ...scenario, monthlyPaygoCost: NaN })).toThrow(RangeError);
  });
});
