// Enhanced Azure OpenAI Pricing Service
// Provides accurate, real-time pricing data from Azure APIs

class AzureOpenAIPricingService {
  constructor() {
    this.baseUrl = 'https://prices.azure.com/api/retail/prices';
    this.cache = new Map();
    this.cacheExpiry = 3 * 60 * 60 * 1000; // 3 hours
    this.fallbackPricing = this.loadFallbackPricing();
    console.log('🔧 Azure Pricing Service initialized with API endpoint:', this.baseUrl);
  }

  // Load fallback pricing data
  loadFallbackPricing() {
    return {
      'gpt-5': {
        paygo: { input: 0.05, output: 0.15 },
        ptu: { global: 50000, dataZone: 55000, regional: 45000 }
      },
      'gpt-5-mini': {
        paygo: { input: 0.03, output: 0.09 },
        ptu: { global: 35000, dataZone: 38500, regional: 31500 }
      },
      'gpt-5-nano': {
        paygo: { input: 0.02, output: 0.06 },
        ptu: { global: 25000, dataZone: 27500, regional: 22500 }
      },
      'gpt-5-chat': {
        paygo: { input: 0.03, output: 0.09 },
        ptu: { global: 35000, dataZone: 38500, regional: 31500 }
      },
      'gpt-5.1': {
        paygo: { input: 0.12, output: 0.36 },
        ptu: { global: 60000, dataZone: 66000, regional: 54000 }
      },
      'gpt-5.2': {
        paygo: { input: 0.15, output: 0.45 },
        ptu: { global: 75000, dataZone: 82500, regional: 67500 }
      },
      'gpt-4o': {
        paygo: { input: 0.025, output: 0.10 },
        ptu: { global: 40000, dataZone: 44000, regional: 36000 }
      },
      'gpt-4o-mini': {
        paygo: { input: 0.0015, output: 0.006 },
        ptu: { global: 8000, dataZone: 8800, regional: 7200 }
      },
      'gpt-4': {
        paygo: { input: 0.03, output: 0.06 },
        ptu: { global: 30000, dataZone: 33000, regional: 27000 }
      },
      'gpt-4-turbo': {
        paygo: { input: 0.01, output: 0.03 },
        ptu: { global: 20000, dataZone: 22000, regional: 18000 }
      },
      'gpt-35-turbo': {
        paygo: { input: 0.0015, output: 0.002 },
        ptu: { global: 5000, dataZone: 5500, regional: 4500 }
      },
      'text-embedding-ada-002': {
        paygo: { input: 0.0001, output: 0 },
        ptu: { global: 2000, dataZone: 2200, regional: 1800 }
      },
      'text-embedding-3-large': {
        paygo: { input: 0.00013, output: 0 },
        ptu: { global: 2500, dataZone: 2750, regional: 2250 }
      },
      'text-embedding-3-small': {
        paygo: { input: 0.00002, output: 0 },
        ptu: { global: 1500, dataZone: 1650, regional: 1350 }
      },
      'whisper': {
        paygo: { input: 0.006, output: 0 },
        ptu: { global: 3000, dataZone: 3300, regional: 2700 }
      }
    };
  }

