import corrected from '../src/corrected_pricing_data.json' assert { type: 'json' };
import { getTokenPricing } from '../src/official_token_pricing.js';

function generateReport() {
  const monthlyHoursFactor = 24 * 30.4167; // ~730 hours
  const report = [];

  for (const [modelId, modelData] of Object.entries(corrected.models)) {
    const paygoGlobal = modelData.paygo?.global || {};
    const ptuGlobalHourly = modelData.ptu?.global || 1.00;
    const reservationMonthly = modelData.reservations?.monthly || Math.round(ptuGlobalHourly * monthlyHoursFactor);
    const reservationYearly = modelData.reservations?.yearly || Math.round(reservationMonthly * 12 * 0.7);
    const minPTUGlobal = modelData.minPTU?.global || 15;

    // token pricing fallback
    const tokenPricing = getTokenPricing(modelId);

    // Build model report
    report.push({
      modelId,
      displayName: modelData.displayName || modelId,
      minPTU: {
        global: modelData.minPTU?.global || null,
        dataZone: modelData.minPTU?.dataZone || null,
        regional: modelData.minPTU?.regional || null
      },
      paygo: {
        global: paygoGlobal.input ?? null,
        globalOutput: paygoGlobal.output ?? null,
        tokenPricingFallback: tokenPricing
      },
      ptu: {
        hourlyGlobal: ptuGlobalHourly,
        monthlyPerPTU: reservationMonthly,
        yearlyPerPTU: reservationYearly
      }
    });
  }

  return report;
}

const report = generateReport();
console.log(JSON.stringify(report, null, 2));
