import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { RefreshCw, TrendingUp, Info, CheckCircle, AlertCircle, Brain, Globe, MapPin, DollarSign, Copy, Download, BarChart3, Target, Lightbulb, Shield, Clock, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ptuModels from './ptu_supported_models.json';
import correctedPricingService from './corrected_pricing_service.js';
import InteractiveCharts from './components/InteractiveCharts';
import MobileOptimizations, { useMobileDetection } from './components/MobileOptimizations';
import './App.css';

function App() {
  // Enhanced features state
  const [showInteractiveCharts, setShowInteractiveCharts] = useState(true);
  const deviceInfo = useMobileDetection();
  
  // State management
  const [selectedRegion, setSelectedRegion] = useState('east-us-2');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [selectedDeployment, setSelectedDeployment] = useState('global');
  const [useCustomPricing, setUseCustomPricing] = useState(false);
  
  // KQL form data - ALL VALUES SET TO 0 EXCEPT MONTHLY MINUTES
  const [formData, setFormData] = useState({
    avgTPM: 0,
    p99TPM: 0,
    maxTPM: 0,
    avgPTU: 0,
    p99PTU: 0,
    maxPTU: 0,
    recommendedPTU: 0,
    monthlyMinutes: 43800,
    basePTUs: 0
  });
  
  // Custom pricing data
  const [customPricing, setCustomPricing] = useState({
    paygo_input: 0.15,
    paygo_output: 0.60,
    ptu_hourly: 1.00,
    ptu_monthly: 260,
    ptu_yearly: 2652
  });
  
  // Pricing state
  const [currentPricing, setCurrentPricing] = useState({
    paygo_input: 0.15,
    paygo_output: 0.60,
    ptu_hourly: 1.00,
    ptu_monthly: 260,
    ptu_yearly: 2652,
    minPTU: 15,
    tokensPerPTUPerMinute: 50000
  });
  
  const [calculations, setCalculations] = useState({});
  const [pricingStatus, setPricingStatus] = useState({
    lastRefreshed: new Date().toLocaleString(),
    isLoading: false,
    usingLiveData: false,
    dataExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000).toLocaleString() // 3 hours from now
  });

  // Check if user has entered valid data
  const hasValidData = formData.avgTPM > 0 || formData.recommendedPTU > 0 || formData.p99TPM > 0;

  // Get current pricing from service
  const getCurrentPricing = () => {
    if (useCustomPricing) {
      return {
        paygo_input: customPricing.paygo_input,
        paygo_output: customPricing.paygo_output,
        ptu_hourly: customPricing.ptu_hourly,
        ptu_monthly: customPricing.ptu_monthly,
        ptu_yearly: customPricing.ptu_yearly,
        minPTU: 15,
        tokensPerPTUPerMinute: 50000
      };
    }
    
    try {
      const pricing = correctedPricingService.getModelPricing(selectedModel, selectedDeployment);
      return {
        paygo_input: pricing.paygo.input,
        paygo_output: pricing.paygo.output,
        ptu_hourly: pricing.ptu.hourly,
        ptu_monthly: pricing.ptu.monthly,
        ptu_yearly: pricing.ptu.yearly,
        minPTU: pricing.minPTU,
        tokensPerPTUPerMinute: pricing.tokensPerPTUPerMinute
      };
    } catch (error) {
      console.error('Error getting pricing:', error);
      return {
        paygo_input: 0.15,
        paygo_output: 0.60,
        ptu_hourly: 1.00,
        ptu_monthly: 260,
        ptu_yearly: 2652,
        minPTU: 15,
        tokensPerPTUPerMinute: 50000
      };
    }
  };

  // Update pricing when selections change
  useEffect(() => {
    const pricing = getCurrentPricing();
    setCurrentPricing(pricing);
  }, [selectedModel, selectedDeployment, useCustomPricing, customPricing]);

  // Calculate costs and recommendations
  useEffect(() => {
    // Only calculate if user has entered valid data
    if (!hasValidData) {
      setCalculations({});
      return;
    }

    // Burst pattern analysis
    const burstRatio = formData.p99TPM && formData.avgTPM ? formData.p99TPM / formData.avgTPM : 1;
    const peakRatio = formData.maxTPM && formData.avgTPM ? formData.maxTPM / formData.avgTPM : 1;
    const ptuVariance = formData.p99PTU && formData.avgPTU ? Math.abs(formData.p99PTU - formData.avgPTU) : 0;
    
    // FIXED PTU CALCULATION LOGIC
    // Calculate actual PTUs needed based on usage
    const calculatedPTU = formData.recommendedPTU || Math.ceil(formData.avgTPM / currentPricing.tokensPerPTUPerMinute);
    
    // Determine if we need to use minimum
    const ptuNeeded = Math.max(calculatedPTU, currentPricing.minPTU);
    const isUsingMinimum = calculatedPTU < currentPricing.minPTU;
    
    // Monthly calculations
    const monthlyTokens = (formData.avgTPM * formData.monthlyMinutes) / 1000000;
    const monthlyPaygoCost = (monthlyTokens * 0.5 * currentPricing.paygo_input) + (monthlyTokens * 0.5 * currentPricing.paygo_output);
    const monthlyPtuCost = ptuNeeded * currentPricing.ptu_hourly * 24 * 30;
    const monthlyPtuHourlyCost = monthlyPtuCost; // For InteractiveCharts
    const monthlyPtuReservationCost = ptuNeeded * currentPricing.ptu_monthly;
    const yearlyPtuReservationCost = ptuNeeded * currentPricing.ptu_yearly;
    
    // Utilization calculation - use actual TPM vs actual PTU capacity
    const utilizationRate = formData.avgTPM / (ptuNeeded * currentPricing.tokensPerPTUPerMinute);
    
    // Cost per 1M tokens
    const costPer1MTokens = monthlyTokens > 0 ? monthlyPaygoCost / monthlyTokens : 0;
    
    // PTU cost effectiveness
    const ptuCostEffectiveness = monthlyPaygoCost > 0 ? monthlyPtuCost / monthlyPaygoCost : 0;
    
    // Reservation savings
    const oneYearSavings = (monthlyPtuCost - monthlyPtuReservationCost) * 12;
    const threeYearSavings = (monthlyPtuCost - (yearlyPtuReservationCost / 12)) * 36;
    const oneYearSavingsPercent = monthlyPtuCost > 0 ? ((monthlyPtuCost - monthlyPtuReservationCost) / monthlyPtuCost) * 100 : 0;
    const threeYearSavingsPercent = monthlyPtuCost > 0 ? ((monthlyPtuCost - (yearlyPtuReservationCost / 12)) / monthlyPtuCost) * 100 : 0;
    
    // Recommendations
    let recommendation = 'PAYGO';
    let recommendationReason = 'Very low utilization. PTU reservations would be cost-ineffective. Stick with PAYGO for maximum flexibility.';
    let recommendationIcon = '❌';
    
    if (utilizationRate > 0.6 && burstRatio < 1.5) {
      recommendation = 'Full PTU Reservation';
      recommendationReason = 'High utilization with steady usage pattern. PTU reservations offer significant savings.';
      recommendationIcon = '✅';
    } else if (utilizationRate > 0.2 && burstRatio < 3.0) {
      recommendation = 'Consider Hybrid Model';
      recommendationReason = 'Moderate utilization with some burst patterns. Hybrid approach balances cost and flexibility.';
      recommendationIcon = '⚠️';
    }
    
    // Pattern classification
    let usagePattern = 'Steady';
    if (burstRatio > 2.0) usagePattern = 'Bursty';
    if (peakRatio > 3.0) usagePattern = 'Spiky';
    
    // Hybrid model calculations
    const hybridBasePTU = Math.ceil(formData.avgPTU || 1);
    const hybridOverflowTPM = Math.max(0, formData.p99TPM - (hybridBasePTU * currentPricing.tokensPerPTUPerMinute));
    const hybridOverflowTokensMonthly = (hybridOverflowTPM * formData.monthlyMinutes) / 1000000;
    const hybridOverflowCost = (hybridOverflowTokensMonthly * 0.5 * currentPricing.paygo_input) + (hybridOverflowTokensMonthly * 0.5 * currentPricing.paygo_output);
    const hybridBaseCost = hybridBasePTU * currentPricing.ptu_monthly;
    const hybridTotalCost = hybridBaseCost + hybridOverflowCost;
    
    // Chart data
    const chartData = [
      { name: 'PAYGO', cost: monthlyPaygoCost },
      { name: 'PTU (On-Demand)', cost: monthlyPtuCost },
      { name: 'PTU (1 Year)', cost: monthlyPtuReservationCost },
      { name: 'PTU (3 Year)', cost: yearlyPtuReservationCost / 12 },
      { name: 'Hybrid', cost: hybridTotalCost },
      { name: 'Hybrid (1Y)', cost: hybridBaseCost * 0.75 + hybridOverflowCost },
      { name: 'Hybrid (3Y)', cost: hybridBaseCost * 0.6 + hybridOverflowCost }
    ];
    
    setCalculations({
      burstRatio,
      peakRatio,
      ptuVariance,
      calculatedPTU,
      ptuNeeded,
      isUsingMinimum,
      monthlyTokens,
      monthlyPaygoCost,
      monthlyPtuCost,
      monthlyPtuHourlyCost,
      monthlyPtuReservationCost,
      yearlyPtuReservationCost,
      utilizationRate,
      costPer1MTokens,
      ptuCostEffectiveness,
      oneYearSavings,
      threeYearSavings,
      oneYearSavingsPercent,
      threeYearSavingsPercent,
      recommendation,
      recommendationReason,
      recommendationIcon,
      usagePattern,
      hybridBasePTU,
      hybridOverflowCost,
      hybridBaseCost,
      hybridTotalCost,
      chartData
    });
  }, [formData, currentPricing, hasValidData]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Handle custom pricing changes
  const handleCustomPricingChange = (field, value) => {
    setCustomPricing(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Load official pricing
  const loadOfficialPricing = () => {
    setPricingStatus(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    setTimeout(() => {
      const pricing = getCurrentPricing();
      setCustomPricing({
        paygo_input: pricing.paygo_input,
        paygo_output: pricing.paygo_output,
        ptu_hourly: pricing.ptu_hourly,
        ptu_monthly: pricing.ptu_monthly,
        ptu_yearly: pricing.ptu_yearly
      });
      
      setPricingStatus(prev => ({
        ...prev,
        isLoading: false,
        usingLiveData: true,
        lastRefreshed: new Date().toLocaleString()
      }));
    }, 1500);
  };

  // Get available models
  const getAvailableModels = () => {
    return Object.entries(ptuModels.ptu_supported_models).map(([id, model]) => ({
      id,
      name: model.name,
      minPTU: model.min_ptu
    }));
  };

  // Get available regions
  const getAvailableRegions = () => {
    const selectedModelData = ptuModels.ptu_supported_models[selectedModel];
    if (!selectedModelData) return [];
    
    return selectedModelData.regions.map(region => ({
      id: region,
      name: region.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      modelCount: Object.keys(ptuModels.ptu_supported_models).length
    }));
  };

  // KQL Query code
  const kqlQuery = `// Burst-Aware Azure OpenAI PTU Sizing Analysis
// Run this query in Azure Monitor Log Analytics for accurate capacity planning

let window = 1m;              // granularity for burst detection
let p = 0.99;                 // percentile for burst sizing
AzureMetrics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| where MetricName in ("ProcessedPromptTokens", "ProcessedCompletionTokens")
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
| extend RecommendedPTU = max_of(AvgPTU, P99PTU)  // higher value covers bursts
| project AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU`;

  // Copy KQL query to clipboard
  const copyKQLQuery = () => {
    navigator.clipboard.writeText(kqlQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-3xl font-bold text-blue-600">
                Azure OpenAI PTU Estimator
              </CardTitle>
            </div>
            <CardDescription className="text-lg">
              Optimize your Azure OpenAI costs by analyzing real usage patterns and comparing PAYGO, PTU, and hybrid pricing models
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Pricing Data Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <CardTitle>Pricing Data Status</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                disabled={pricingStatus.isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${pricingStatus.isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
            <CardDescription>Azure OpenAI pricing and model availability information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Current pricing data loaded (expires in 3 hours)</span>
              </div>
              <div className="text-sm text-gray-600">
                Last refreshed: {pricingStatus.lastRefreshed}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Data Sources:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Azure OpenAI Service official pricing documentation</li>
                  <li>Official Azure pricing pages and calculators</li>
                  <li>Microsoft Learn documentation for PTU rates</li>
                  <li>Azure service deployment and availability data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: KQL Query */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle>Step 1: Get Your Token Data</CardTitle>
            </div>
            <CardDescription>
              Run this KQL query in your Azure Log Analytics workspace to calculate your average tokens per minute (TPM)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700"
                onClick={copyKQLQuery}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <pre className="text-sm overflow-x-auto pr-20">
                <code>{kqlQuery}</code>
              </pre>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                How to use this query:
              </h4>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">1</span>
                  <div>
                    <p className="font-medium text-gray-800">Navigate to your Azure Log Analytics workspace</p>
                    <p className="text-sm text-gray-600 mt-1">Access your workspace through the Azure portal</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">2</span>
                  <div>
                    <p className="font-medium text-gray-800">Paste and run the query above</p>
                    <p className="text-sm text-gray-600 mt-1">Copy the KQL query and execute it in your workspace</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">3</span>
                  <div>
                    <p className="font-medium text-gray-800">Review the query results</p>
                    <p className="text-sm text-gray-600 mt-1">The query will show results with AvgTPM, P99TPM, MaxTPM, and RecommendedPTU</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">4</span>
                  <div>
                    <p className="font-medium text-gray-800">Enter the RecommendedPTU value</p>
                    <p className="text-sm text-gray-600 mt-1">Note the "RecommendedPTU" value for your resource and enter it in the calculator below</p>
                  </div>
                </li>
              </ol>
            </div>

            <Alert className="mt-6 border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-800 mb-3">Query Features & Benefits</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-700 mb-1">Fine-grained binning</h5>
                        <p className="text-sm text-blue-600">Aggregates token counts per minute to expose bursts and usage patterns.</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-700 mb-1">Peak statistics</h5>
                        <p className="text-sm text-blue-600">Captures max / P99 tokens-per-minute (TPM) to size for bursts effectively.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-700 mb-1">Dual PTU estimate</h5>
                        <p className="text-sm text-blue-600">Computes PTUs from both average and peak, provisioning to the higher value.</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-700 mb-1">RecommendedPTU</h5>
                        <p className="text-sm text-blue-600">The optimal value to cover bursts without large over-allocation.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Alternative: No Log Analytics Section */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Alternative: Don't Have Log Analytics?</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              You can still use this calculator! Here's how to estimate your usage without KQL data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-amber-300 bg-amber-100">
                <AlertDescription className="text-amber-800">
                  <strong>Minimum Information Needed:</strong> Just your estimated monthly token usage or API call volume.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">📊 Estimation Methods:</h4>
                  <ul className="space-y-2 text-sm text-amber-700">
                    <li><strong>• API Bills:</strong> Check your current Azure OpenAI monthly costs</li>
                    <li><strong>• Usage Logs:</strong> Review your application's API call frequency</li>
                    <li><strong>• Business Metrics:</strong> Estimate based on users, requests, or documents processed</li>
                    <li><strong>• Conservative Estimate:</strong> Start with lower numbers and adjust upward</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">🎯 Quick Estimation Guide:</h4>
                  <div className="space-y-2 text-sm text-amber-700">
                    <div><strong>Light Usage:</strong> 1,000-10,000 TPM (small apps, prototypes)</div>
                    <div><strong>Medium Usage:</strong> 10,000-50,000 TPM (production apps, moderate scale)</div>
                    <div><strong>Heavy Usage:</strong> 50,000+ TPM (enterprise, high-volume applications)</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">💡 How to Proceed:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
                  <li>Estimate your <strong>average tokens per minute</strong> based on your usage patterns</li>
                  <li>For burst estimation, multiply by 2-5x (depending on your traffic spikes)</li>
                  <li>Enter these values in the "Average TPM" and "P99 TPM" fields below</li>
                  <li>Set "Recommended PTU" to the higher of the two calculated PTU values</li>
                  <li>Adjust "Monthly Active Minutes" based on your actual usage hours</li>
                </ol>
              </div>

              <Alert className="border-blue-300 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Pro Tip:</strong> Start conservative with your estimates. You can always scale up PTU reservations later, but it's harder to scale down.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <CardTitle>Step 2: Configure Your Deployment</CardTitle>
            </div>
            <CardDescription>
              Select your Azure region, OpenAI model, and deployment type for accurate pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Deployment Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className={`cursor-pointer border-2 ${selectedDeployment === 'global' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setSelectedDeployment('global')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Global Deployment</h3>
                  </div>
                  <p className="text-sm text-gray-600">Multi-region deployment with automatic failover and load balancing.</p>
                  <p className="text-sm text-gray-600 mt-1">Best for high availability and global reach.</p>
                  <p className="text-sm text-gray-600 mt-1">Traffic is routed to the best available region automatically.</p>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer border-2 ${selectedDeployment === 'dataZone' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`} onClick={() => setSelectedDeployment('dataZone')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">Data Zone Deployment</h3>
                  </div>
                  <p className="text-sm text-gray-600">Geographic-based deployment (EU or US) for data residency.</p>
                  <p className="text-sm text-gray-600 mt-1">Ideal for compliance requirements.</p>
                  <p className="text-sm text-gray-600 mt-1">Data stays within EU or US boundaries for regulatory compliance.</p>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer border-2 ${selectedDeployment === 'regional' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`} onClick={() => setSelectedDeployment('regional')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    <h3 className="font-medium">Regional Deployment</h3>
                  </div>
                  <p className="text-sm text-gray-600">Local region deployment (up to 27 regions) for lowest latency.</p>
                  <p className="text-sm text-gray-600 mt-1">Optimal for latency-sensitive applications.</p>
                  <p className="text-sm text-gray-600 mt-1">Processing occurs in a single region for fastest response times.</p>
                </CardContent>
              </Card>
            </div>

            {/* Official PTU Pricing Section */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Official PTU Pricing Loaded</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor="region">Azure Region</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRegions().map(region => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name} ({region.modelCount} PTU models)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="model">OpenAI Model (PTU Supported Only)</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableModels().map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-1">
                      Only models that support Provisioned Throughput Units (PTU) are shown. Models like DALL-E and TTS do not support PTU reservations.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deployment">Deployment Type</Label>
                    <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deployment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Global Deployment
                          </div>
                        </SelectItem>
                        <SelectItem value="dataZone">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Data Zone Deployment
                          </div>
                        </SelectItem>
                        <SelectItem value="regional">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Regional Deployment
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Current Model Pricing Display */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-green-800">
                        {ptuModels.ptu_supported_models[selectedModel]?.name.toUpperCase()} - Official Pricing Available
                      </h3>
                      <Badge variant="default" className="bg-green-600">Official</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Deployment Type:</strong> {selectedDeployment === 'dataZone' ? 'Data Zone' : selectedDeployment === 'regional' ? 'Regional' : 'Global'}
                      </div>
                      <div>
                        <strong>PAYGO:</strong> ${currentPricing.paygo_input}/1M input tokens
                      </div>
                      <div>
                        <strong>PTU:</strong> ${currentPricing.ptu_hourly}/hour per PTU
                      </div>
                      <div>
                        <strong>Output tokens:</strong> ${currentPricing.paygo_output}/1M ({selectedDeployment === 'dataZone' ? 'Data Zone' : selectedDeployment === 'regional' ? 'Regional' : 'Global'} deployment)
                      </div>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Click "Load Official Pricing" to automatically populate the input fields below
                    </p>
                  </CardContent>
                </Card>

                <div className="flex gap-4 mt-4">
                  <Button 
                    onClick={loadOfficialPricing}
                    disabled={pricingStatus.isLoading}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    {pricingStatus.isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Load Official Pricing
                  </Button>
                </div>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Minimum PTU Requirements:</strong> Minimum purchase per model. Azure uses minimums to ensure efficient capacity allocation and cost-effective service delivery. If your RecommendedPTU from KQL is below the minimum, you'll still pay the minimum but benefit from extra burst headroom.
                  </AlertDescription>
                </Alert>

                {/* Custom Pricing Toggle */}
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="customPricing"
                    checked={useCustomPricing}
                    onChange={(e) => setUseCustomPricing(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="customPricing" className="text-red-600">
                    Use Custom Pricing (for negotiated rates with Microsoft)
                  </Label>
                </div>

                {/* Custom Pricing Inputs */}
                {useCustomPricing && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <Label className="text-sm">PAYGO Input ($/1M)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customPricing.paygo_input}
                        onChange={(e) => handleCustomPricingChange('paygo_input', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">PAYGO Output ($/1M)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customPricing.paygo_output}
                        onChange={(e) => handleCustomPricingChange('paygo_output', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">PTU Hourly ($/hour)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customPricing.ptu_hourly}
                        onChange={(e) => handleCustomPricingChange('ptu_hourly', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">PTU Monthly ($/month)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={customPricing.ptu_monthly}
                        onChange={(e) => handleCustomPricingChange('ptu_monthly', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">PTU Yearly ($/year)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={customPricing.ptu_yearly}
                        onChange={(e) => handleCustomPricingChange('ptu_yearly', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KQL Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="avgTPM">Average TPM (from KQL)</Label>
                <Input
                  id="avgTPM"
                  type="number"
                  value={formData.avgTPM}
                  onChange={(e) => handleInputChange('avgTPM', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">AvgTPM from your KQL query results</p>
              </div>
              <div>
                <Label htmlFor="p99TPM">P99 TPM (from KQL)</Label>
                <Input
                  id="p99TPM"
                  type="number"
                  value={formData.p99TPM}
                  onChange={(e) => handleInputChange('p99TPM', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">P99TPM - shows burst patterns</p>
              </div>
              <div>
                <Label htmlFor="maxTPM">Max TPM (from KQL)</Label>
                <Input
                  id="maxTPM"
                  type="number"
                  value={formData.maxTPM}
                  onChange={(e) => handleInputChange('maxTPM', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">MaxTPM - absolute peak usage</p>
              </div>
              <div>
                <Label htmlFor="avgPTU">Average PTU (from KQL)</Label>
                <Input
                  id="avgPTU"
                  type="number"
                  value={formData.avgPTU}
                  onChange={(e) => handleInputChange('avgPTU', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">AvgPTU - average PTU needs</p>
              </div>
              <div>
                <Label htmlFor="p99PTU">P99 PTU (from KQL)</Label>
                <Input
                  id="p99PTU"
                  type="number"
                  value={formData.p99PTU}
                  onChange={(e) => handleInputChange('p99PTU', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">P99PTU - PTU needs for bursts</p>
              </div>
              <div>
                <Label htmlFor="maxPTU">Max PTU (from KQL)</Label>
                <Input
                  id="maxPTU"
                  type="number"
                  value={formData.maxPTU}
                  onChange={(e) => handleInputChange('maxPTU', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">MaxPTU - maximum PTU needs</p>
              </div>
              <div>
                <Label htmlFor="recommendedPTU">Recommended PTU (from KQL)</Label>
                <Input
                  id="recommendedPTU"
                  type="number"
                  value={formData.recommendedPTU}
                  onChange={(e) => handleInputChange('recommendedPTU', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">RecommendedPTU - KQL's sizing recommendation</p>
              </div>
              <div>
                <Label htmlFor="monthlyMinutes">Monthly Active Minutes</Label>
                <Input
                  id="monthlyMinutes"
                  type="number"
                  value={formData.monthlyMinutes}
                  onChange={(e) => handleInputChange('monthlyMinutes', e.target.value)}
                  placeholder="43800"
                />
                <p className="text-sm text-gray-600 mt-1">Total minutes of usage per month</p>
              </div>
              <div>
                <Label htmlFor="basePTUs">Base PTUs (for Hybrid Model)</Label>
                <Input
                  id="basePTUs"
                  type="number"
                  value={formData.basePTUs}
                  onChange={(e) => handleInputChange('basePTUs', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">Base PTU reservation for hybrid approach</p>
              </div>
            </div>

            <Alert className="mt-6 border-green-200 bg-green-50">
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                      Pro Tip: Hybrid Model Strategy
                    </h4>
                    <p className="text-green-700 mb-3">
                      <strong>Hybrid Model (Base + Spillover):</strong> Reserve base PTUs for average usage, let burst traffic "spill over" to PAYGO. 
                      Best for predictable baselines with occasional bursts (≈2–5×).
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-green-800 mb-2">📊 Implementation Guide:</h5>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Set base to your AvgPTU or P99PTU from KQL</li>
                      <li>• Overflow traffic is automatically billed at PAYGO rates</li>
                      <li>• Ideal for workloads with predictable baseline + occasional spikes</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2">🎯 Example Scenario:</h5>
                    <p className="text-sm text-blue-700">
                      <strong>Need:</strong> 2 PTU average, 8 PTU peaks<br/>
                      <strong>Strategy:</strong> Reserve 2–3 PTUs, let extra 5–6 PTUs use PAYGO<br/>
                      <strong>Benefit:</strong> Cost control + automatic scaling
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Results Section - Only show if user has entered valid data */}
        {!hasValidData ? (
          <Card className="border-gray-300 bg-gradient-to-r from-gray-50 to-blue-50">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">📊 Ready for Analysis</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Enter your KQL query results above to see:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Cost comparisons (PAYGO vs PTU)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Reservation savings opportunities
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Usage pattern analysis
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Personalized recommendations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Burst Pattern Analysis */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <CardTitle>Burst Pattern Analysis</CardTitle>
                </div>
                <CardDescription>Understanding your usage patterns for optimal PTU sizing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium text-blue-800">Usage Pattern</h3>
                      <div className="text-2xl font-bold text-blue-600 mt-2">{calculations.usagePattern}</div>
                      <p className="text-sm text-blue-600 mt-1">
                        {calculations.usagePattern === 'Steady' && 'Consistent usage with minimal spikes'}
                        {calculations.usagePattern === 'Bursty' && 'Moderate spikes in usage patterns'}
                        {calculations.usagePattern === 'Spiky' && 'High variability with significant peaks'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium text-green-800">Burst Ratio</h3>
                      <div className="text-2xl font-bold text-green-600 mt-2">{calculations.burstRatio?.toFixed(1)}x</div>
                      <p className="text-sm text-green-600 mt-1">P99 vs Average TPM</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium text-purple-800">Peak Ratio</h3>
                      <div className="text-2xl font-bold text-purple-600 mt-2">{calculations.peakRatio?.toFixed(1)}x</div>
                      <p className="text-sm text-purple-600 mt-1">Max vs Average TPM</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Reservation Savings Opportunity */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Reservation Savings Opportunity</CardTitle>
                </div>
                <CardDescription className="text-green-700">Potential savings with PTU reservations vs on-demand pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-green-100 border-green-300">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-green-800">1-Year Reservation</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">25% off</Badge>
                      </div>
                      <p className="text-xs text-green-600 mb-2">Save ${calculations.oneYearSavings > 0 ? (calculations.monthlyPtuCost - calculations.monthlyPtuReservationCost).toFixed(2) : '0.00'}/mo</p>
                      <div className="text-right">
                        <span className="text-xs text-green-600">{calculations.oneYearSavingsPercent?.toFixed(1)}% savings</span>
                        <div className="text-2xl font-bold text-green-600">${calculations.monthlyPtuReservationCost?.toFixed(2)}/mo</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-100 border-green-300">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-green-800">3-Year Reservation</h3>
                        <Badge variant="secondary" className="bg-green-200 text-green-900">45% off</Badge>
                      </div>
                      <p className="text-xs text-green-700 mb-2">Save ${calculations.threeYearSavings > 0 ? (calculations.monthlyPtuCost - (calculations.yearlyPtuReservationCost / 12)).toFixed(2) : '0.00'}/mo</p>
                      <div className="text-right">
                        <span className="text-xs text-green-700">{calculations.threeYearSavingsPercent?.toFixed(1)}% savings</span>
                        <div className="text-2xl font-bold text-green-800">${(calculations.yearlyPtuReservationCost / 12)?.toFixed(2)}/mo</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4 bg-gradient-to-r from-green-100 to-blue-100 border-green-300">
                  <CardContent className="p-4 text-center">
                    <h3 className="font-medium text-green-800 mb-2">3-Year Total Savings</h3>
                    <div className="text-3xl font-bold text-green-600">${calculations.threeYearSavings?.toFixed(2)}</div>
                    <p className="text-sm text-green-700 mt-1">Over full term</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Cost Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4 text-center">
                  <h3 className="font-medium text-gray-800">PAYGO</h3>
                  <p className="text-xs text-gray-600 mb-2">No commitment required</p>
                  <div className="text-right">
                    <span className="text-xs text-gray-600">Pay-as-you-go</span>
                    <div className="text-2xl font-bold text-gray-600">${calculations.monthlyPaygoCost?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <h3 className="font-medium text-blue-800">PTU (On-Demand)</h3>
                  <p className="text-xs text-blue-600 mb-2">
                    {calculations.ptuNeeded} PTUs needed
                    {calculations.isUsingMinimum && (
                      <span className="block text-xs text-orange-600 mt-1">
                        (Minimum: {currentPricing.minPTU} PTUs)
                      </span>
                    )}
                  </p>
                  <div className="text-right">
                    <span className="text-xs text-blue-600">Reserved</span>
                    <div className="text-2xl font-bold text-blue-600">${calculations.monthlyPtuCost?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-100 border-green-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-green-800">PTU (1 Year)</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">25% off</Badge>
                  </div>
                  <p className="text-xs text-green-600 mb-2">Save ${calculations.oneYearSavings > 0 ? (calculations.monthlyPtuCost - calculations.monthlyPtuReservationCost).toFixed(2) : '0.00'}/mo</p>
                  <div className="text-right">
                    <span className="text-xs text-green-600">25% off</span>
                    <div className="text-2xl font-bold text-green-600">${calculations.monthlyPtuReservationCost?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-100 border-green-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-green-800">PTU (3 Year)</h3>
                    <Badge variant="secondary" className="bg-green-200 text-green-900">45% off</Badge>
                  </div>
                  <p className="text-xs text-green-700 mb-2">Save ${calculations.threeYearSavings > 0 ? (calculations.monthlyPtuCost - (calculations.yearlyPtuReservationCost / 12)).toFixed(2) : '0.00'}/mo</p>
                  <div className="text-right">
                    <span className="text-xs text-green-700">45% off</span>
                    <div className="text-2xl font-bold text-green-800">${(calculations.yearlyPtuReservationCost / 12)?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PTU Requirements Explanation */}
            {calculations.isUsingMinimum && (
              <Alert className="border-orange-200 bg-orange-50">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Using Minimum PTU Requirement:</strong> Your calculated need is {calculations.calculatedPTU} PTU(s), but Azure requires a minimum of {currentPricing.minPTU} PTUs for this model. You'll pay for {calculations.ptuNeeded} PTUs but get extra capacity for bursts.
                </AlertDescription>
              </Alert>
            )}

            {/* Cost Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Comparison Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={calculations.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Monthly Cost']} />
                    <Legend />
                    <Bar dataKey="cost" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Metrics and Cost Efficiency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <CardTitle>Usage Metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average TPM:</span>
                      <span className="font-semibold">{formData.avgTPM.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calculated PTUs:</span>
                      <span className="font-semibold">{calculations.calculatedPTU}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PTUs Needed:</span>
                      <span className="font-semibold">{calculations.ptuNeeded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Tokens:</span>
                      <span className="font-semibold">{calculations.monthlyTokens?.toFixed(1)}M</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle>Cost Efficiency</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cost per 1M tokens:</span>
                      <span className="font-semibold">${calculations.costPer1MTokens?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization:</span>
                      <span className="font-semibold">{(calculations.utilizationRate * 100)?.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PTU Cost-Effectiveness Guidelines */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <CardTitle>PTU Cost-Effectiveness Guidelines</CardTitle>
                </div>
                <CardDescription>Understand when to use PAYGO, Hybrid, or full PTU reservations based on your usage patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">❌</span>
                        <h3 className="font-medium text-red-800">Stay on PAYGO</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><strong>TPM Range:</strong> &lt;10,000 TPM</div>
                        <div><strong>PTU Utilization:</strong> &lt;20% capacity</div>
                        <div><strong>Why PAYGO:</strong> Only pay for actual usage</div>
                        <div><strong>Cost Impact:</strong> Avoid paying for unused capacity</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⚠️</span>
                        <h3 className="font-medium text-yellow-800">Consider Hybrid Model</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><strong>TPM Range:</strong> 10,000-30,000 TPM</div>
                        <div><strong>Strategy:</strong> Base PTUs + PAYGO overflow</div>
                        <div><strong>Best For:</strong> Variable workloads with peaks</div>
                        <div><strong>Benefits:</strong> Cost control + scalability</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">✅</span>
                        <h3 className="font-medium text-green-800">Full PTU Reservation</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><strong>TPM Range:</strong> &gt;30,000 TPM sustained</div>
                        <div><strong>PTU Utilization:</strong> &gt;60% capacity</div>
                        <div><strong>Potential Savings:</strong> 15-40% vs PAYGO</div>
                        <div><strong>Best For:</strong> Predictable, high-volume usage</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <CardTitle>Key Decision Factors</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li><strong>• Usage Consistency:</strong> PTUs work best for predictable, sustained workloads</li>
                      <li><strong>• Capacity Planning:</strong> Each PTU = 50,000 tokens/minute guaranteed throughput</li>
                      <li><strong>• Break-Even Point:</strong> PTUs typically become cost-effective at 60%+ utilization</li>
                      <li><strong>• Growth Projections:</strong> Consider future usage patterns, not just current needs</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <CardTitle>Recommendation</CardTitle>
                </div>
                <CardDescription>Optimized pricing strategy for your usage pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <Card className="bg-yellow-50 border-yellow-200 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{calculations.recommendationIcon}</span>
                      <h3 className="font-medium text-yellow-800">Recommended: {calculations.recommendation}</h3>
                    </div>
                    <p className="text-yellow-700 mb-4">{calculations.recommendationReason}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Next Steps
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                          <li>Continue with your current PAYGO setup</li>
                          <li>Monitor usage patterns for future optimization</li>
                          <li>Consider PTU if usage grows consistently</li>
                        </ol>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Considerations
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                          <li>No commitment but higher per-token costs</li>
                          <li>Best for variable or experimental workloads</li>
                          <li>Monitor for usage pattern changes</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <CardTitle>Analysis Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Current TPM</div>
                        <div className="text-2xl font-bold text-blue-600">{formData.avgTPM.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Recommended Cost</div>
                        <div className="text-2xl font-bold text-green-600">${calculations.monthlyPaygoCost?.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">PTU Utilization</div>
                        <div className="text-2xl font-bold text-orange-600">{(calculations.utilizationRate * 100)?.toFixed(1)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Monthly Savings</div>
                        <div className="text-2xl font-bold text-purple-600">${calculations.oneYearSavings > 0 ? (calculations.oneYearSavings / 12)?.toFixed(2) : '0.00'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Interactive Analytics Dashboard - Only shows when user has data */}
            {showInteractiveCharts && (
              <InteractiveCharts
                costData={{
                  paygo: calculations.monthlyPaygoCost,
                  ptuHourly: calculations.monthlyPtuHourlyCost,
                  ptuMonthly: calculations.monthlyPtuReservationCost,
                  ptuYearly: calculations.yearlyPtuReservationCost / 12,
                  savings: Math.max(0, calculations.monthlyPaygoCost - calculations.monthlyPtuReservationCost)
                }}
                utilizationData={{
                  utilization: calculations.utilizationRate,
                  burstRatio: calculations.burstRatio,
                  peakRatio: calculations.peakRatio
                }}
                projectionData={{
                  monthly: calculations.monthlyPaygoCost,
                  yearly: calculations.monthlyPaygoCost * 12
                }}
                burstData={{
                  pattern: calculations.usagePattern,
                  efficiency: calculations.utilizationRate
                }}
                selectedModel={selectedModel}
                selectedRegion={selectedRegion}
              />
            )}
          </>
        )}

        {/* Key Concepts */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-purple-800">Key Concepts & Pro Tips</CardTitle>
            </div>
            <CardDescription className="text-purple-700">Essential information for understanding Azure OpenAI pricing and deployment options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    🔢 PTU Conversion Rate (50,000)
                  </h4>
                  <p className="text-sm text-purple-700">
                    Microsoft's official standard - each PTU provides exactly 50,000 tokens/minute of sustained throughput capacity according to Azure OpenAI documentation.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    ⚖️ Base PTUs for Hybrid Model
                  </h4>
                  <p className="text-sm text-purple-700">
                    Reserve a fixed number of PTUs (e.g., 2 PTUs = 100k tokens/min guaranteed) for your baseline usage, with automatic PAYGO billing when demand exceeds reserved capacity.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    🎯 Hybrid Strategy Benefits
                  </h4>
                  <p className="text-sm text-purple-700">
                    Combines predictable costs (PTU reservation) with elastic scalability (PAYGO overflow) - optimal for workloads with variable demand patterns.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    🌍 Deployment Type Pricing
                  </h4>
                  <p className="text-sm text-purple-700">
                    Global deployments typically cost 20-40% more than Regional deployments, with Data Zone deployments priced between the two.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    💰 PTU vs PAYGO
                  </h4>
                  <p className="text-sm text-purple-700">
                    PTU pricing offers 20-40% savings for sustained high-volume usage but requires monthly commitment, while PAYGO provides flexibility without commitment.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    ⏰ Monthly Minutes
                  </h4>
                  <p className="text-sm text-purple-700 mb-2">
                    Default 43,800 minutes assumes continuous 24/7 usage (30.4 days × 24 hours × 60 minutes).
                  </p>
                  <p className="text-xs text-purple-600 italic">
                    💡 Tip: Adjust this based on your actual usage hours for more accurate cost estimates.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                🔄 Dynamic Pricing Updates
              </h4>
              <p className="text-sm text-purple-700">
                The app uses AI analysis of official Azure OpenAI documentation to ensure current pricing accuracy and model availability.
              </p>
            </div>
          </CardContent>
        </Card>

<div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f8f8', borderRadius: '8px', color: '#333', fontSize: '0.95rem', textAlign: 'center' }}>
  <strong>Disclaimer:</strong> The information provided on this website is for informational purposes only. While we strive for accuracy, no guarantee is made regarding the completeness or correctness of the data. Microsoft and the site operators are not responsible for any errors, omissions, or decisions made based on this information. Users should verify all information independently before making any decisions.
</div>
        
        {/* Footer */}
        <Card className="mt-8 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-800">
                Made with ❤️ for the Azure community
              </p>
              <p className="text-sm text-gray-600">
                Optimize your Azure OpenAI costs with confidence using real data and intelligent analysis.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Action Buttons */}
        {deviceInfo.isMobile && (
          <div className="fixed bottom-4 right-4 z-40 space-y-2">
            <Button
              onClick={() => setShowInteractiveCharts(!showInteractiveCharts)}
              variant={showInteractiveCharts ? 'default' : 'outline'}
              className="flex items-center gap-2 shadow-lg bg-white"
            >
              <BarChart3 className="h-4 w-4" />
              Charts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

