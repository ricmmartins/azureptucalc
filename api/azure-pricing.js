// Vercel API Route: /api/azure-pricing
// Serverless function to fetch Azure OpenAI pricing data from the Azure Retail Prices API
// Bypasses CORS issues by making server-side API calls

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, region, deployment } = req.query;
    console.log(`Fetching Azure pricing for model=${model}, region=${region}, deployment=${deployment}`);

    // Normalize the model name for matching meter names
    // Azure API uses names like "GPT 5.2", "GPT 5 Mini", "gpt-4o", etc.
    const modelNormalized = (model || 'gpt-4o').toLowerCase().replace(/\./g, '.').replace(/-/g, ' ');

    // --- STEP 1: Fetch PAYGO token pricing ---
    const paygo = await fetchPaygoPricing(model, modelNormalized);

    // --- STEP 2: Fetch PTU (Provisioned Managed) pricing ---
    const ptu = await fetchPTUPricing();

    const result = {
      success: true,
      source: 'azure-api-live',
      timestamp: new Date().toISOString(),
      model,
      region,
      deployment,
      paygo,
      ptu,
      raw_sample: []
    };

    console.log('Returning pricing:', JSON.stringify({ paygo, ptu }));
    return res.status(200).json(result);

  } catch (error) {
    console.error('Azure pricing API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      source: 'azure-api-error'
    });
  }
}

// ─── PAYGO Token Pricing ────────────────────────────────────────────────────────

