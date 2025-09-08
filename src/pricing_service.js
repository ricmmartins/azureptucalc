/**
 * Azure OpenAI Pricing Service
 * Fetches live pricing data from Azure Retail Prices API with enhanced fallback support
 */

import enhancedPricingData from './azure_openai_enhanced_pricing.json';

class AzurePricingService {
  constructor() {
    this.baseUrl = 'https://prices.azure.com/api/retail/prices';
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour in milliseconds
    this.enhancedPricing = enhancedPricingData;
  }

  /**
   * Fetch Azure OpenAI pricing data with enhanced fallback
   */
  async fetchOpenAIPricing() {
    const cacheKey = 'openai_pricing';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try to fetch live data from Azure API
      const liveData = await this.fetchLivePricing();
      
      // Merge live data with enhanced fallback data
      const mergedData = this.mergePricingData(liveData, this.enhancedPricing.pricing_data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: mergedData,
        timestamp: Date.now()
      });
      
      return mergedData;
      
    } catch (error) {
      console.error('Error fetching Azure pricing:', error);
      
      // Return enhanced fallback pricing if API fails
      return this.enhancedPricing.pricing_data;
    }
  }

  /**
   * Fetch live pricing data from Azure API
   */
  async fetchLivePricing() {
    // Fetch Azure OpenAI products
    const openaiResponse = await this.fetchWithFilter("productName eq 'Azure OpenAI'");
    
    // Fetch Azure OpenAI Reasoning products (o-series)
    const reasoningResponse = await this.fetchWithFilter("productName eq 'Azure OpenAI Reasoning'");
    
    const allItems = [...openaiResponse, ...reasoningResponse];
    
    return this.processPricingData(allItems);
  }

  /**
   * Merge live pricing data with enhanced fallback data
   */
  mergePricingData(liveData, fallbackData) {
    const merged = { ...fallbackData };
    
    // Override with live data where available and non-zero
    for (const [modelName, modelData] of Object.entries(liveData)) {
      if (!merged[modelName]) {
        merged[modelName] = {};
      }
      
      for (const [deploymentKey, pricing] of Object.entries(modelData)) {
        if (!merged[modelName][deploymentKey]) {
          merged[modelName][deploymentKey] = {};
        }
        
        // Only use live pricing if it's non-zero
        for (const [priceType, price] of Object.entries(pricing)) {
          if (price > 0) {
            merged[modelName][deploymentKey][priceType] = price;
          }
        }
      }
    }
    
    return merged;
  }

  /**
   * Fetch data with specific filter
   */
  async fetchWithFilter(filter) {
    const params = new URLSearchParams({
      '$filter': filter,
      '$top': '1000'
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.Items || [];
  }

  /**
   * Process raw pricing data into structured format
   */
  processPricingData(items) {
    const models = {};
    
    for (const item of items) {
      const modelInfo = this.extractModelInfo(item);
      
      if (modelInfo) {
        const { modelKey, tokenType, deploymentType } = modelInfo;
        
        if (!models[modelKey]) {
          models[modelKey] = {
            paygo: {},
            ptu: {},
            name: this.getModelDisplayName(modelKey)
          };
        }
        
        const region = item.armRegionName;
        const price = item.retailPrice;
        const unit = item.unitOfMeasure;
        
        if (this.isTokenPricing(unit)) {
          // PAYGO pricing
          if (!models[modelKey].paygo[region]) {
            models[modelKey].paygo[region] = {};
          }
          
          if (!models[modelKey].paygo[region][deploymentType]) {
            models[modelKey].paygo[region][deploymentType] = {};
          }
          
          models[modelKey].paygo[region][deploymentType][tokenType] = price;
          
        } else if (this.isPTUPricing(unit)) {
          // PTU pricing
          if (!models[modelKey].ptu[region]) {
            models[modelKey].ptu[region] = {};
          }
          
          models[modelKey].ptu[region][deploymentType] = price;
        }
      }
    }
    
    return {
      models,
      lastUpdated: Date.now(),
      source: 'Azure Retail Prices API'
    };
  }

  /**
   * Extract model information from pricing item
   */
  extractModelInfo(item) {
    const skuName = item.skuName?.toLowerCase() || '';
    const meterName = item.meterName?.toLowerCase() || '';
    const productName = item.productName?.toLowerCase() || '';
    
    // Model patterns
    const modelPatterns = {
      'gpt-4o-mini': ['gpt-4o-mini', 'gpt4o-mini'],
      'gpt-4o': ['gpt-4o', 'gpt4o'],
      'gpt-4-turbo': ['gpt-4-turbo', 'gpt4-turbo'],
      'gpt-4': ['gpt-4', 'gpt4'],
      'gpt-35-turbo': ['gpt-35', 'gpt-3.5', 'gpt35'],
      'text-embedding-ada-002': ['ada-002', 'embedding-ada'],
      'text-embedding-3-large': ['embedding-3-large'],
      'text-embedding-3-small': ['embedding-3-small'],
      'whisper': ['whisper'],
      'o1': ['o1-preview', 'o1-mini', 'o1'],
      'o3': ['o3-mini', 'o3']
    };
    
    const text = `${skuName} ${meterName} ${productName}`;
    
    // Find matching model
    for (const [modelKey, patterns] of Object.entries(modelPatterns)) {
      if (patterns.some(pattern => text.includes(pattern))) {
        return {
          modelKey,
          tokenType: this.determineTokenType(text),
          deploymentType: this.determineDeploymentType(text)
        };
      }
    }
    
    return null;
  }

  /**
   * Determine token type (input/output/general)
   */
  determineTokenType(text) {
    if (text.includes('input') || text.includes('prompt')) {
      return 'input';
    } else if (text.includes('output') || text.includes('completion')) {
      return 'output';
    } else if (text.includes('cached')) {
      return 'cached_input';
    }
    return 'general';
  }

  /**
   * Determine deployment type (global/regional/data-zone)
   */
  determineDeploymentType(text) {
    if (text.includes('global') || text.includes('glbl')) {
      return 'global';
    } else if (text.includes('regional') || text.includes('regnl')) {
      return 'regional';
    } else if (text.includes('data-zone') || text.includes('datazone')) {
      return 'data-zone';
    }
    return 'global'; // default
  }

  /**
   * Check if this is token-based pricing
   */
  isTokenPricing(unit) {
    const unitLower = unit.toLowerCase();
    return unitLower.includes('token') || 
           unitLower.includes('1k') || 
           unitLower.includes('1m') ||
           unitLower === '1000' ||
           unitLower === '1';
  }

  /**
   * Check if this is PTU pricing
   */
  isPTUPricing(unit) {
    const unitLower = unit.toLowerCase();
    return unitLower.includes('hour') || 
           unitLower.includes('month');
  }

  /**
   * Get display name for model
   */
  getModelDisplayName(modelKey) {
    const displayNames = {
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4o': 'GPT-4o',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-35-turbo': 'GPT-3.5 Turbo',
      'text-embedding-ada-002': 'Text Embedding Ada 002',
      'text-embedding-3-large': 'Text Embedding 3 Large',
      'text-embedding-3-small': 'Text Embedding 3 Small',
      'whisper': 'Whisper',
      'o1': 'o1',
      'o3': 'o3'
    };
    
    return displayNames[modelKey] || modelKey;
  }

  /**
   * Get fallback pricing when API is unavailable
   */
  getFallbackPricing() {
    return {
      models: {
        'gpt-4o-mini': {
          name: 'GPT-4o Mini',
          paygo: {
            'eastus': {
              'global': { input: 0.15, output: 0.60 },
              'regional': { input: 0.165, output: 0.66 }
            }
          },
          ptu: {
            'eastus': {
              'global': 75,
              'regional': 82.5
            }
          }
        },
        'gpt-4o': {
          name: 'GPT-4o',
          paygo: {
            'eastus': {
              'global': { input: 2.50, output: 10.00 },
              'regional': { input: 2.75, output: 11.00 }
            }
          },
          ptu: {
            'eastus': {
              'global': 150,
              'regional': 165
            }
          }
        }
      },
      lastUpdated: Date.now(),
      source: 'Fallback pricing data'
    };
  }

  /**
   * Get pricing for specific model, region, and deployment type
   */
  getModelPricing(pricingData, model, region, deploymentType) {
    const modelData = pricingData.models[model];
    if (!modelData) return null;

    const paygo = modelData.paygo[region]?.[deploymentType] || {};
    const ptu = modelData.ptu[region]?.[deploymentType] || 0;

    return {
      paygo_input: paygo.input || paygo.general || 0,
      paygo_output: paygo.output || paygo.general || 0,
      paygo_cached_input: paygo.cached_input || paygo.input || 0,
      ptu_hourly: ptu
    };
  }
}

// Export for use in React app
export default AzurePricingService;

