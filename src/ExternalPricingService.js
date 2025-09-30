// Task 9: External Pricing Data Service
// Manages loading, caching, and updating of pricing data from external sources

export class ExternalPricingService {
  constructor() {
    this.cachedData = null;
    this.lastUpdateCheck = null;
    this.updateCheckInterval = 1000 * 60 * 60; // 1 hour
    this.storageKey = 'azurePTUExternalPricing';
    this.versionKey = 'azurePTUPricingVersion';
  }

  // Load pricing data from external configuration
  async loadPricingData() {
    try {
      // Try to load from cache first
      const cachedVersion = localStorage.getItem(this.versionKey);
      const cachedPricing = localStorage.getItem(this.storageKey);
      
      if (cachedPricing && cachedVersion) {
        const cached = JSON.parse(cachedPricing);
        // Check if cache is still valid (not expired)
        const expiryDate = new Date(cached.dataExpiry);
        if (expiryDate > new Date()) {
          this.cachedData = cached;
          return cached;
        }
      }

      // Load from external source (simulated - in real app this would be an API call)
      const response = await fetch('./src/external_pricing_config.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch pricing data: ${response.status}`);
      }
      
      const externalData = await response.json();
      
      // Validate data structure
      if (!this.validatePricingData(externalData)) {
        throw new Error('Invalid pricing data structure');
      }

      // Cache the data
      localStorage.setItem(this.storageKey, JSON.stringify(externalData));
      localStorage.setItem(this.versionKey, externalData.version);
      
      this.cachedData = externalData;
      this.lastUpdateCheck = new Date();
      
      return externalData;
    } catch (error) {
      console.warn('Failed to load external pricing data, using fallback:', error);
      return this.getFallbackPricingData();
    }
  }

  // Validate the structure of pricing data
  validatePricingData(data) {
    const requiredFields = ['version', 'lastUpdated', 'ptuPricing', 'tokenPricing', 'modelConfigurations'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  }

  // Check for updates
  async checkForUpdates() {
    try {
      if (this.lastUpdateCheck && 
          (Date.now() - this.lastUpdateCheck.getTime()) < this.updateCheckInterval) {
        return { hasUpdate: false, message: 'Recently checked' };
      }

      // In a real implementation, this would check a version endpoint
      const currentVersion = localStorage.getItem(this.versionKey);
      const response = await fetch('./src/external_pricing_config.json');
      const latestData = await response.json();
      
      if (latestData.version !== currentVersion) {
        return { 
          hasUpdate: true, 
          currentVersion,
          latestVersion: latestData.version,
          message: `Update available: ${currentVersion} → ${latestData.version}` 
        };
      }
      
      this.lastUpdateCheck = new Date();
      return { hasUpdate: false, message: 'Up to date' };
    } catch (error) {
      return { hasUpdate: false, message: 'Update check failed', error };
    }
  }

  // Force update pricing data
  async updatePricingData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.versionKey);
    this.cachedData = null;
    return await this.loadPricingData();
  }

  // Get fallback pricing data if external loading fails
  getFallbackPricingData() {
    return {
      version: "fallback-2025.09.30",
      lastUpdated: new Date().toISOString(),
      source: "Internal Fallback",
      sourceUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/provisioned-throughput-onboarding",
      dataExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      ptuPricing: {
        baseHourlyRate: 1.00,
        discounts: { monthly: 0.0, yearly: 0.30 },
        deploymentMultipliers: { regional: 1.0, dataZone: 1.2, global: 1.4 },
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
    if (!this.cachedData) return null;
    
    return {
      version: this.cachedData.version,
      lastUpdated: this.cachedData.lastUpdated,
      source: this.cachedData.source,
      dataExpiry: this.cachedData.dataExpiry,
      isExpired: new Date(this.cachedData.dataExpiry) < new Date()
    };
  }

  // Calculate PTU pricing using external data
  calculatePTUPricing(region, deploymentType) {
    if (!this.cachedData) {
      throw new Error('Pricing data not loaded');
    }

    const pricing = this.cachedData.ptuPricing;
    const baseRate = pricing.baseHourlyRate;
    const regionalMultiplier = pricing.regionalMultipliers[region] || 1.0;
    const deploymentMultiplier = pricing.deploymentMultipliers[deploymentType] || 1.0;
    
    const hourlyRate = baseRate * regionalMultiplier * deploymentMultiplier;
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
    if (!this.cachedData) {
      throw new Error('Pricing data not loaded');
    }

    return this.cachedData.tokenPricing[modelName] || this.cachedData.tokenPricing['gpt-4o-mini'];
  }

  // Get model configuration
  getModelConfiguration(modelName) {
    if (!this.cachedData) {
      throw new Error('Pricing data not loaded');
    }

    return this.cachedData.modelConfigurations[modelName];
  }
}

export default ExternalPricingService;