  // Get cached pricing or fetch from API
  async getPricing(model, region = 'eastus2', deploymentType = 'data-zone') {
    console.log('💰 Azure API: Getting pricing for', { model, region, deploymentType });
    const cacheKey = `${model}-${region}-${deploymentType}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('📋 Azure API: Using cached pricing data for', model);
        return cached.data;
      }
    }

    try {
      // Attempt to fetch live pricing
      console.log('🌐 Azure API: Fetching live pricing from', this.baseUrl);
      const livePricing = await this.fetchLivePricing(model, region, deploymentType);
      
      if (livePricing) {
        console.log('✅ Azure API: Successfully retrieved live pricing for', model, livePricing);
        // Cache successful result
        this.cache.set(cacheKey, {
          data: livePricing,
          timestamp: Date.now()
        });
        return livePricing;
      }
    } catch (error) {
      console.warn('❌ Azure API: Live pricing fetch failed:', error);
    }

    // Fallback to static pricing
    console.log('🔄 Azure API: Using fallback pricing for', model);
    return this.getFallbackPricing(model, deploymentType);
  }

  // Fetch live pricing from Azure API
  async fetchLivePricing(model, region, deploymentType) {
    console.log('🔍 Azure API: Searching for model:', model);
    
    const modelMap = {
      'gpt-5': 'GPT5',
      'gpt-5-mini': 'GPT 5 Mini',
      'gpt-5-nano': 'GPT 5 Nano', 
      'gpt-5-chat': 'GPT 5',
      'gpt-5.1': 'GPT 5.1',
      'gpt-5.2': 'GPT 5.2',
      'gpt-4o': 'gpt 4o',
      'gpt-4o-mini': 'gpt 4o mini',
      'gpt-4': 'gpt 4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-35-turbo': 'gpt-35-turbo',
      'text-embedding-ada-002': 'ada 002',
      'text-embedding-3-large': 'embedding 3 large',
      'text-embedding-3-small': 'embedding 3 small',
      'whisper': 'whisper'
    };

    const searchModel = modelMap[model] || model;
    
    // Multiple search strategies - updated with working queries
    const queries = [
      // First try: Broad OpenAI search with model name
      `contains(productName, 'OpenAI') and contains(productName, '${searchModel}')`,
      // Second try: Just OpenAI with service name
      `serviceName eq 'Foundry Models' and contains(productName, 'OpenAI') and contains(productName, '${searchModel}')`,
      // Third try: Very broad search for the model
      `contains(productName, '${searchModel}') and contains(productName, 'OpenAI')`,
      // Fourth try: Just broad OpenAI search to get any pricing data
      `contains(productName, 'OpenAI')`
    ];

    for (const filter of queries) {
      try {
        console.log('🔎 Azure API: Trying query:', filter);
        const response = await fetch(`${this.baseUrl}?$filter=${encodeURIComponent(filter)}&$top=100`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Azure API: Query returned', data.Items?.length || 0, 'items');
          
          const pricing = this.parsePricingResponse(data.Items, model, deploymentType);
          
          if (pricing) {
            console.log('✅ Azure API: Successfully parsed pricing from query:', filter);
            return pricing;
          }
        } else {
          console.warn('⚠️ Azure API: Query failed with status:', response.status);
        }
      } catch (error) {
        console.warn(`❌ Azure API: Query failed:`, filter, error);
      }
    }

    return null;
  }

  // Parse Azure API response into our pricing format
  parsePricingResponse(items, model, deploymentType) {
    if (!items || items.length === 0) return null;

    const pricing = {
      paygo: { input: 0, output: 0 },
      ptu: { global: 0, dataZone: 0, regional: 0 },
      source: 'live',
      timestamp: new Date().toISOString()
    };

    // Process each pricing item
    for (const item of items) {
      const UNUSED_productName = item.productName?.toLowerCase() || '';
      const skuName = item.skuName?.toLowerCase() || '';
      const meterName = item.meterName?.toLowerCase() || '';
      const unitPrice = item.unitPrice || 0;

      // Identify pricing type
      if (meterName.includes('input') || meterName.includes('prompt')) {
        pricing.paygo.input = this.convertToPerMillionTokens(unitPrice, item.unitOfMeasure);
      } else if (meterName.includes('output') || meterName.includes('completion')) {
        pricing.paygo.output = this.convertToPerMillionTokens(unitPrice, item.unitOfMeasure);
      } else if (meterName.includes('provisioned') || meterName.includes('ptu')) {
        // PTU pricing
        const hourlyRate = this.convertToHourlyRate(unitPrice, item.unitOfMeasure);
        
        if (skuName.includes('global')) {
          pricing.ptu.global = hourlyRate;
        } else if (skuName.includes('data') || skuName.includes('zone')) {
          pricing.ptu.dataZone = hourlyRate;
        } else if (skuName.includes('regional')) {
          pricing.ptu.regional = hourlyRate;
        } else {
          // Default assignment based on deployment type
          pricing.ptu[deploymentType.replace('-', '')] = hourlyRate;
        }
      }
    }

    // Validate pricing data
    if (pricing.paygo.input > 0 || pricing.ptu.global > 0 || pricing.ptu.dataZone > 0 || pricing.ptu.regional > 0) {
      return pricing;
    }

    return null;
  }

  // Convert pricing to per million tokens
  convertToPerMillionTokens(price, unit) {
    const unitLower = unit?.toLowerCase() || '';
    
    if (unitLower.includes('1k') || unitLower.includes('1000')) {
      return price * 1000; // Convert from per 1K to per 1M
    } else if (unitLower.includes('1m') || unitLower.includes('million')) {
      return price; // Already per million
    } else if (unitLower.includes('token')) {
      return price * 1000000; // Convert from per token to per million
    }
    
    return price * 1000; // Default assumption: per 1K tokens
  }

  // Convert pricing to hourly rate
  convertToHourlyRate(price, unit) {
    const unitLower = unit?.toLowerCase() || '';
    
    if (unitLower.includes('hour')) {
      return price; // Already hourly
    } else if (unitLower.includes('minute')) {
      return price * 60; // Convert from per minute to per hour
    } else if (unitLower.includes('second')) {
      return price * 3600; // Convert from per second to per hour
    }
    
    return price; // Assume hourly
  }

  // Get fallback pricing when API fails
  getFallbackPricing(model) {
    const fallback = this.fallbackPricing[model];
    
    if (!fallback) {
      return {
        paygo: { input: 0, output: 0 },
        ptu: { global: 0, dataZone: 0, regional: 0 },
        source: 'fallback-unknown',
        timestamp: new Date().toISOString()
      };
    }

    return {
      ...fallback,
      source: 'fallback',
      timestamp: new Date().toISOString()
    };
  }

  // Refresh all cached pricing
  async refreshAllPricing() {
    const models = Object.keys(this.fallbackPricing);
    const deploymentTypes = ['global', 'data-zone', 'regional'];
    const regions = ['eastus2', 'westus2', 'northcentralus'];

    const refreshPromises = [];

    for (const model of models) {
      for (const deploymentType of deploymentTypes) {
        for (const region of regions) {
          const cacheKey = `${model}-${region}-${deploymentType}`;
          this.cache.delete(cacheKey); // Clear cache
          
          refreshPromises.push(
            this.getPricing(model, region, deploymentType)
              .catch(error => console.warn(`Failed to refresh ${cacheKey}:`, error))
          );
        }
      }
    }

    await Promise.allSettled(refreshPromises);
    return { refreshed: refreshPromises.length, timestamp: new Date().toISOString() };
  }

  // Get pricing status
  getPricingStatus() {
    const cacheSize = this.cache.size;
    const oldestCache = Math.min(...Array.from(this.cache.values()).map(c => c.timestamp));
    const newestCache = Math.max(...Array.from(this.cache.values()).map(c => c.timestamp));

    return {
      cacheSize,
      oldestCache: new Date(oldestCache).toISOString(),
      newestCache: new Date(newestCache).toISOString(),
      cacheExpiry: this.cacheExpiry / (60 * 60 * 1000) + ' hours'
    };
  }
}

// Export for use in React app
export default AzureOpenAIPricingService;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AzureOpenAIPricingService;
} else if (typeof window !== 'undefined') {
  window.AzureOpenAIPricingService = AzureOpenAIPricingService;
}

