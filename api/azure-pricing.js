// Vercel API Route: /api/azure-pricing
// Serverless function to fetch Azure OpenAI pricing data
// Bypasses CORS issues by making server-side API calls

export default async function handler(req, res) {
  // Set CORS headers to allow frontend calls
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, region, deployment } = req.query;
    
    console.log(`🔍 Fetching Azure pricing for model: ${model}, region: ${region}, deployment: ${deployment}`);

    // Build Azure API query with multiple search strategies
    const queries = [
      // Strategy 1: Specific model search
      `contains(productName, 'OpenAI') and contains(productName, '${model}')`,
      
      // Strategy 2: Broader OpenAI search
      `contains(productName, 'OpenAI') and contains(productName, 'gpt')`,
      
      // Strategy 3: Service-specific search
      `serviceName eq 'Foundry Models' and contains(productName, 'OpenAI')`,
      
      // Strategy 4: Most general search
      `contains(productName, 'OpenAI')`
    ];

    let pricingData = null;
    let usedStrategy = 0;

    // Try each query strategy until we get results
    for (let i = 0; i < queries.length; i++) {
      try {
        const azureUrl = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(queries[i])}&$top=50`;
        console.log(`📡 Strategy ${i + 1}: ${azureUrl}`);
        
        const response = await fetch(azureUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Azure-PTU-Calculator/1.0'
          }
        });

        if (!response.ok) {
          console.warn(`❌ Strategy ${i + 1} failed: ${response.status} ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        console.log(`📊 Strategy ${i + 1} returned ${data.Items?.length || 0} items`);
        
        if (data.Items && data.Items.length > 0) {
          pricingData = data.Items;
          usedStrategy = i + 1;
          break;
        }
      } catch (strategyError) {
        console.warn(`❌ Strategy ${i + 1} error:`, strategyError.message);
        continue;
      }
    }

    if (!pricingData || pricingData.length === 0) {
      console.warn('⚠️ No pricing data found with any strategy');
      return res.status(404).json({
        success: false,
        error: 'No pricing data found',
        source: 'azure-api',
        strategies_tried: queries.length
      });
    }

    console.log(`✅ Found ${pricingData.length} pricing items using strategy ${usedStrategy}`);

    // Process and structure the pricing data
    const processedPricing = {
      success: true,
      source: 'azure-api-live',
      timestamp: new Date().toISOString(),
      strategy_used: usedStrategy,
      total_items: pricingData.length,
      model: model,
      region: region,
      deployment: deployment,
      paygo: extractPAYGOPricing(pricingData, model),
      ptu: extractPTUPricing(pricingData, model, deployment),
      raw_items: pricingData.slice(0, 5) // Include first 5 items for debugging
    };

    console.log('📤 Sending processed pricing:', {
      success: processedPricing.success,
      source: processedPricing.source,
      paygo: processedPricing.paygo,
      ptu: processedPricing.ptu
    });

    return res.status(200).json(processedPricing);

  } catch (error) {
    console.error('💥 Azure pricing API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      source: 'azure-api-error'
    });
  }
}

// Extract PAYG pricing from Azure API response
function extractPAYGOPricing(items, model) {
  const paygoItems = items.filter(item => 
    item.type === 'Consumption' && 
    (item.productName?.toLowerCase().includes('input') || 
     item.productName?.toLowerCase().includes('output') ||
     item.meterName?.toLowerCase().includes('input') ||
     item.meterName?.toLowerCase().includes('output'))
  );

  let input = null, output = null;

  for (const item of paygoItems) {
    const name = (item.productName || item.meterName || '').toLowerCase();
    const price = parseFloat(item.unitPrice || item.retailPrice || 0);

    if (name.includes('input') && !input) {
      input = price;
    } else if (name.includes('output') && !output) {
      output = price;
    }
  }

  return {
    input: input || 0,
    output: output || 0,
    found_items: paygoItems.length
  };
}

// Extract PTU pricing from Azure API response
function extractPTUPricing(items, model, deployment) {
  const ptuItems = items.filter(item => 
    item.type === 'Reservation' || 
    item.productName?.toLowerCase().includes('ptu') ||
    item.meterName?.toLowerCase().includes('ptu') ||
    item.productName?.toLowerCase().includes('provisioned')
  );

  let ptuPrice = null;

  for (const item of ptuItems) {
    const price = parseFloat(item.unitPrice || item.retailPrice || 0);
    if (price > 0) {
      ptuPrice = price;
      break;
    }
  }

  return {
    global: ptuPrice || 0,
    dataZone: ptuPrice ? Math.round(ptuPrice * 1.1) : 0,
    regional: ptuPrice ? Math.round(ptuPrice * 0.9) : 0,
    found_items: ptuItems.length
  };
}