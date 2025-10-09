// Official PTU Pricing Configuration aligned with Microsoft's standard
// US$1 per PTU per hour base rate with appropriate regional and deployment multipliers

export const OFFICIAL_PTU_PRICING = {
  // Base rate: US$1 per PTU per hour (Microsoft standard)
  BASE_HOURLY_RATE: 1.00,
  
  // Official discount structure
  DISCOUNTS: {
    monthly: 0.0,      // Monthly reservation: no discount (base price)
    yearly: 0.30       // Yearly reservation: 30% discount
  },
  
  // Deployment type multipliers (official Azure pricing)
  DEPLOYMENT_MULTIPLIERS: {
    regional: 1.0,     // Regional: base price
    dataZone: 1.2,     // Data Zone: 20% premium
    // Global should be base price per user's confirmation
    global: 1.0
  },
  // Optional explicit reservation monthly override (per PTU) to reflect Azure reservation pricing
  // If set, this value will be used for reservation monthly cost instead of hourly*730
  RESERVATION_MONTHLY_OVERRIDE: null, // e.g., 260
  
  // Regional multipliers (based on Azure cost factors)
  REGIONAL_MULTIPLIERS: {
    'eastus': 1.0,          // East US: base price
    'eastus2': 1.0,         // East US 2: base price
    'westus': 1.05,         // West US: 5% premium
    'westus2': 1.0,         // West US 2: base price
    'westus3': 1.0,         // West US 3: base price
    'centralus': 1.0,       // Central US: base price
    'northcentralus': 1.0,  // North Central US: base price
    'southcentralus': 1.0,  // South Central US: base price
    'westcentralus': 1.0,   // West Central US: base price
    'canadacentral': 1.1,   // Canada Central: 10% premium
    'canadaeast': 1.1,      // Canada East: 10% premium
    'brazilsouth': 1.15,    // Brazil South: 15% premium
    'northeurope': 1.05,    // North Europe: 5% premium
    'westeurope': 1.05,     // West Europe: 5% premium
    'uksouth': 1.1,         // UK South: 10% premium
    'ukwest': 1.1,          // UK West: 10% premium
    'francecentral': 1.1,   // France Central: 10% premium
    'germanywestcentral': 1.1, // Germany West Central: 10% premium
    'norwayeast': 1.15,     // Norway East: 15% premium
    'switzerlandnorth': 1.2, // Switzerland North: 20% premium
    'swedencentral': 1.1,   // Sweden Central: 10% premium
    'eastasia': 1.1,        // East Asia: 10% premium
    'southeastasia': 1.05,  // Southeast Asia: 5% premium
    'japaneast': 1.15,      // Japan East: 15% premium
    'japanwest': 1.15,      // Japan West: 15% premium
    'australiaeast': 1.1,   // Australia East: 10% premium
    'australiasoutheast': 1.1, // Australia Southeast: 10% premium
    'koreacentral': 1.1,    // Korea Central: 10% premium
    'koreasouth': 1.1,      // Korea South: 10% premium
    'southafricanorth': 1.2, // South Africa North: 20% premium
    'uaenorth': 1.15,       // UAE North: 15% premium
    'southindia': 1.05,     // South India: 5% premium
    'centralindia': 1.05,   // Central India: 5% premium
    'westindia': 1.05       // West India: 5% premium
  }
};

// Calculate official PTU pricing
export const calculateOfficialPTUPricing = (region, deploymentType) => {
  const baseRate = OFFICIAL_PTU_PRICING.BASE_HOURLY_RATE;
  const regionalMultiplier = OFFICIAL_PTU_PRICING.REGIONAL_MULTIPLIERS[region] || 1.0;
  const deploymentMultiplier = OFFICIAL_PTU_PRICING.DEPLOYMENT_MULTIPLIERS[deploymentType] || 1.0;
  
  // For Global deployment, do not apply regional multiplier (global is cross-region base)
  const applyRegional = deploymentType !== 'global';
  const effectiveRegionalMultiplier = applyRegional ? regionalMultiplier : 1.0;
  
  // Calculate base hourly rate with multipliers
  const hourlyRate = baseRate * effectiveRegionalMultiplier * deploymentMultiplier;
  
  // Calculate monthly rate (730 hours per month average)
  const monthlyRate = hourlyRate * 730;
  // If there's a reservation override value, compute reservation monthly from that override
  const reservationMonthly = OFFICIAL_PTU_PRICING.RESERVATION_MONTHLY_OVERRIDE || monthlyRate;
  
  // Calculate yearly rate with 30% discount
  const yearlyDiscountRate = 1 - OFFICIAL_PTU_PRICING.DISCOUNTS.yearly;
  const yearlyRate = reservationMonthly * 12 * yearlyDiscountRate;
  
  return {
    hourly: Number(hourlyRate.toFixed(3)),
    monthly: Number(monthlyRate.toFixed(2)),
    reservationMonthly: Number(reservationMonthly.toFixed(2)),
    yearly: Number(yearlyRate.toFixed(2)),
    discount: {
      monthlyVsHourly: Number(((1 - (monthlyRate / (hourlyRate * 730))) * 100).toFixed(1)),
      yearlyVsMonthly: Number((OFFICIAL_PTU_PRICING.DISCOUNTS.yearly * 100).toFixed(1)),
      yearlyVsHourly: Number(((1 - (yearlyRate / (hourlyRate * 730 * 12))) * 100).toFixed(1))
    },
    multipliers: {
      regional: regionalMultiplier,
      deployment: deploymentMultiplier,
      combined: Number((regionalMultiplier * deploymentMultiplier).toFixed(3))
    }
  };
};