async function fetchPaygoPricing(model, modelNormalized) {
  // Build model-specific search terms
  // The Azure API uses product names like "Azure OpenAI GPT5", "Azure OpenAI"
  // and meter names like "GPT 5.2 chat inp Gl 1M Tokens", "gpt 4o 0513 Input Data Zone Tokens"
  const modelSearchTerms = buildModelSearchTerms(model);

  // Try model-specific queries first, then broader queries
  const queries = [
    ...modelSearchTerms.map(term =>
      `contains(productName, 'OpenAI') and contains(meterName, '${term}')`
    ),
    // Broader fallback: search product name for model family
    `contains(productName, 'OpenAI') and contains(productName, '${getModelFamily(model)}')`
  ];

  let allItems = [];

  for (const query of queries) {
    try {
      const url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(query)}&$top=100`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.Items && data.Items.length > 0) {
        allItems = data.Items;
        break;
      }
    } catch (e) {
      console.warn('PAYGO query failed:', e.message);
    }
  }

  if (allItems.length === 0) {
    console.log('No PAYGO items found for', model);
    return { input: 0, output: 0, found_items: 0 };
  }

  // Parse items to find Global Standard input/output per 1M tokens (non-batch, non-cached)
  return parsePaygoItems(allItems, model, modelNormalized);
}

function buildModelSearchTerms(model) {
  // Map model identifiers to how they appear in Azure API meter names
  const m = model.toLowerCase();
  const terms = [];

  if (m === 'gpt-5.4') {
    terms.push('GPT 5.4', 'gpt-5.4', '5.4');
  } else if (m === 'gpt-5.3-codex') {
    terms.push('GPT 5.3 Codex', 'gpt-5.3-codex', '5.3 codex');
  } else if (m === 'gpt-5.2-codex') {
    terms.push('GPT 5.2 Codex', 'gpt-5.2-codex', '5.2 codex');
  } else if (m === 'gpt-5.2') {
    terms.push('GPT 5.2 chat inp Gl', 'GPT 5.2 chat opt Gl', 'gpt-5.2', '5.2 chat');
  } else if (m === 'gpt-5.1-codex') {
    terms.push('GPT 5.1 Codex', 'gpt-5.1-codex', '5.1 codex');
  } else if (m === 'gpt-5.1') {
    terms.push('GPT 5.1 chat inp Gl', 'GPT 5.1 chat opt Gl', 'gpt-5.1', '5.1 chat');
  } else if (m === 'gpt-5') {
    terms.push('GPT 5 inpt Glbl', 'GPT 5 outpt Glbl', 'gpt-5 ', 'GPT 5 ');
  } else if (m === 'gpt-5-mini') {
    terms.push('GPT 5 Mini', 'gpt-5-mini', '5 Mini');
  } else if (m === 'gpt-4.1-nano') {
    terms.push('GPT 4.1 Nano', 'gpt-4.1-nano', '4.1 nano');
  } else if (m === 'gpt-4.1-mini') {
    terms.push('GPT 4.1 Mini', 'gpt-4.1-mini', '4.1 mini');
  } else if (m === 'gpt-4.1') {
    terms.push('GPT 4.1 ', 'gpt-4.1 ', 'gpt-4.1-');
  } else if (m.startsWith('gpt-4o-mini')) {
    terms.push('gpt-4o-mini', 'gpt 4o mini', '4o mini');
  } else if (m.startsWith('gpt-4o')) {
    terms.push('gpt-4o ', 'gpt 4o ', 'gpt-4o');
  } else if (m.startsWith('gpt-4')) {
    terms.push('gpt-4 ', 'gpt 4 ', 'gpt-4');
  } else if (m === 'o3') {
    terms.push('o3 ', 'o3-');
  } else if (m === 'o4-mini') {
    terms.push('o4-mini', 'o4 mini');
  } else if (m === 'o3-mini') {
    terms.push('o3-mini', 'o3 mini');
  } else if (m === 'o1') {
    terms.push('o1 ', 'o1-');
  } else if (m.startsWith('o1-mini')) {
    terms.push('o1-mini', 'o1 mini');
  } else {
    terms.push(model.replace(/-/g, ' '));
  }

  return terms;
}

function getModelFamily(model) {
  const m = model.toLowerCase();
  if (m.startsWith('gpt-5')) return 'GPT5';
  if (m.startsWith('gpt-4o')) return 'OpenAI';
  if (m.startsWith('gpt-4')) return 'OpenAI';
  if (m.startsWith('gpt-3')) return 'OpenAI';
  if (m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')) return 'OpenAI';
  return 'OpenAI';
}

function parsePaygoItems(items, model, modelNormalized) {
  // We want: Global Standard, per 1M tokens, non-batch, non-cached
  // Input patterns: "inp", "input", "inpt", "prompt"
  // Output patterns: "opt", "outpt", "output", "completion"
  // Global patterns: "Gl", "Glbl", "Global"
  // Exclude: "Batch", "cached", "cd ", "cchd"

  const inputPattern = /\b(inp|input|inpt|prompt)\b/i;
  const outputPattern = /\b(opt|outpt|output|completion|generated)\b/i;
  const globalPattern = /\b(gl\b|glbl|global)/i;
  const excludePattern = /\b(batch|cached|cd\b|cchd|fine.?tun|grdr|dev ft|ft |tts|aud)/i;

  let bestInput = null;
  let bestOutput = null;
  let inputCandidates = [];
  let outputCandidates = [];

  for (const item of items) {
    const meter = (item.meterName || '').toLowerCase();
    const product = (item.productName || '').toLowerCase();
    const sku = (item.skuName || '').toLowerCase();
    const unit = (item.unitOfMeasure || '').toLowerCase();
    const price = parseFloat(item.retailPrice || item.unitPrice || 0);

    if (price <= 0) continue;
    if (excludePattern.test(meter) || excludePattern.test(sku)) continue;
    if (item.type === 'Reservation') continue;

    // Must be token-based pricing
    const isTokenPricing = unit.includes('token') || unit.includes('1m') || unit.includes('1k');
    if (!isTokenPricing) continue;

    // Normalize price to per 1M tokens
    let pricePerMillion = price;
    if (unit.includes('1k') || unit.includes('1000')) {
      pricePerMillion = price * 1000;
    }
    // If unit says "1M" or "1 M" it's already per million

    const isGlobal = globalPattern.test(meter) || globalPattern.test(sku);
    const isInput = inputPattern.test(meter);
    const isOutput = outputPattern.test(meter);

    // Check if this item matches our model
    if (!isModelMatch(meter, sku, product, model)) continue;

    if (isInput && isGlobal) {
      inputCandidates.push({ price: pricePerMillion, meter: item.meterName, unit });
    } else if (isOutput && isGlobal) {
      outputCandidates.push({ price: pricePerMillion, meter: item.meterName, unit });
    } else if (isInput) {
      const depType = /data.?zone/i.test(meter + ' ' + sku) ? 'dataZone' : 'regional';
      inputCandidates.push({ price: pricePerMillion, meter: item.meterName, unit, nonGlobal: true, deploymentType: depType });
    } else if (isOutput) {
      const depType = /data.?zone/i.test(meter + ' ' + sku) ? 'dataZone' : 'regional';
      outputCandidates.push({ price: pricePerMillion, meter: item.meterName, unit, nonGlobal: true, deploymentType: depType });
    }
  }

  // Prefer global candidates, fall back to any
  const globalInputs = inputCandidates.filter(c => !c.nonGlobal);
  const globalOutputs = outputCandidates.filter(c => !c.nonGlobal);
  const dzInputs = inputCandidates.filter(c => c.deploymentType === 'dataZone');
  const dzOutputs = outputCandidates.filter(c => c.deploymentType === 'dataZone');
  const regInputs = inputCandidates.filter(c => c.deploymentType === 'regional');
  const regOutputs = outputCandidates.filter(c => c.deploymentType === 'regional');

  bestInput = (globalInputs.length > 0 ? globalInputs : inputCandidates)[0]?.price || 0;
  bestOutput = (globalOutputs.length > 0 ? globalOutputs : outputCandidates)[0]?.price || 0;

  console.log(`PAYGO for ${model}: input=$${bestInput}/1M, output=$${bestOutput}/1M (${inputCandidates.length} input, ${outputCandidates.length} output candidates)`);

  return {
    input: Number(bestInput.toFixed(4)),
    output: Number(bestOutput.toFixed(4)),
    found_items: items.length,
    byDeployment: {
      global: {
        input: globalInputs[0]?.price ? Number(globalInputs[0].price.toFixed(4)) : 0,
        output: globalOutputs[0]?.price ? Number(globalOutputs[0].price.toFixed(4)) : 0
      },
      dataZone: {
        input: dzInputs[0]?.price ? Number(dzInputs[0].price.toFixed(4)) : 0,
        output: dzOutputs[0]?.price ? Number(dzOutputs[0].price.toFixed(4)) : 0
      },
      regional: {
        input: regInputs[0]?.price ? Number(regInputs[0].price.toFixed(4)) : 0,
        output: regOutputs[0]?.price ? Number(regOutputs[0].price.toFixed(4)) : 0
      }
    }
  };
}

function isModelMatch(meter, sku, product, model) {
  const m = model.toLowerCase();
  const combined = `${meter} ${sku} ${product}`.toLowerCase();

  // Build variations of the model name
  const variants = [
    m,                          // gpt-5.2
    m.replace(/-/g, ' '),       // gpt 5.2
    m.replace(/-/g, ''),        // gpt5.2
    m.replace(/\./g, ''),       // gpt-52
    m.replace(/-/g, ' ').replace(/\./g, ' '), // gpt 5 2
  ];

  // Special handling for non-dotted models
  if (m === 'gpt-5') {
    // Must match "gpt 5 " or "gpt-5 " or "gpt 5\b" but NOT "gpt 5." (which is 5.1/5.2)
    return /\bgpt[\s-]5\b(?![\.\d])/i.test(combined) && !combined.includes('5.');
  }

  return variants.some(v => combined.includes(v));
}

// ─── PTU (Provisioned Managed) Pricing ──────────────────────────────────────────

async function fetchPTUPricing() {
  // PTU pricing is uniform across all models — query for "Provisioned Managed" meters
  // Also fetch from the reservation product for monthly/yearly reservation rates
  const queries = [
    `contains(productName, 'OpenAI') and contains(meterName, 'Provisioned Managed')`,
    `contains(productName, 'Foundry Provisioned Throughput Reservation') and contains(meterName, 'Provisioned Managed')`
  ];

  let allItems = [];

  for (const query of queries) {
    try {
      const url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(query)}&$top=100`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.Items) allItems.push(...data.Items);
    } catch (e) {
      console.warn('PTU query failed:', e.message);
    }
  }

  console.log(`PTU queries returned ${allItems.length} total items`);

  let global = 0, dataZone = 0, regional = 0;
  // Reservation prices: keyed by deployment type and term
  let reservations = {
    global: { monthly: 0, yearly: 0 },
    dataZone: { monthly: 0, yearly: 0 },
    regional: { monthly: 0, yearly: 0 }
  };

  for (const item of allItems) {
    const meter = (item.meterName || '').toLowerCase();
    const unit = (item.unitOfMeasure || '').toLowerCase();
    const price = parseFloat(item.retailPrice || item.unitPrice || 0);
    const term = (item.reservationTerm || '').toLowerCase();

    if (price <= 0) continue;
    if (!unit.includes('hour')) continue;

    // Determine deployment type
    let depType = null;
    if (meter.includes('global')) depType = 'global';
    else if (meter.includes('data zone')) depType = 'dataZone';
    else if (meter.includes('regional')) depType = 'regional';
    if (!depType) continue;

    if (item.type === 'Reservation') {
      // Reservation pricing (monthly or yearly term)
      if (term.includes('month')) {
        if (!reservations[depType].monthly || price < reservations[depType].monthly) {
          reservations[depType].monthly = price;
        }
      } else if (term.includes('year')) {
        if (!reservations[depType].yearly || price < reservations[depType].yearly) {
          reservations[depType].yearly = price;
        }
      }
    } else {
      // Hourly consumption pricing
      if (depType === 'global' && (!global || price < global)) global = price;
      else if (depType === 'dataZone' && (!dataZone || price < dataZone)) dataZone = price;
      else if (depType === 'regional' && (!regional || price < regional)) regional = price;
    }
  }

  console.log(`PTU rates: global=$${global}/hr, dataZone=$${dataZone}/hr, regional=$${regional}/hr`);
  console.log(`PTU reservations:`, JSON.stringify(reservations));

  return {
    global: global || 0,
    dataZone: dataZone || 0,
    regional: regional || 0,
    reservations,
    found_items: allItems.length
  };
}