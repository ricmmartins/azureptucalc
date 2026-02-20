// Enhanced Azure OpenAI Pricing Service
// Provides accurate, real-time pricing data from Azure APIs

class AzureOpenAIPricingService {
  constructor() {
    this.baseUrl = 'https://prices.azure.com/api/retail/prices';
    this.cache = new Map();
    this.cacheExpiry = 3 * 60 * 60 * 1000; // 3 hours
    this.fallbackPricing = this.loadFallbackPricing();
    console.log('🔧 Azure Pricing Service initialized with API endpoint:', this.baseUrl);
    
    // Test API connectivity on initialization
    this.testConnection();
  }
  
  async testConnection() {
    try {
      console.log('🧪 Testing Azure API connection...');
      const response = await fetch(`${this.baseUrl}?$filter=contains(productName, 'OpenAI') and contains(productName, 'gpt')&$top=1`);
      const data = await response.json();
      console.log('✅ Azure API connection successful! Found', data.Items?.length || 0, 'pricing items');
    } catch (error) {
      console.error('❌ Azure API connection failed:', error);
    }
  }

  // Load fallback pricing data
  loadFallbackPricing() {
    return {
      // GPT-5 series: PAYGO per 1M tokens, PTU per PTU/hr (all models same PTU rate)
      // Source: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/
      'gpt-5': {
        paygo: { input: 1.25, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5-mini': {
        paygo: { input: 0.25, output: 2.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5-nano': {
        paygo: { input: 0.05, output: 0.40 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5-chat': {
        paygo: { input: 1.25, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5.1': {
        paygo: { input: 1.25, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5.2': {
        paygo: { input: 1.75, output: 14.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
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

  // Fetch live pricing from Azure API via Vercel serverless function or direct (dev mode)
  async fetchLivePricing(model, region, deploymentType) {
    try {
      console.log(`🔍 Fetching live pricing for ${model} in ${region} (${deploymentType})`);
      
      // Try Vercel API route first (works in production)
      const apiUrl = `/api/azure-pricing?model=${encodeURIComponent(model)}&region=${encodeURIComponent(region)}&deployment=${encodeURIComponent(deploymentType)}`;
      console.log(`📡 Trying Vercel API: ${apiUrl}`);
      
      try {
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Received Vercel API response:', data);
          
          if (data.success) {
            return {
              paygo: {
                input: data.paygo?.input || 0,
                output: data.paygo?.output || 0
              },
              ptu: {
                global: data.ptu?.global || 0,
                dataZone: data.ptu?.dataZone || 0,
                regional: data.ptu?.regional || 0
              },
              source: 'live',
              timestamp: data.timestamp,
              strategy_used: data.strategy_used,
              total_items: data.total_items
            };
          }
        }
      } catch (vercelError) {
        console.warn('⚠️ Vercel API not available (local dev mode):', vercelError.message);
      }
      
      // Fallback to direct Azure API (for local development)
      console.log('🔄 Falling back to direct Azure API');
      
      // Make direct calls to Azure Pricing API for local development
      const directPricing = await this.fetchDirectAzureAPI(model, region, deploymentType);
      console.log('✅ Using direct Azure API pricing:', directPricing);
      
      return directPricing;
      
    } catch (error) {
      console.error('❌ All pricing fetch methods failed:', error);
      throw error;
    }
  }

  // Direct Azure API calls for local development
  async fetchDirectAzureAPI(model, region, deploymentType) {
    console.log(`🌐 Making direct Azure API call for ${model} in ${region} (${deploymentType})`);
    
    // Multiple search strategies for finding pricing data
    const queries = [
      `contains(productName, 'OpenAI') and contains(skuName, '${model}')`,
      `contains(productName, 'OpenAI') and contains(meterName, '${model}')`,
      `contains(productName, 'OpenAI') and contains(productName, 'gpt')`,
      `contains(productName, 'OpenAI')`
    ];

    for (let i = 0; i < queries.length; i++) {
      try {
        const azureUrl = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(queries[i])}&$top=100`;
        console.log(`📡 Direct API Strategy ${i + 1}: Searching for ${model}`);
        
        const response = await fetch(azureUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Azure-PTU-Calculator/1.0'
          }
        });

        if (!response.ok) {
          console.warn(`❌ Direct API Strategy ${i + 1} failed: ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`📊 Direct API returned ${data.Items?.length || 0} items`);
        
        if (data.Items && data.Items.length > 0) {
          // Parse the pricing data
          const pricingResult = this.parseAzurePricingData(data.Items, model, deploymentType);
          if (pricingResult) {
            console.log('✅ Successfully parsed pricing from direct Azure API:', pricingResult);
            return pricingResult;
          }
        }
      } catch (error) {
        console.warn(`❌ Direct API Strategy ${i + 1} error:`, error.message);
      }
    }

    // If all strategies fail, fall back to static pricing
    console.log('⚠️ All direct API strategies failed, using fallback pricing');
    return this.getFallbackPricing(model, deploymentType);
  }

  // Parse Azure API pricing data
  parseAzurePricingData(items, model, deploymentType) {
    console.log(`🔍 Parsing ${items.length} pricing items for ${model} (${deploymentType})`);
    
    let paygoInput = 0, paygoOutput = 0;
    let ptuGlobal = 0, ptuDataZone = 0, ptuRegional = 0;
    
    for (const item of items) {
      const productName = (item.productName || '').toLowerCase();
      const meterName = (item.meterName || '').toLowerCase();
      const skuName = (item.skuName || '').toLowerCase();
      const unit = (item.unitOfMeasure || '').toLowerCase();
      const price = parseFloat(item.retailPrice || 0);
      
      if (price <= 0) continue;
      
      const itemText = `${productName} ${meterName} ${skuName}`.toLowerCase();
      
      // Check if this item matches our model
      const modelVariations = [
        model.toLowerCase(),
        model.replace('-', '').toLowerCase(),
        model.replace('.', '').toLowerCase()
      ];
      
      const isModelMatch = modelVariations.some(variation => itemText.includes(variation));
      if (!isModelMatch && !itemText.includes('gpt')) continue;
      
      console.log(`📝 Found potential match: ${item.productName} - ${item.meterName} - $${price}/${unit}`);
      
      // Parse PTU pricing
      if (unit.includes('ptu') || unit.includes('hour') || itemText.includes('provisioned')) {
        if (itemText.includes('global') || deploymentType === 'global') {
          ptuGlobal = price;
        } else if (itemText.includes('datazone') || itemText.includes('data-zone') || deploymentType === 'dataZone') {
          ptuDataZone = price;
        } else if (itemText.includes('regional') || deploymentType === 'regional') {
          ptuRegional = price;
        } else {
          // Default assignment based on deployment type
          if (deploymentType === 'global') ptuGlobal = price;
          else if (deploymentType === 'dataZone') ptuDataZone = price;
          else if (deploymentType === 'regional') ptuRegional = price;
        }
      }
      
      // Parse PAYGO pricing
      if (unit.includes('token') || unit.includes('1k') || unit.includes('1m')) {
        if (itemText.includes('input') || itemText.includes('prompt')) {
          paygoInput = this.convertToPerMillionTokens(price, unit);
        } else if (itemText.includes('output') || itemText.includes('completion')) {
          paygoOutput = this.convertToPerMillionTokens(price, unit);
        }
      }
    }
    
    // If we found any pricing data, return it
    if (paygoInput > 0 || paygoOutput > 0 || ptuGlobal > 0 || ptuDataZone > 0 || ptuRegional > 0) {
      const result = {
        paygo: {
          input: paygoInput || this.fallbackPricing[model]?.paygo?.input || 0,
          output: paygoOutput || this.fallbackPricing[model]?.paygo?.output || 0
        },
        ptu: {
          global: ptuGlobal || this.fallbackPricing[model]?.ptu?.global || 0,
          dataZone: ptuDataZone || this.fallbackPricing[model]?.ptu?.dataZone || 0,
          regional: ptuRegional || this.fallbackPricing[model]?.ptu?.regional || 0
        },
        source: 'azure-api-direct',
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Parsed pricing result:', result);
      return result;
    }
    
    console.log('⚠️ No matching pricing found in Azure API data');
    return null;
  }
  
  // Enhanced simulated pricing for development (mimics live API structure)
  getEnhancedSimulatedPricing(model, region, deploymentType) {
    const basePricing = this.fallbackPricing[model] || this.fallbackPricing['gpt-4o'];
    
    // Add small random variations to simulate "live" data
    const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
    
    return {
      paygo: {
        input: Number((basePricing.paygo.input * variation).toFixed(4)),
        output: Number((basePricing.paygo.output * variation).toFixed(4))
      },
      ptu: {
        global: Math.round(basePricing.ptu.global * variation),
        dataZone: Math.round(basePricing.ptu.dataZone * variation),
        regional: Math.round(basePricing.ptu.regional * variation)
      },
      source: 'live-simulated', // Indicates this is simulated live data for development
      timestamp: new Date().toISOString(),
      strategy_used: 'dev-simulation',
      total_items: 42 // Simulated count
    };
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
    
    console.log(`Converting price ${price} with unit "${unit}" - assuming per 1K tokens`);
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
  getFallbackPricing(model, deploymentType = 'global') {
    const fallback = this.fallbackPricing[model];
    
    if (!fallback) {
      console.log(`⚠️ No fallback pricing found for model: ${model}, using default`);
      return {
        paygo: { input: 0, output: 0 },
        ptu: { global: 0, dataZone: 0, regional: 0 },
        source: 'fallback-unknown',
        timestamp: new Date().toISOString()
      };
    }

    console.log(`📋 Using fallback pricing for ${model} (${deploymentType}):`, fallback);
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

