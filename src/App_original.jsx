import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';
import { Checkbox } from './components/ui/checkbox';
import { Copy, RefreshCw, TrendingUp, Info, CheckCircle, AlertCircle, Brain, Globe, MapPin, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ptuModels from './ptu_supported_models.json';
import correctedPricingService from './corrected_pricing_service.js';
import './App.css';

function App() {
  // Use corrected pricing service instead of old one
  const [pricingService] = useState(() => correctedPricingService);
  const [livePricingData, setLivePricingData] = useState(null)
  const [pricingStatus, setPricingStatus] = useState({
    lastRefreshed: new Date().toLocaleString(),
    isLoading: false,
    usingLiveData: false
  })
  
  const [selectedRegion, setSelectedRegion] = useState('east-us-2')
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [selectedDeployment, setSelectedDeployment] = useState('data-zone')
  const [useCustomPricing, setUseCustomPricing] = useState(false)
  const [customPaygoInput, setCustomPaygoInput] = useState('')
  const [customPaygoOutput, setCustomPaygoOutput] = useState('')
  const [customPtuPrice, setCustomPtuPrice] = useState('')
  
  const [formData, setFormData] = useState({
    avgTPM: 5678,
    p99TPM: 12000,
    maxTPM: 25000,
    avgPTU: 1,
    p99PTU: 1,
    maxPTU: 1,
    recommendedPTU: 1,
    monthlyMinutes: 43800,
    basePTUs: 2
  })
  
  const [calculations, setCalculations] = useState({})
  const [currentPricing, setCurrentPricing] = useState({
    paygo_input: 0.15,
    paygo_output: 0.60,
    ptu_monthly: 75
  })

  const kqlQuery = `// Burst-Aware Azure OpenAI PTU Sizing Analysis
// Run this query in Azure Monitor Log Analytics for accurate capacity planning

let window = 1m;              // granularity for burst detection
let p      = 0.99;            // percentile for burst sizing
AzureMetrics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| where MetricName in ("ProcessedPromptTokens","ProcessedCompletionTokens")
| where TimeGenerated >= ago(7d)
| summarize Tokens = sum(Total) by bin(TimeGenerated, window)
| summarize
    AvgTPM = avg(Tokens),
    P99TPM = percentile(Tokens, p),
    MaxTPM = max(Tokens)
| extend
    AvgPTU = ceiling(AvgTPM / 50000.0),
    P99PTU = ceiling(P99TPM / 50000.0),
    MaxPTU = ceiling(MaxTPM / 50000.0)
| extend RecommendedPTU = max_of(AvgPTU, P99PTU)   // higher value covers bursts
| project AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU`

  const refreshPricingData = async () => {
    setPricingStatus(prev => ({ ...prev, isLoading: true }))
    
    try {
      const liveData = await pricingService.fetchOpenAIPricing()
      setLivePricingData(liveData)
      
      setPricingStatus({
        lastRefreshed: new Date().toLocaleString(),
        isLoading: false,
        usingLiveData: true
      })
      
      console.log('Live pricing data loaded:', liveData)
      
    } catch (error) {
      console.error('Failed to fetch live pricing:', error)
      
      setPricingStatus({
        lastRefreshed: new Date().toLocaleString(),
        isLoading: false,
        usingLiveData: false
      })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const getCurrentPricing = () => {
    // Use corrected pricing service for accurate Azure pricing
    const pricing = pricingService.getModelPricing(selectedModel, selectedDeployment);
    
    return {
      paygo_input: pricing.paygo.input,
      paygo_output: pricing.paygo.output,
      ptu_hourly: pricing.ptu.hourly,
      ptu_monthly: pricing.ptu.monthly,
      ptu_yearly: pricing.ptu.yearly,
      minPTU: pricing.minPTU,
      tokensPerPTUPerMinute: pricing.tokensPerPTUPerMinute
    };
  };

  // Auto-update pricing when selections change
  useEffect(() => {
    if (!useCustomPricing) {
      const pricing = getCurrentPricing();
      setCurrentPricing(pricing);
    }
  }, [selectedRegion, selectedModel, selectedDeployment, useCustomPricing]);

  // Update pricing when custom pricing is toggled
  useEffect(() => {
    if (useCustomPricing) {
      setCurrentPricing({
        paygo_input: parseFloat(customPaygoInput) || 0.15,
        paygo_output: parseFloat(customPaygoOutput) || 0.60,
        ptu_monthly: parseFloat(customPtuPrice) || 75
      });
    } else {
      const pricing = getCurrentPricing();
      setCurrentPricing(pricing);
    }
  }, [useCustomPricing, customPaygoInput, customPaygoOutput, customPtuPrice]);

  const loadOfficialPricing = async () => {
    // Try to fetch live pricing data
    setPricingStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const liveData = await pricingService.fetchOpenAIPricing();
      setLivePricingData(liveData);
      
      // Update pricing with live data
      const livePricing = pricingService.getModelPricing(
        liveData, 
        selectedModel, 
        selectedRegion.replace('-', ''), 
        selectedDeployment === 'global' ? 'global' : 
        selectedDeployment === 'data-zone' ? 'data-zone' : 'regional'
      );
      
      if (livePricing) {
        setCurrentPricing({
          paygo_input: livePricing.paygo_input,
          paygo_output: livePricing.paygo_output,
          ptu_monthly: livePricing.ptu_hourly * 24 * 30
        });
      }
      
      setPricingStatus({
        lastRefreshed: new Date().toLocaleString(),
        isLoading: false,
        usingLiveData: true
      });
      
    } catch (error) {
      console.error('Failed to load live pricing:', error);
      
      // Fallback to static pricing
      const pricing = getCurrentPricing();
      setCurrentPricing(pricing);
      
      setPricingStatus({
        lastRefreshed: new Date().toLocaleString(),
        isLoading: false,
        usingLiveData: false
      });
    }
  };

  // Calculate costs based on current pricing and form data with burst pattern analysis
  useEffect(() => {
    // Burst pattern analysis
    const burstRatio = formData.p99TPM && formData.avgTPM ? formData.p99TPM / formData.avgTPM : 1;
    const peakRatio = formData.maxTPM && formData.avgTPM ? formData.maxTPM / formData.avgTPM : 1;
    const ptuVariance = formData.p99PTU && formData.avgPTU ? Math.abs(formData.p99PTU - formData.avgPTU) : 0;
    
    // Calculate PTU requirements using corrected pricing
    const ptuNeeded = Math.max(
      formData.recommendedPTU || Math.ceil(formData.avgTPM / currentPricing.tokensPerPTUPerMinute),
      currentPricing.minPTU
    );
    
    // Monthly token calculations
    const monthlyTokens = (formData.avgTPM * formData.monthlyMinutes) / 1000000;
    const inputTokens = monthlyTokens * 0.5; // Assume 50/50 split
    const outputTokens = monthlyTokens * 0.5;
    
    // PAYGO costs using corrected pricing
    const paygoCost = (inputTokens * currentPricing.paygo_input) + (outputTokens * currentPricing.paygo_output);
    
    // PTU costs using corrected pricing (hourly rates converted to monthly)
    const ptuHourlyCost = ptuNeeded * currentPricing.ptu_hourly * 24 * 30; // Hourly to monthly
    const ptuMonthlyCost = ptuNeeded * currentPricing.ptu_monthly; // Monthly reservation
    const ptuYearlyCost = ptuNeeded * (currentPricing.ptu_yearly / 12); // Yearly reservation (monthly equivalent)
    
    // Hybrid costs - use AvgPTU for base, handle overflow with PAYGO
    const basePTUs = Math.max(formData.avgPTU || formData.basePTUs, currentPricing.minPTU);
    const hybridBaseCost = basePTUs * currentPricing.ptu_monthly;
    
    // Calculate overflow tokens (P99TPM - base capacity)
    const baseCapacity = basePTUs * currentPricing.tokensPerPTUPerMinute;
    const overflowTPM = Math.max(0, formData.p99TPM - baseCapacity);
    const overflowTokensMonthly = (overflowTPM * formData.monthlyMinutes) / 1000000;
    const overflowInputTokens = overflowTokensMonthly * 0.5;
    const overflowOutputTokens = overflowTokensMonthly * 0.5;
    const overflowCost = (overflowInputTokens * currentPricing.paygo_input) + (overflowOutputTokens * currentPricing.paygo_output);
    
    const hybridHourlyCost = (basePTUs * currentPricing.ptu_hourly * 24 * 30) + overflowCost;
    const hybridMonthlyCost = hybridBaseCost + overflowCost;
    const hybridYearlyCost = (basePTUs * (currentPricing.ptu_yearly / 12)) + overflowCost;
    
    // Utilization based on average usage vs recommended PTU capacity
    const utilization = (formData.avgTPM / (ptuNeeded * currentPricing.tokensPerPTUPerMinute)) * 100;
    // Burst characteristics
    const isBursty = burstRatio > 2.0; // P99 is more than 2x average
    const hasSpikes = peakRatio > 3.0; // Max is more than 3x average
    const steadyUsage = burstRatio < 1.5; // P99 is close to average
    
    setCalculations({
      ptuNeeded,
      monthlyTokens,
      paygoCost,
      ptuHourlyCost,
      ptuMonthlyCost,
      ptuYearlyCost,
      hybridHourlyCost,
      hybridMonthlyCost,
      hybridYearlyCost,
      utilization,
      costPerMillion: paygoCost / monthlyTokens,
      // Burst analysis
      burstRatio,
      peakRatio,
      ptuVariance,
      isBursty,
      hasSpikes,
      steadyUsage,
      basePTUs,
      overflowCost,
      overflowTPM
    });
  }, [formData, currentPricing]);

  const chartData = [
    { name: 'PAYGO', cost: calculations.paygoCost || 0 },
    { name: 'PTU (Hourly)', cost: calculations.ptuHourlyCost || 0 },
    { name: 'PTU (Monthly)', cost: calculations.ptuMonthlyCost || 0 },
    { name: 'PTU (Yearly)', cost: calculations.ptuYearlyCost || 0 },
    { name: 'Hybrid (Hourly)', cost: calculations.hybridHourlyCost || 0 },
    { name: 'Hybrid (Monthly)', cost: calculations.hybridMonthlyCost || 0 },
    { name: 'Hybrid (Yearly)', cost: calculations.hybridYearlyCost || 0 }
  ];

  const getRecommendation = () => {
    if (!calculations.utilization) return { type: 'PAYGO', reason: 'Calculating...', icon: '⏳' };
    
    // Enhanced recommendation logic based on burst patterns and utilization
    const { isBursty, hasSpikes, steadyUsage, burstRatio, utilization } = calculations;
    
    // Very low utilization - always PAYGO
    if (utilization < 15) {
      return { 
        type: 'PAYGO', 
        reason: `Very low utilization (${utilization.toFixed(1)}%). PTU reservations would be cost-ineffective. Stick with PAYGO for maximum flexibility.`,
        icon: '❌',
        details: 'Your usage is too low to justify PTU reservations.'
      };
    }
    
    // High burst patterns - favor hybrid
    if (isBursty && utilization < 50) {
      return { 
        type: 'Hybrid Model', 
        reason: `High burst pattern detected (${burstRatio.toFixed(1)}x burst ratio). Hybrid model recommended: reserve ${calculations.basePTUs} PTUs for baseline, use PAYGO for ${calculations.overflowTPM.toLocaleString()} TPM overflow.`,
        icon: '⚡',
        details: `Base cost: $${(calculations.basePTUs * currentPricing.ptu_monthly).toFixed(2)}/mo + $${calculations.overflowCost.toFixed(2)}/mo overflow`
      };
    }
    
    // Extreme spikes - PAYGO or careful hybrid
    if (hasSpikes) {
      return { 
        type: 'PAYGO or Careful Hybrid', 
        reason: `Extreme usage spikes detected (${calculations.peakRatio.toFixed(1)}x peak ratio). Consider PAYGO for flexibility, or hybrid with conservative base PTUs.`,
        icon: '🚨',
        details: 'Large spikes make full PTU reservations risky and expensive.'
      };
    }
    
    // Steady usage with good utilization - PTU recommended
    if (steadyUsage && utilization > 40) {
      const savingsYearly = ((calculations.ptuHourlyCost - calculations.ptuYearlyCost) * 12).toFixed(0);
      return { 
        type: 'PTU (Yearly)', 
        reason: `Steady usage pattern (${burstRatio.toFixed(1)}x burst ratio) with good utilization (${utilization.toFixed(1)}%). Yearly PTU reservation offers maximum savings.`,
        icon: '✅',
        details: `Annual savings: $${savingsYearly}. Consistent workload justifies long-term commitment.`
      };
    }
    
    // Medium utilization with some bursts - hybrid
    if (utilization >= 20 && utilization < 60) {
      return { 
        type: 'Hybrid Model', 
        reason: `Moderate utilization (${utilization.toFixed(1)}%) with burst ratio of ${burstRatio.toFixed(1)}x. Hybrid approach balances cost and flexibility.`,
        icon: '⚠️',
        details: `Reserve ${calculations.basePTUs} PTUs for baseline, handle bursts with PAYGO overflow.`
      };
    }
    
    // High utilization - PTU
    if (utilization >= 60) {
      return { 
        type: 'PTU (Monthly/Yearly)', 
        reason: `High utilization (${utilization.toFixed(1)}%) justifies PTU reservations. Choose monthly for flexibility or yearly for maximum savings.`,
        icon: '✅',
        details: 'Sustained high usage makes PTU reservations cost-effective.'
      };
    }
    
    // Default fallback
    return { 
      type: 'PAYGO', 
      reason: 'Current usage patterns suggest PAYGO for optimal cost-effectiveness.',
      icon: '💡',
      details: 'Monitor usage patterns and reassess as workload grows.'
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Azure OpenAI PTU Estimator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Optimize your Azure OpenAI costs by analyzing real usage patterns and comparing 
            PAYGO, PTU, and hybrid pricing models
          </p>
        </div>

        {/* Pricing Data Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Pricing Data Status
              </CardTitle>
              <CardDescription>Azure OpenAI pricing and model availability information</CardDescription>
            </div>
            <Button 
              onClick={refreshPricingData} 
              disabled={pricingStatus.isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${pricingStatus.isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Current pricing data loaded (expires in 3 hours)</span>
              </div>
              <p className="text-sm text-gray-600">Last refreshed: {pricingStatus.lastRefreshed}</p>
              
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Data Sources</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Azure OpenAI Service official pricing documentation</li>
                  <li>• Official Azure pricing pages and calculators</li>
                  <li>• Microsoft Learn documentation for PTU rates</li>
                  <li>• Azure service deployment and availability data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KQL Query Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-orange-600" />
              Step 1: Get Your Token Data
            </CardTitle>
            <CardDescription>
              Run this KQL query in your Azure Log Analytics workspace to calculate your average tokens per minute (TPM)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{kqlQuery}</code>
                </pre>
                <Button
                  onClick={() => copyToClipboard(kqlQuery)}
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">How to use this query:</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Navigate to your Azure Log Analytics workspace</li>
                  <li>Paste and run the query above</li>
                  <li>The query will show results with AvgTPM, P99TPM, MaxTPM, and RecommendedPTU</li>
                  <li>Note the "RecommendedPTU" value for your resource and enter it in the calculator below</li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  💡 Query Features:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Fine-grained binning:</strong> Aggregates token counts per minute to expose bursts.</li>
                  <li>• <strong>Peak statistics:</strong> Captures max / P99 tokens-per-minute (TPM) to size for bursts.</li>
                  <li>• <strong>Dual PTU estimate:</strong> Computes PTUs from both average and peak, provisioning to the higher value.</li>
                  <li>• <strong>RecommendedPTU:</strong> The higher value to cover bursts without large over-allocation.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Step 2: Input Parameters
            </CardTitle>
            <CardDescription>Configure your pricing parameters and usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Deployment Type Cards */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Global Deployment</h4>
                    <p className="text-sm text-gray-600">Global SKU with worldwide availability and load balancing</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Data Zone Deployment</h4>
                    <p className="text-sm text-gray-600">Geographic-based deployment (EU or US) for data residency</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-orange-50">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium">Regional Deployment</h4>
                    <p className="text-sm text-gray-600">Local region deployment (up to 27 regions) for lowest latency</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Official PTU Pricing Loaded
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Azure Region</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ptuModels.regions).map(([key, name]) => {
                          // Count how many PTU models are available in this region
                          const modelCount = Object.values(ptuModels.ptu_supported_models)
                            .filter(model => model.regions && model.regions.includes(key)).length;
                          
                          return (
                            <SelectItem key={key} value={key}>
                              {name} ({modelCount} PTU models)
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">OpenAI Model (PTU Supported Only)</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ptuModels.ptu_supported_models).map(([key, model]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {model.name}
                              <Badge variant="secondary">PTU</Badge>
                              {model.min_ptu && (
                                <Badge variant="outline" className="text-xs">
                                  Min: {model.min_ptu} PTU
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600">
                      Only models that support Provisioned Throughput Units (PTU) are shown. 
                      Models like DALL-E and TTS do not support PTU reservations.
                    </p>
                    
                    {/* Minimum PTU Explanation */}
                    <div className="bg-amber-50 p-3 rounded-lg mt-2">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-amber-600" />
                        Minimum PTU Requirements Explained
                      </h4>
                      <div className="space-y-1 text-xs text-gray-700">
                        <div>
                          <strong>Minimum PTU:</strong> The smallest PTU reservation you can purchase for each model.
                        </div>
                        <div>
                          <strong>Why minimums exist:</strong> Azure requires minimum commitments to ensure efficient resource allocation and cost-effective service delivery.
                        </div>
                        <div>
                          <strong>Planning tip:</strong> If your RecommendedPTU from KQL is below the minimum, you'll pay for the minimum but get extra capacity for bursts.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deployment">Deployment Type</Label>
                    <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deployment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">
                          <div className="flex flex-col">
                            <span>Global Deployment</span>
                            <span className="text-xs text-gray-500">Worldwide availability, load balancing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="data-zone">
                          <div className="flex flex-col">
                            <span>Data Zone Deployment</span>
                            <span className="text-xs text-gray-500">Data residency compliance</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="regional">
                          <div className="flex flex-col">
                            <span>Regional Deployment</span>
                            <span className="text-xs text-gray-500">Single region, lowest latency</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* PTU Type Explanation */}
                    <div className="bg-blue-50 p-3 rounded-lg mt-2">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        PTU Deployment Types Explained
                      </h4>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <strong>Global (PTU-G):</strong> Best for applications requiring global reach and high availability. 
                          Data processed worldwide with intelligent routing.
                        </div>
                        <div>
                          <strong>Data Zone (PTU-D):</strong> Ideal for compliance requirements. 
                          Data stays within EU or US boundaries for regulatory compliance.
                        </div>
                        <div>
                          <strong>Regional (PTU-R):</strong> Optimal for latency-sensitive applications. 
                          Processing occurs in a single region for fastest response times.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Pricing Display */}
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-lg mb-2 flex items-center gap-2">
                    {selectedModel.toUpperCase()} - Official Pricing Available
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Official
                    </Badge>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Deployment Type:</strong> {selectedDeployment === 'global' ? 'Global' : selectedDeployment === 'data-zone' ? 'Data Zone' : 'Regional'}</p>
                    <p><strong>PAYGO:</strong> ${currentPricing.paygo_input.toFixed(2)}/1M input tokens</p>
                    <p><strong>PTU:</strong> ${currentPricing.ptu_monthly.toFixed(2)}/hour per PTU</p>
                    <p><strong>Output tokens:</strong> ${currentPricing.paygo_output.toFixed(2)}/1M ({selectedDeployment === 'global' ? 'Global' : selectedDeployment === 'data-zone' ? 'Data Zone' : 'Regional'} deployment)</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Click "Load Official Pricing" to automatically populate the input fields below
                  </p>
                </div>

                <Button 
                  onClick={loadOfficialPricing} 
                  className="w-full mt-4"
                  disabled={pricingStatus.isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${pricingStatus.isLoading ? 'animate-spin' : ''}`} />
                  Load Official Pricing
                </Button>
              </div>

              {/* Custom Pricing Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="custom-pricing" 
                    checked={useCustomPricing}
                    onCheckedChange={setUseCustomPricing}
                  />
                  <Label htmlFor="custom-pricing" className="text-sm font-medium">
                    Use Custom Pricing (for negotiated rates with Microsoft)
                  </Label>
                </div>

                {useCustomPricing && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg border">
                    <div className="space-y-2">
                      <Label htmlFor="custom-paygo-input">Custom PAYGO Input Price ($/1M tokens)</Label>
                      <Input
                        id="custom-paygo-input"
                        type="number"
                        step="0.01"
                        placeholder="0.15"
                        value={customPaygoInput}
                        onChange={(e) => setCustomPaygoInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-paygo-output">Custom PAYGO Output Price ($/1M tokens)</Label>
                      <Input
                        id="custom-paygo-output"
                        type="number"
                        step="0.01"
                        placeholder="0.60"
                        value={customPaygoOutput}
                        onChange={(e) => setCustomPaygoOutput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-ptu">Custom PTU Price ($/hour per PTU)</Label>
                      <Input
                        id="custom-ptu"
                        type="number"
                        step="0.01"
                        placeholder="75.00"
                        value={customPtuPrice}
                        onChange={(e) => setCustomPtuPrice(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avg-tpm">Average TPM (from KQL)</Label>
                  <Input
                    id="avg-tpm"
                    type="number"
                    placeholder="5678"
                    value={formData.avgTPM}
                    onChange={(e) => setFormData(prev => ({ ...prev, avgTPM: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">AvgTPM from your KQL query results</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p99-tpm">P99 TPM (from KQL)</Label>
                  <Input
                    id="p99-tpm"
                    type="number"
                    placeholder="12000"
                    value={formData.p99TPM}
                    onChange={(e) => setFormData(prev => ({ ...prev, p99TPM: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">P99TPM - shows burst patterns</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-tpm">Max TPM (from KQL)</Label>
                  <Input
                    id="max-tpm"
                    type="number"
                    placeholder="25000"
                    value={formData.maxTPM}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTPM: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">MaxTPM - absolute peak usage</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avg-ptu">Average PTU (from KQL)</Label>
                  <Input
                    id="avg-ptu"
                    type="number"
                    placeholder="1"
                    value={formData.avgPTU}
                    onChange={(e) => setFormData(prev => ({ ...prev, avgPTU: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">AvgPTU - average PTU needs</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p99-ptu">P99 PTU (from KQL)</Label>
                  <Input
                    id="p99-ptu"
                    type="number"
                    placeholder="1"
                    value={formData.p99PTU}
                    onChange={(e) => setFormData(prev => ({ ...prev, p99PTU: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">P99PTU - PTU needs for bursts</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-ptu">Max PTU (from KQL)</Label>
                  <Input
                    id="max-ptu"
                    type="number"
                    placeholder="1"
                    value={formData.maxPTU}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPTU: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">MaxPTU - maximum PTU needs</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommended-ptu">Recommended PTU (from KQL)</Label>
                  <Input
                    id="recommended-ptu"
                    type="number"
                    placeholder="1"
                    value={formData.recommendedPTU}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendedPTU: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">RecommendedPTU - KQL's sizing recommendation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minutes">Monthly Active Minutes</Label>
                  <Input
                    id="minutes"
                    type="number"
                    placeholder="43800"
                    value={formData.monthlyMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyMinutes: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">Total minutes of usage per month</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base-ptus">Base PTUs (for Hybrid Model)</Label>
                  <Input
                    id="base-ptus"
                    type="number"
                    placeholder="1"
                    value={formData.basePTUs}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePTUs: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-600">Base PTU reservation for hybrid approach</p>
                  
                  {/* Hybrid Spillover Explanation */}
                  <div className="bg-green-50 p-3 rounded-lg mt-2">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-green-600" />
                      Hybrid Model with Spillover Explained
                    </h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>
                        <strong>How it works:</strong> Reserve base PTUs for your average usage, then pay PAYGO rates for traffic that exceeds your PTU capacity.
                      </div>
                      <div>
                        <strong>Best for:</strong> Workloads with predictable baseline usage but occasional bursts (burst ratio 2-5x).
                      </div>
                      <div>
                        <strong>Cost optimization:</strong> Set base PTUs to your AvgPTU or P99PTU from KQL, letting bursts "spillover" to PAYGO pricing.
                      </div>
                      <div>
                        <strong>Example:</strong> If you need 2 PTU average but 8 PTU for bursts, reserve 2-3 base PTUs and let the 5-6 PTU burst traffic use PAYGO.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KQL Results Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-medium text-lg mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Burst Pattern Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p><strong>Burst Ratio:</strong> {formData.p99TPM && formData.avgTPM ? (formData.p99TPM / formData.avgTPM).toFixed(1) : '0.0'}x</p>
                    <p className="text-xs text-gray-600">P99TPM ÷ AvgTPM</p>
                  </div>
                  <div>
                    <p><strong>Peak Ratio:</strong> {formData.maxTPM && formData.avgTPM ? (formData.maxTPM / formData.avgTPM).toFixed(1) : '0.0'}x</p>
                    <p className="text-xs text-gray-600">MaxTPM ÷ AvgTPM</p>
                  </div>
                  <div>
                    <p><strong>PTU Variance:</strong> {formData.p99PTU && formData.avgPTU ? Math.abs(formData.p99PTU - formData.avgPTU) : 0} PTU</p>
                    <p className="text-xs text-gray-600">P99PTU - AvgPTU</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Cost Analysis
            </CardTitle>
            <CardDescription>Monthly cost comparison across pricing models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Enhanced PTU Efficiency Analysis */}
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-orange-800">
                  <Info className="h-5 w-5" />
                  PTU Efficiency & Burst Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong className="text-orange-800">PTU Utilization:</strong> {calculations.utilization?.toFixed(1) || '0.0'}% 
                      <span className="text-gray-600"> ({formData.avgTPM.toLocaleString()} TPM out of {(calculations.ptuNeeded || 1) * 50000} TPM capacity)</span>
                    </p>
                    <p>
                      <strong className="text-orange-800">Recommended PTUs:</strong> {calculations.ptuNeeded || formData.recommendedPTU} PTU
                      <span className="text-gray-600"> (from KQL analysis)</span>
                    </p>
                    <p>
                      <strong className="text-orange-800">Cost Difference:</strong> PTU is {((calculations.ptuOnDemandCost || 0) / (calculations.paygoCost || 1)).toFixed(1)}x {(calculations.ptuOnDemandCost || 0) > (calculations.paygoCost || 0) ? 'more expensive' : 'cheaper'} than PAYGO
                    </p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong className="text-orange-800">Burst Pattern:</strong> {calculations.burstRatio?.toFixed(1) || '1.0'}x burst ratio
                      <span className="text-gray-600"> (P99/Avg TPM)</span>
                    </p>
                    <p>
                      <strong className="text-orange-800">Peak Spikes:</strong> {calculations.peakRatio?.toFixed(1) || '1.0'}x peak ratio
                      <span className="text-gray-600"> (Max/Avg TPM)</span>
                    </p>
                    <p>
                      <strong className="text-orange-800">Usage Pattern:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        calculations.steadyUsage ? 'bg-green-100 text-green-800' : 
                        calculations.isBursty ? 'bg-yellow-100 text-yellow-800' : 
                        calculations.hasSpikes ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {calculations.steadyUsage ? 'Steady' : 
                         calculations.isBursty ? 'Bursty' : 
                         calculations.hasSpikes ? 'Spiky' : 'Variable'}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Recommendation */}
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{recommendation.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-800 mb-2">{recommendation.type}</p>
                      <p className="text-sm text-gray-700 mb-2">{recommendation.reason}</p>
                      {recommendation.details && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{recommendation.details}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hybrid Model Details */}
                {calculations.overflowCost > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Hybrid Model Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p><strong>Base PTUs:</strong> {calculations.basePTUs}</p>
                        <p className="text-xs text-gray-600">Covers {(calculations.basePTUs * 50000).toLocaleString()} TPM</p>
                      </div>
                      <div>
                        <p><strong>Overflow TPM:</strong> {calculations.overflowTPM?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-600">Handled by PAYGO</p>
                      </div>
                      <div>
                        <p><strong>Overflow Cost:</strong> ${calculations.overflowCost?.toFixed(2) || '0.00'}/mo</p>
                        <p className="text-xs text-gray-600">Additional PAYGO charges</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reservation Savings Opportunity */}
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-5 w-5" />
                  Reservation Savings Opportunity
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <h4 className="font-medium text-gray-700 mb-2">1-Year Reservation</h4>
                    <p className="text-3xl font-bold text-green-600">${((calculations.ptuOnDemandCost || 0) - (calculations.ptu1YearCost || 0)).toFixed(2)}/mo</p>
                    <p className="text-sm text-green-600 font-medium">25.0% savings</p>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-medium text-gray-700 mb-2">3-Year Reservation</h4>
                    <p className="text-3xl font-bold text-green-600">${((calculations.ptuOnDemandCost || 0) - (calculations.ptu3YearCost || 0)).toFixed(2)}/mo</p>
                    <p className="text-sm text-green-600 font-medium">40.0% savings</p>
                  </div>
                </div>

                <div className="text-center bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">3-Year Total Savings</h4>
                  <p className="text-4xl font-bold text-green-600">${(((calculations.ptuOnDemandCost || 0) - (calculations.ptu3YearCost || 0)) * 36).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Over full term</p>
                </div>
              </div>

              {/* Pricing Comparison Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-lg">PAYGO</h4>
                    <p className="text-sm text-gray-600">No commitment required</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">Pay-as-you-go</Badge>
                    <p className="text-2xl font-bold text-blue-600">${calculations.paygoCost?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-lg">PTU (On-Demand)</h4>
                    <p className="text-sm text-gray-600">{calculations.ptuNeeded || 1} PTUs needed</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">Reserved</Badge>
                    <p className="text-2xl font-bold text-green-600">${calculations.ptuOnDemandCost?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-lg">PTU (1 Year)</h4>
                    <p className="text-sm text-gray-600">Save ${((calculations.ptuOnDemandCost || 0) - (calculations.ptu1YearCost || 0)).toFixed(2)}/mo</p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-2 bg-gray-600">25% off</Badge>
                    <p className="text-2xl font-bold text-green-600">${calculations.ptu1YearCost?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-200 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-lg">PTU (3 Year)</h4>
                    <p className="text-sm text-gray-600">Save ${((calculations.ptuOnDemandCost || 0) - (calculations.ptu3YearCost || 0)).toFixed(2)}/mo</p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-2 bg-gray-600">45% off</Badge>
                    <p className="text-2xl font-bold text-green-600">${calculations.ptu3YearCost?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Hybrid Options */}
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-purple-800">
                  <RefreshCw className="h-5 w-5" />
                  Hybrid Options <Badge variant="outline" className="ml-2">Base + Spillover</Badge>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-lg">Hybrid (On-Demand)</h4>
                    <p className="text-2xl font-bold text-orange-600">${calculations.hybridOnDemandCost?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-600">Base: ${calculations.hybridOnDemandCost?.toFixed(2) || '0.00'} + Spillover: $0.00</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-lg">Hybrid (1 Year)</h4>
                    <p className="text-2xl font-bold text-orange-600">${calculations.hybrid1YearCost?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-600">Base: ${calculations.hybrid1YearCost?.toFixed(2) || '0.00'} + Spillover: $0.00</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-lg">Hybrid (3 Year)</h4>
                    <p className="text-2xl font-bold text-orange-600">${calculations.hybrid3YearCost?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-600">Base: ${calculations.hybrid3YearCost?.toFixed(2) || '0.00'} + Spillover: $0.00</p>
                  </div>
                </div>
              </div>

              {/* Cost Visualization Chart */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-semibold text-lg mb-4">Cost Comparison Chart</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Monthly Cost']} />
                      <Legend />
                      <Bar dataKey="cost" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Metrics and Cost Efficiency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Usage Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Average TPM:</span>
                  <span className="text-sm">{formData.avgTPM.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">PTUs Needed:</span>
                  <span className="text-sm">{calculations.ptuNeeded || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Monthly Tokens:</span>
                  <span className="text-sm">{calculations.monthlyTokens?.toFixed(1) || '0.0'}M</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Cost Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Cost per 1M tokens:</span>
                  <span className="text-sm">${calculations.costPerMillion?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Utilization:</span>
                  <span className="text-sm">{calculations.utilization?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PTU Cost-Effectiveness Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              PTU Cost-Effectiveness Guidelines
            </CardTitle>
            <CardDescription>
              Understand when to use PAYGO, Hybrid, or full PTU reservations based on your usage patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-lg flex items-center gap-2">
                  ❌ Stay on PAYGO
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>TPM Range:</strong> &lt;10,000 TPM</p>
                  <p><strong>PTU Utilization:</strong> &lt;20% capacity</p>
                  <p><strong>Why PAYGO:</strong> Only pay for actual usage</p>
                  <p><strong>Cost Impact:</strong> Avoid paying for unused capacity</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-lg flex items-center gap-2">
                  ⚠️ Consider Hybrid Model
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>TPM Range:</strong> 10,000-30,000 TPM</p>
                  <p><strong>Strategy:</strong> Base PTUs + PAYGO overflow</p>
                  <p><strong>Best For:</strong> Variable workloads with peaks</p>
                  <p><strong>Benefits:</strong> Cost control + scalability</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-lg flex items-center gap-2">
                  ✅ Full PTU Reservation
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>TPM Range:</strong> &gt;30,000 TPM sustained</p>
                  <p><strong>PTU Utilization:</strong> &gt;60% capacity</p>
                  <p><strong>Potential Savings:</strong> 15-40% vs PAYGO</p>
                  <p><strong>Best For:</strong> Predictable, high-volume usage</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h4 className="font-medium text-lg flex items-center gap-2">
                📊 Key Decision Factors
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>Usage Consistency:</strong> PTUs work best for predictable, sustained workloads</p>
                  <p>• <strong>Capacity Planning:</strong> Each PTU = 50,000 tokens/minute guaranteed throughput</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>Break-Even Point:</strong> PTUs typically become cost-effective at 60%+ utilization</p>
                  <p>• <strong>Growth Projections:</strong> Consider future usage patterns, not just current needs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-pink-600" />
              Recommendation
            </CardTitle>
            <CardDescription>Optimized pricing strategy for your usage pattern</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended: {recommendation.type}</strong><br />
                {recommendation.reason}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-lg flex items-center gap-2">
                  ✅ Next Steps
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Continue with your current PAYGO setup</li>
                  <li>Monitor usage patterns for future optimization</li>
                  <li>Consider PTU if usage grows consistently</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-lg flex items-center gap-2">
                  ⚠️ Considerations
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• No commitment but higher per-token costs</li>
                  <li>• Best for variable or experimental workloads</li>
                  <li>• Monitor for usage pattern changes</li>
                </ul>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-lg flex items-center gap-2 mb-4">
                📊 Analysis Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Current TPM</p>
                  <p className="text-lg">{formData.avgTPM.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Recommended Cost</p>
                  <p className="text-lg">${calculations.ptu3YearCost?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="font-medium">PTU Utilization</p>
                  <p className="text-lg">{calculations.utilization?.toFixed(1) || '0.0'}%</p>
                </div>
                <div>
                  <p className="font-medium">Monthly Savings</p>
                  <p className="text-lg">$0.00</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Concepts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Key Concepts
            </CardTitle>
            <CardDescription>Essential information for understanding Azure OpenAI pricing and deployment options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">PTU Conversion Rate (50,000)</h4>
                  <p className="text-gray-600">Microsoft's official standard - each PTU provides exactly 50,000 tokens/minute of sustained throughput capacity according to Azure OpenAI documentation.</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Base PTUs for Hybrid Model</h4>
                  <p className="text-gray-600">Reserve a fixed number of PTUs (e.g., 2 PTUs = 100k tokens/min guaranteed) for your baseline usage, with automatic PAYGO billing when demand exceeds reserved capacity.</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Hybrid Strategy Benefits</h4>
                  <p className="text-gray-600">Combines predictable costs (PTU reservation) with elastic scalability (PAYGO overflow) - optimal for workloads with variable demand patterns.</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Deployment Type Pricing</h4>
                  <p className="text-gray-600">Global deployments typically cost 20-40% more than Regional deployments, with Data Zone deployments priced between the two.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">PTU vs PAYGO</h4>
                  <p className="text-gray-600">PTU pricing offers 20-40% savings for sustained high-volume usage but requires monthly commitment, while PAYGO provides flexibility without commitment.</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Monthly Minutes</h4>
                  <p className="text-gray-600">Default 43,800 minutes assumes continuous 24/7 usage (30.4 days × 24 hours × 60 minutes).</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Dynamic Pricing Updates</h4>
                  <p className="text-gray-600">The app uses AI analysis of official Azure OpenAI documentation to ensure current pricing accuracy and model availability.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Reservation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Critical Reservation Details
            </CardTitle>
            <CardDescription>Important considerations before committing to PTU reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    📍 Geographic Constraints
                  </h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Reservations are region-locked (cannot transfer)</li>
                    <li>• Must commit to specific Azure region</li>
                    <li>• Plan for geographic redundancy separately</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    🔄 Flexibility & Changes
                  </h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Use reserved PTUs with any supported model</li>
                    <li>• Purchase additional on-demand PTUs as needed</li>
                    <li>• Limited exchanges possible under specific conditions</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    💳 Payment & Commitment
                  </h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• 30-day cancellation window after purchase</li>
                    <li>• Choose: upfront payment (max savings) or monthly</li>
                    <li>• Full commitment for selected term (1 or 3 years)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    📈 Capacity & Scaling
                  </h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Guaranteed capacity in selected region</li>
                    <li>• Protection against demand spikes</li>
                    <li>• Scale up with additional reservations</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App

