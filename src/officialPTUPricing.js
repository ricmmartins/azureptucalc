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
  
  // Deployment type multipliers (official Azure pricing Feb 2026)
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
  },
  
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
// PTU pricing is uniform per deployment type — regional multipliers do NOT apply to provisioned pricing
export const calculateOfficialPTUPricing = (region, deploymentType) => {
  const baseRate = OFFICIAL_PTU_PRICING.BASE_HOURLY_RATE;
  const deploymentMultiplier = OFFICIAL_PTU_PRICING.DEPLOYMENT_MULTIPLIERS[deploymentType] || 1.0;
  
  // PTU hourly rate is purely based on deployment type (same across all regions)
  const hourlyRate = baseRate * deploymentMultiplier;
  
  // Use official reservation overrides if available
  const reservations = OFFICIAL_PTU_PRICING.RESERVATION_OVERRIDES?.[deploymentType];
  const reservationMonthly = reservations?.monthly || (hourlyRate * 730);
  const reservationYearly = reservations?.yearly || (reservationMonthly * 12 * 0.85);
  
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
