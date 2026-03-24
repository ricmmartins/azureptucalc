// Task 9: External Pricing Data Service
// Manages loading and display of pricing data from bundled configuration

import externalConfig from './external_pricing_config.json';

export class ExternalPricingService {
  constructor() {
    this.cachedData = null;
  }

  // Load pricing data from the bundled configuration
  async loadPricingData() {
    try {
      if (!this.validatePricingData(externalConfig)) {
        throw new Error('Invalid pricing data structure');
      }
      this.cachedData = externalConfig;
      return externalConfig;
    } catch (error) {
      return this.getFallbackPricingData();
    }
  }

  // Validate the structure of pricing data
  validatePricingData(data) {
    const requiredFields = ['version', 'lastUpdated', 'ptuPricing', 'tokenPricing', 'modelConfigurations'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  }

  // Check data freshness
  async checkForUpdates() {
    const data = this.cachedData || externalConfig;
    const lastUpdated = new Date(data.lastUpdated);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUpdate > 30) {
      return { 
        hasUpdate: false, 
        message: `Data is ${daysSinceUpdate} days old — may need manual update`,
        currentVersion: data.version
      };
    }
    return { hasUpdate: false, message: 'Up to date', currentVersion: data.version };
  }

  // Reload pricing data from config
  async updatePricingData() {
    this.cachedData = null;
    return await this.loadPricingData();
  }

  // Get fallback pricing data if config is invalid
  getFallbackPricingData() {
    return {
      version: "fallback-2026.03",
      lastUpdated: new Date().toISOString(),
      source: "Internal Fallback",
      sourceUrl: "https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding",
      dataExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ptuPricing: {
        baseHourlyRate: 1.00,
        discounts: { monthly: 0.0, yearly: 0.30 },
        deploymentMultipliers: { global: 1.0, dataZone: 1.1, regional: 2.0 },
        regionalMultipliers: { eastus: 1.0, westus: 1.05, northeurope: 1.05 }
      },
      tokenPricing: {
        "gpt-4o": { input: 2.50, output: 10.00 },
        "gpt-4o-mini": { input: 0.15, output: 0.60 }
      },
      modelConfigurations: {
        "gpt-4o": {
          throughput_per_ptu: 2500,
          deployments: {
            global: { min_ptu: 15, increment: 5 },
            dataZone: { min_ptu: 15, increment: 5 },
            regional: { min_ptu: 50, increment: 50 }
          }
        },
        "gpt-4o-mini": {
          throughput_per_ptu: 37000,
          deployments: {
            global: { min_ptu: 15, increment: 5 },
            dataZone: { min_ptu: 15, increment: 5 },
            regional: { min_ptu: 25, increment: 25 }
          }
        }
      }
    };
  }

  // Get current data version and metadata
  getDataInfo() {
    const data = this.cachedData || externalConfig;
    return {
      version: data.version,
      lastUpdated: data.lastUpdated,
      source: data.source,
      dataExpiry: data.dataExpiry,
      isExpired: new Date(data.dataExpiry) < new Date()
    };
  }

  // Calculate PTU pricing using external data
  calculatePTUPricing(region, deploymentType) {
    const data = this.cachedData || externalConfig;
    const pricing = data.ptuPricing;
    const baseRate = pricing.baseHourlyRate;
    const deploymentMultiplier = pricing.deploymentMultipliers[deploymentType] || 1.0;
    
    const hourlyRate = baseRate * deploymentMultiplier;
    const monthlyRate = hourlyRate * 730;
    const yearlyRate = monthlyRate * 12 * (1 - pricing.discounts.yearly);
    
    return {
      hourly: Number(hourlyRate.toFixed(3)),
      monthly: Number(monthlyRate.toFixed(2)),
      yearly: Number(yearlyRate.toFixed(2)),
      discount: {
        yearlyVsMonthly: Number((pricing.discounts.yearly * 100).toFixed(1))
      }
    };
  }

  // Get token pricing for a model
  getTokenPricing(modelName) {
    const data = this.cachedData || externalConfig;
    return data.tokenPricing[modelName] || data.tokenPricing['gpt-4o-mini'];
  }

  // Get model configuration
  getModelConfiguration(modelName) {
    const data = this.cachedData || externalConfig;
    return data.modelConfigurations[modelName];
  }
}

export default ExternalPricingService;