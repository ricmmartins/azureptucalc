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
      raw_sample: pricingData.slice(0, 3).map(item => ({
        productName: item.productName,
        serviceName: item.serviceName,
        skuName: item.skuName,
        meterName: item.meterName,
        type: item.type,
        unitPrice: item.unitPrice,
        retailPrice: item.retailPrice,
        unitOfMeasure: item.unitOfMeasure
      })) // Include sample items for debugging
    };

    console.log('📤 Sending processed pricing:', {
      success: processedPricing.success,
      source: processedPricing.source,
      paygo: processedPricing.paygo,
      ptu: processedPricing.ptu,
      sample_item: processedPricing.raw_sample[0]
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
  console.log(`🔍 Extracting PAYG pricing for ${model} from ${items.length} items`);
  
  let input = null, output = null;
  const candidates = [];

  for (const item of items) {
    const productName = (item.productName || '').toLowerCase();
    const meterName = (item.meterName || '').toLowerCase();
    const skuName = (item.skuName || '').toLowerCase();
    const combinedName = `${productName} ${meterName} ${skuName}`.toLowerCase();
    
    // Get price from either field
    const price = parseFloat(item.unitPrice || item.retailPrice || 0);
    
    console.log(`📊 Checking item: ${item.productName} | ${item.meterName} | Price: ${price} | Type: ${item.type}`);
    
    if (price > 0) {
      candidates.push({
        name: combinedName,
        productName: item.productName,
        meterName: item.meterName,
        price: price,
        type: item.type,
        unitOfMeasure: item.unitOfMeasure
      });
      
      // Look for input/output tokens in various fields
      if ((combinedName.includes('input') || combinedName.includes('prompt')) && 
          (combinedName.includes('token') || item.unitOfMeasure?.toLowerCase().includes('token'))) {
        if (!input || price < input) input = price;
        console.log(`✅ Found input pricing: ${price} (${item.productName})`);
      }
      
      if ((combinedName.includes('output') || combinedName.includes('completion') || combinedName.includes('generated')) && 
          (combinedName.includes('token') || item.unitOfMeasure?.toLowerCase().includes('token'))) {
        if (!output || price < output) output = price;
        console.log(`✅ Found output pricing: ${price} (${item.productName})`);
      }
      
      // Alternative patterns for GPT pricing
      if (combinedName.includes('gpt') && combinedName.includes(model.replace('-', ''))) {
        if (combinedName.includes('input') || combinedName.includes('prompt')) {
          if (!input) input = price;
        } else if (combinedName.includes('output') || combinedName.includes('completion')) {
          if (!output) output = price;
        }
      }
    }
  }
  
  console.log(`💰 PAYG extraction result: input=${input}, output=${output}`);
  console.log(`📋 Candidates found: ${candidates.length}`);
  
  return {
    input: input || 0,
    output: output || 0,
    found_items: candidates.length,
    candidates: candidates.slice(0, 5) // Include some candidates for debugging
  };
}

// Extract PTU pricing from Azure API response
function extractPTUPricing(items, model, deployment) {
  console.log(`🔍 Extracting PTU pricing for ${model} (${deployment}) from ${items.length} items`);
  
  let ptuPrice = null;
  const candidates = [];

  for (const item of items) {
    const productName = (item.productName || '').toLowerCase();
    const meterName = (item.meterName || '').toLowerCase();
    const skuName = (item.skuName || '').toLowerCase();
    const combinedName = `${productName} ${meterName} ${skuName}`.toLowerCase();
    
    const price = parseFloat(item.unitPrice || item.retailPrice || 0);
    
    if (price > 0) {
      // Look for PTU, provisioned, or reservation pricing
      if (combinedName.includes('ptu') || 
          combinedName.includes('provisioned') || 
          combinedName.includes('reservation') ||
          item.type === 'Reservation') {
        
        candidates.push({
          name: combinedName,
          productName: item.productName,
          meterName: item.meterName,
          price: price,
          type: item.type,
          unitOfMeasure: item.unitOfMeasure
        });
        
        console.log(`📊 PTU candidate: ${item.productName} | ${item.meterName} | Price: ${price} | Type: ${item.type}`);
        
        if (!ptuPrice || price < ptuPrice) {
          ptuPrice = price;
          console.log(`✅ Found PTU pricing: ${price} (${item.productName})`);
        }
      }
      
      // Alternative search for hourly pricing
      if ((item.unitOfMeasure?.toLowerCase().includes('hour') || combinedName.includes('hour')) &&
          (combinedName.includes('gpt') || combinedName.includes('openai'))) {
        if (!ptuPrice || price < ptuPrice) {
          ptuPrice = price;
          console.log(`✅ Found hourly pricing: ${price} (${item.productName})`);
        }
      }
    }
  }
  
  // If no PTU pricing found, try to estimate from available data
  if (!ptuPrice && candidates.length === 0) {
    // Look for any pricing that might be PTU-related
    const hourlyItems = items.filter(item => {
      const combinedName = `${item.productName || ''} ${item.meterName || ''}`.toLowerCase();
      return item.unitOfMeasure?.toLowerCase().includes('hour') && parseFloat(item.unitPrice || item.retailPrice || 0) > 0;
    });
    
    if (hourlyItems.length > 0) {
      ptuPrice = parseFloat(hourlyItems[0].unitPrice || hourlyItems[0].retailPrice || 0);
      console.log(`⚠️ Using estimated PTU pricing: ${ptuPrice} (${hourlyItems[0].productName})`);
    }
  }

  console.log(`💰 PTU extraction result: ptuPrice=${ptuPrice}`);
  console.log(`📋 PTU candidates found: ${candidates.length}`);

  return {
    global: ptuPrice || 0,
    dataZone: ptuPrice ? Math.round(ptuPrice * 1.1) : 0,
    regional: ptuPrice ? Math.round(ptuPrice * 0.9) : 0,
    found_items: candidates.length,
    candidates: candidates.slice(0, 3) // Include some candidates for debugging
  };
}