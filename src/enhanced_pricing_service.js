// Enhanced Azure OpenAI Pricing Service
// Fetches live pricing from Azure Retail Prices API via Vercel serverless proxy
// Falls back to hardcoded official pricing when the API is unavailable

class AzureOpenAIPricingService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 3 * 60 * 60 * 1000; // 3 hours
    this.fallbackPricing = this.loadFallbackPricing();
    this.apiAvailable = null; // null = unknown, true/false after first attempt
    console.log('🔧 Azure Pricing Service initialized');
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
        paygo: { input: 2.50, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-4o-mini': {
        paygo: { input: 0.15, output: 0.60 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-4': {
        paygo: { input: 30.00, output: 60.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-4-turbo': {
        paygo: { input: 10.00, output: 30.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-35-turbo': {
        paygo: { input: 0.50, output: 1.50 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o1': {
        paygo: { input: 15.00, output: 60.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o1-mini': {
        paygo: { input: 3.00, output: 12.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o3': {
        paygo: { input: 10.00, output: 40.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o3-mini': {
        paygo: { input: 1.10, output: 4.40 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o4-mini': {
        paygo: { input: 1.10, output: 4.40 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'text-embedding-ada-002': {
        paygo: { input: 0.10, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'text-embedding-3-large': {
        paygo: { input: 0.13, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'text-embedding-3-small': {
        paygo: { input: 0.02, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      }
    };
  }

  // Main entry point: get pricing for a model/region/deployment
  async getPricing(model, region = 'eastus2', deploymentType = 'global') {
    console.log('💰 Getting pricing for', { model, region, deploymentType });
    const cacheKey = `${model}-${region}-${deploymentType}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('📋 Using cached pricing (source:', cached.data.source, ')');
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Try live API via Vercel serverless proxy
    let livePricing = null;
    if (this.apiAvailable !== false) {
      try {
        livePricing = await this.fetchFromProxy(model, region, deploymentType);
      } catch (error) {
        console.warn('⚠️ Proxy API call failed:', error.message);
      }
    }

    if (livePricing) {
      console.log('✅ Live pricing obtained for', model);
      this.cache.set(cacheKey, { data: livePricing, timestamp: Date.now() });
      return livePricing;
    }

    // Fallback to hardcoded pricing
    console.log('🔄 Using fallback pricing for', model);
    const fallback = this.getFallbackPricing(model, deploymentType);
    this.cache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }

  // Fetch pricing from the Vercel serverless proxy (/api/azure-pricing)
  async fetchFromProxy(model, region, deploymentType) {
    const apiUrl = `/api/azure-pricing?model=${encodeURIComponent(model)}&region=${encodeURIComponent(region)}&deployment=${encodeURIComponent(deploymentType)}`;
    console.log(`📡 Fetching from proxy: ${apiUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      // If we get HTML back (SPA fallback), the API route isn't available
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        console.warn('⚠️ Proxy returned HTML — API route not available (local dev or misconfigured)');
        this.apiAvailable = false;
        return null;
      }

      if (!response.ok) {
        console.warn(`⚠️ Proxy returned ${response.status}`);
        if (response.status === 404) {
          this.apiAvailable = false;
        }
        return null;
      }

      const data = await response.json();
      console.log('📊 Proxy response:', { success: data.success, source: data.source, items: data.total_items });

      if (!data.success) {
        return null;
      }

      this.apiAvailable = true;

      // Validate that we got meaningful pricing data
      const paygoInput = data.paygo?.input || 0;
      const paygoOutput = data.paygo?.output || 0;
      const ptuGlobal = data.ptu?.global || 0;

      // If the API returned zeros for everything, treat it as a miss
      if (paygoInput === 0 && paygoOutput === 0 && ptuGlobal === 0) {
        console.warn('⚠️ Proxy returned all-zero pricing, falling back');
        return null;
      }

      // Merge API data with fallback for any missing fields
      const fallback = this.fallbackPricing[model] || {};

      return {
        paygo: {
          input: paygoInput || fallback.paygo?.input || 0,
          output: paygoOutput || fallback.paygo?.output || 0
        },
        ptu: {
          global: data.ptu?.global || fallback.ptu?.global || 1.00,
          dataZone: data.ptu?.dataZone || fallback.ptu?.dataZone || 1.10,
          regional: data.ptu?.regional || fallback.ptu?.regional || 2.00
        },
        source: 'live',
        timestamp: data.timestamp || new Date().toISOString(),
        strategy_used: data.strategy_used,
        total_items: data.total_items,
        raw_sample: data.raw_sample
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn('⚠️ Proxy request timed out');
      } else {
        console.warn('⚠️ Proxy fetch error:', error.message);
      }
      return null;
    }
  }

  // Get fallback pricing when API is unavailable
  getFallbackPricing(model, deploymentType = 'global') {
    const fallback = this.fallbackPricing[model];
    
    if (!fallback) {
      console.log(`⚠️ No fallback pricing for model: ${model}`);
      return {
        paygo: { input: 0, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 },
        source: 'fallback',
        timestamp: new Date().toISOString()
      };
    }

    return {
      paygo: { ...fallback.paygo },
      ptu: { ...fallback.ptu },
      source: 'fallback',
      timestamp: new Date().toISOString()
    };
  }

  // Force refresh pricing (clears cache and resets API availability)
  async refreshPricing(model, region, deploymentType) {
    const cacheKey = `${model}-${region}-${deploymentType}`;
    this.cache.delete(cacheKey);
    this.apiAvailable = null;
    return this.getPricing(model, region, deploymentType);
  }

  // Refresh all cached pricing
  async refreshAllPricing() {
    this.cache.clear();
    this.apiAvailable = null;
    return { cleared: true, timestamp: new Date().toISOString() };
  }

  // Get pricing status
  getPricingStatus() {
    return {
      cacheSize: this.cache.size,
      apiAvailable: this.apiAvailable,
      cacheExpiry: this.cacheExpiry / (60 * 60 * 1000) + ' hours'
    };
  }
}

// Export for use in React app
export default AzureOpenAIPricingService;

