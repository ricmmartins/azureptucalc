// Official PTU Pricing Configuration aligned with Microsoft's standard
// US$1 per PTU per hour base rate with appropriate regional and deployment multipliers

export const OFFICIAL_PTU_PRICING = {
  // Base rate: US$1 per PTU per hour (Microsoft standard)
  BASE_HOURLY_RATE: 1.00,
  
  // Deployment type multipliers (official Azure pricing)
  // Source: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/
  DEPLOYMENT_MULTIPLIERS: {
    global: 1.0,       // Global: $1.00/PTU/hr (base price)
    dataZone: 1.1,     // Data Zone: $1.10/PTU/hr (10% premium)
    regional: 2.0      // Regional: $2.00/PTU/hr (100% premium)
  },
  // Reservation pricing per deployment type (official Azure pricing)
  RESERVATION_OVERRIDES: {
    global:   { monthly: 260, yearly: 2652 },
    dataZone: { monthly: 286, yearly: 2916 },
    regional: { monthly: 286, yearly: 2916 }
  },
  // Min PTU per deployment type (official Azure pricing)
  MIN_PTU: {
    global: 15,
    dataZone: 15,
    regional: 50
  }
};

// Calculate official PTU pricing
// PTU pricing is uniform per deployment type (same rate across all regions within a deployment type)
export const calculateOfficialPTUPricing = (region, deploymentType) => {
  const baseRate = OFFICIAL_PTU_PRICING.BASE_HOURLY_RATE;
  const deploymentMultiplier = OFFICIAL_PTU_PRICING.DEPLOYMENT_MULTIPLIERS[deploymentType] || 1.0;
  
  // PTU hourly rate is purely based on deployment type (same across all regions)
  const hourlyRate = baseRate * deploymentMultiplier;
  
  // Use official reservation overrides if available
  const reservations = OFFICIAL_PTU_PRICING.RESERVATION_OVERRIDES?.[deploymentType];
  const reservationMonthly = reservations?.monthly || (hourlyRate * 730);
  const reservationYearly = reservations?.yearly || (reservationMonthly * 12 * 0.3027);
  
  // Calculate discount percentages
  const hourlyAnnualized = hourlyRate * 730 * 12;
  const monthlyAnnualized = reservationMonthly * 12;
  
  return {
    hourly: Number(hourlyRate.toFixed(3)),
    monthly: Number((hourlyRate * 730).toFixed(2)),
    reservationMonthly: Number(reservationMonthly.toFixed(2)),
    yearly: Number(reservationYearly.toFixed(2)),
    discount: {
      monthlyVsHourly: Number(((1 - (reservationMonthly / (hourlyRate * 730))) * 100).toFixed(1)),
      yearlyVsMonthly: Number(((1 - (reservationYearly / monthlyAnnualized)) * 100).toFixed(1)),
      yearlyVsHourly: Number(((1 - (reservationYearly / hourlyAnnualized)) * 100).toFixed(1))
    },
    multipliers: {
      deployment: deploymentMultiplier
    }
  };
};
