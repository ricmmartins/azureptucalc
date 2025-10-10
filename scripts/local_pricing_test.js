const fs = require('fs');
const path = require('path');

const corrected = require('../src/corrected_pricing_data.json');
const { getTokenPricing, calculatePAYGCost, calculateTokenSplit } = require('../src/official_token_pricing');

function testScenario() {
  const model = 'gpt-4o-mini';
  const deployment = 'global';
  const avgTPM = 50000;
  const p99TPM = 50000;
  const recommendedPTU = 15;
  const monthlyMinutes = 43800;

  const modelData = corrected.models[model];
  if (!modelData) {
    console.error('Model not found in corrected_pricing_data.json');
    process.exit(1);
  }

  const tokenPricing = getTokenPricing(model);

  // PAYGO calculation using calculateTokenSplit
  const totalMonthlyTokens = (avgTPM * monthlyMinutes) / 1000000; // in millions
  const inputTokensMillions = totalMonthlyTokens * 0.5;
  const outputTokensMillions = totalMonthlyTokens * 0.5;
  const paygo = calculatePAYGCost(model, inputTokensMillions, outputTokensMillions);

  // PTU on-demand monthly: hourly * 24 * average days (30.4167) * PTUs
  const ptuHourly = modelData.ptu[deployment];
  const hoursPerMonth = 24 * 30.4167; // ~730
  const ptuOnDemandMonthly = ptuHourly * hoursPerMonth * recommendedPTU;

  // Reservation monthly from corrected data
  const reservationMonthlyPerPTU = modelData.reservations.monthly; // $260 per PTU
  const reservationYearlyPerPTU = modelData.reservations.yearly; // $2652 per PTU
  const reservationMonthlyTotal = reservationMonthlyPerPTU * recommendedPTU;
  const reservationYearlyTotal = reservationYearlyPerPTU * recommendedPTU;
  const reservationYearlyMonthlyEquivalent = reservationYearlyTotal / 12;

  return {
    model,
    deployment,
    avgTPM,
    p99TPM,
    recommendedPTU,
    monthlyMinutes,
    totalMonthlyTokensMillion: totalMonthlyTokens,
    paygo,
    ptuOnDemandMonthly: Number(ptuOnDemandMonthly.toFixed(2)),
    reservationMonthlyPerPTU,
    reservationMonthlyTotal,
    reservationYearlyPerPTU,
    reservationYearlyTotal,
    reservationYearlyMonthlyEquivalent: Number(reservationYearlyMonthlyEquivalent.toFixed(2))
  };
}

const result = testScenario();
console.log(JSON.stringify(result, null, 2));
