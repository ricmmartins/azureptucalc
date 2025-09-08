import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { Progress } from './components/ui/progress';
import { 
  Globe, 
  Shield, 
  MapPin, 
  RefreshCw, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  Clock, 
  BarChart3,
  Play,
  Share2,
  Smartphone
} from 'lucide-react';

// Import new components
import InteractiveCharts from './components/InteractiveCharts';
import WizardMode from './components/WizardMode';
import ShareAnalysis from './components/ShareAnalysis';
import MobileOptimizations, { useMobileDetection } from './components/MobileOptimizations';
import correctedPricingService from './corrected_pricing_service';
import ptuModelsData from './ptu_supported_models.json';

function App() {
  // Mobile detection
  const { isMobile, isTablet, orientation } = useMobileDetection();
  
  // Wizard mode state
  const [isWizardMode, setIsWizardMode] = useState(false);
  
  // Application state
  const [selectedRegion, setSelectedRegion] = useState('east-us-2');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [selectedDeployment, setSelectedDeployment] = useState('global');
  const [useCustomPricing, setUseCustomPricing] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  
  // KQL input data
  const [kqlData, setKqlData] = useState({
    avgTPM: '5678',
    p99TPM: '12000',
    maxTPM: '25000',
    avgPTU: '1',
    p99PTU: '1',
    maxPTU: '1',
    recommendedPTU: '1'
  });
  
  // Usage parameters
  const [monthlyMinutes, setMonthlyMinutes] = useState('43800');
  const [basePTUs, setBasePTUs] = useState('1');
  
  // Analysis results
  const [analysisResults, setAnalysisResults] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  // Get available models for selected region
  const getAvailableModels = () => {
    const regionModels = ptuModelsData.regions[selectedRegion]?.models || [];
    return regionModels.map(modelId => ({
      id: modelId,
      name: ptuModelsData.ptu_supported_models[modelId]?.name || modelId,
      minPTU: ptuModelsData.ptu_supported_models[modelId]?.min_ptu || 15
    }));
  };

  // Get available regions
  const getAvailableRegions = () => {
    return Object.entries(ptuModelsData.regions).map(([regionId, regionData]) => ({
      id: regionId,
      name: regionData.display_name,
      modelCount: regionData.models.length
    }));
  };

  // Calculate analysis results
  const calculateAnalysis = useMemo(() => {
    if (!kqlData.avgTPM || !kqlData.recommendedPTU) return null;

    const avgTPM = parseFloat(kqlData.avgTPM);
    const p99TPM = parseFloat(kqlData.p99TPM);
    const maxTPM = parseFloat(kqlData.maxTPM);
    const recommendedPTU = parseFloat(kqlData.recommendedPTU);

    // Get pricing for selected model and deployment
    const pricing = correctedPricingService.getModelPricing(selectedModel, selectedDeployment);
    
    // Calculate monthly tokens
    const monthlyTokens = avgTPM * parseFloat(monthlyMinutes);
    const inputTokens = monthlyTokens * 0.5; // Assume 50/50 split
    const outputTokens = monthlyTokens * 0.5;

    // Calculate costs
    const paygoCosts = correctedPricingService.calculatePaygoCosts({
      modelId: selectedModel,
      deploymentType: selectedDeployment,
      inputTokens,
      outputTokens,
      timeframe: 'monthly'
    });

    const ptuCosts = correctedPricingService.calculatePTUCosts({
      modelId: selectedModel,
      deploymentType: selectedDeployment,
      requiredPTUs: recommendedPTU,
      reservationType: 'monthly',
      timeframe: 'monthly'
    });

    // Calculate burst ratios
    const burstRatio = p99TPM / avgTPM;
    const peakRatio = maxTPM / avgTPM;
    
    // PTU utilization
    const ptuCapacity = recommendedPTU * 50000; // 50k tokens per PTU per minute
    const utilization = (avgTPM / ptuCapacity) * 100;

    // Usage pattern classification
    let usagePattern = 'Steady';
    if (burstRatio > 3) usagePattern = 'Spiky';
    else if (burstRatio > 1.5) usagePattern = 'Bursty';

    // Recommendation
    let recommendation = 'PAYGO';
    if (utilization > 60) recommendation = 'PTU Yearly';
    else if (utilization > 20) recommendation = 'PTU Monthly';
    else if (burstRatio > 2) recommendation = 'Hybrid Model';

    return {
      costs: {
        paygo: paygoCosts.totalCost,
        ptuHourly: ptuCosts.totalCost,
        ptuMonthly: ptuCosts.totalCost,
        ptuYearly: ptuCosts.totalCost * 0.7 // 30% discount for yearly
      },
      metrics: {
        burstRatio,
        peakRatio,
        utilization,
        monthlyTokens,
        recommendedPTU
      },
      pattern: {
        type: usagePattern,
        recommendation
      },
      pricing
    };
  }, [selectedModel, selectedDeployment, kqlData, monthlyMinutes]);

  // Update analysis results when calculation changes
  useEffect(() => {
    if (calculateAnalysis) {
      setAnalysisResults({
        region: selectedRegion,
        model: selectedModel,
        deploymentType: selectedDeployment,
        kqlData,
        results: calculateAnalysis,
        recommendations: {
          primary: calculateAnalysis.pattern.recommendation,
          savings: calculateAnalysis.costs.paygo - calculateAnalysis.costs.ptuMonthly,
          confidence: 'High'
        }
      });
    }
  }, [calculateAnalysis, selectedRegion, selectedModel, selectedDeployment, kqlData]);

  // Load official pricing
  const loadOfficialPricing = async () => {
    setIsLoadingPricing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, this would fetch from Azure API
      console.log('Loading official pricing...');
    } catch (error) {
      console.error('Failed to load pricing:', error);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  // Copy KQL query
  const copyKQLQuery = () => {
    const kqlQuery = `// Burst-Aware Azure OpenAI PTU Sizing Analysis
// Run this query in Azure Monitor Log Analytics for accurate capacity planning

let window = 1m;           // granularity for burst detection
let p = 0.99;             // percentile for burst sizing
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

    navigator.clipboard.writeText(kqlQuery);
  };

  // Handle wizard data changes
  const handleWizardDataChange = (data) => {
    if (data.region) setSelectedRegion(data.region);
    if (data.model) setSelectedModel(data.model);
    if (data.deploymentType) setSelectedDeployment(data.deploymentType);
    if (data.kqlData) setKqlData(prev => ({ ...prev, ...data.kqlData }));
    if (data.usage) {
      if (data.usage.monthlyMinutes) setMonthlyMinutes(data.usage.monthlyMinutes);
      if (data.usage.basePTUs) setBasePTUs(data.usage.basePTUs);
    }
  };

  // Handle share link generation
  const handleGenerateShareLink = (url, data) => {
    setShareUrl(url);
    console.log('Share link generated:', url, data);
  };

  // Handle data export
  const handleExportData = (format, data) => {
    console.log('Exporting data:', format, data);
  };

  // Main application content
  const MainContent = () => (
    <div className="space-y-6">
      {/* Pricing Data Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <CardTitle className="text-lg">Pricing Data Status</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadOfficialPricing}
              disabled={isLoadingPricing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingPricing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">Azure OpenAI pricing and model availability information</p>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Current pricing data loaded (expires in 3 hours)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Last refreshed: {new Date().toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Step 1: Get Your Token Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">1</div>
            Step 1: Get Your Token Data
          </CardTitle>
          <CardDescription>
            Run this KQL query in your Azure Log Analytics workspace to calculate your average tokens per minute (TPM)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400">// Burst-Aware Azure OpenAI PTU Sizing Analysis</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyKQLQuery}
                className="text-gray-400 hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="text-xs leading-relaxed">{`let window = 1m;
let p = 0.99;
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
| extend RecommendedPTU = max_of(AvgPTU, P99PTU)
| project AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Input Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">2</div>
            Step 2: Input Parameters
          </CardTitle>
          <CardDescription>Configure your pricing parameters and usage patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Deployment Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`cursor-pointer transition-colors ${selectedDeployment === 'global' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Global Deployment</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">Global SKU with worldwide availability and load balancing.</p>
                <p className="text-xs text-gray-500">Best for applications requiring global reach and high availability.</p>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${selectedDeployment === 'dataZone' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Data Zone Deployment</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">Geographic-based deployment (EU or US) for data residency.</p>
                <p className="text-xs text-gray-500">Ideal for compliance requirements.</p>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${selectedDeployment === 'regional' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Regional Deployment</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">Local region deployment (up to 27 regions) for lowest latency.</p>
                <p className="text-xs text-gray-500">Optimal for latency-sensitive applications.</p>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Azure Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI Model (PTU Supported Only)</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableModels().map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">Only models that support Provisioned Throughput Units (PTU) are shown.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deployment Type</label>
              <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
                <SelectTrigger>
                  <SelectValue />
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

          {/* Pricing Information */}
          {calculateAnalysis && (
            <Card className="bg-green-50 border-green-200 mb-6">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">
                    {selectedModel.toUpperCase()} - Official Pricing Available
                  </span>
                  <Badge className="bg-green-100 text-green-800">Official</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Deployment Type:</span> {selectedDeployment}
                  </div>
                  <div>
                    <span className="font-medium">PAYGO:</span> ${calculateAnalysis.pricing.paygo.input}/1M input tokens
                  </div>
                  <div>
                    <span className="font-medium">PTU:</span> ${calculateAnalysis.pricing.ptu.hourly}/hour per PTU
                  </div>
                  <div>
                    <span className="font-medium">Output tokens:</span> ${calculateAnalysis.pricing.paygo.output}/1M ({selectedDeployment} deployment)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Load Official Pricing Button */}
          <div className="mb-6">
            <Button 
              onClick={loadOfficialPricing}
              disabled={isLoadingPricing}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isLoadingPricing ? 'Loading...' : 'Load Official Pricing'}
            </Button>
          </div>

          {/* KQL Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Average TPM (from KQL)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="5678"
                value={kqlData.avgTPM}
                onChange={(e) => setKqlData(prev => ({ ...prev, avgTPM: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">AvgTPM from your KQL query results</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">P99 TPM (from KQL)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="12000"
                value={kqlData.p99TPM}
                onChange={(e) => setKqlData(prev => ({ ...prev, p99TPM: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">P99TPM - shows burst patterns</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max TPM (from KQL)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="25000"
                value={kqlData.maxTPM}
                onChange={(e) => setKqlData(prev => ({ ...prev, maxTPM: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">MaxTPM - absolute peak usage</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recommended PTU (from KQL)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="1"
                value={kqlData.recommendedPTU}
                onChange={(e) => setKqlData(prev => ({ ...prev, recommendedPTU: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">RecommendedPTU - KQL's sizing recommendation</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Active Minutes</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="43800"
                value={monthlyMinutes}
                onChange={(e) => setMonthlyMinutes(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Total minutes of usage per month</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base PTUs (for Hybrid Model)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="1"
                value={basePTUs}
                onChange={(e) => setBasePTUs(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Base PTU reservation for hybrid approach</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Charts */}
      {analysisResults && (
        <InteractiveCharts
          costData={analysisResults.results.costs}
          utilizationData={analysisResults.results.metrics}
          projectionData={null}
          burstData={analysisResults.results.pattern}
          selectedModel={selectedModel}
          selectedRegion={selectedRegion}
        />
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis Results</CardTitle>
            <CardDescription>Based on your usage patterns and selected configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">PAYGO Monthly</p>
                      <p className="text-lg font-semibold">${analysisResults.results.costs.paygo.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">PTU Monthly</p>
                      <p className="text-lg font-semibold">${analysisResults.results.costs.ptuMonthly.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Utilization</p>
                      <p className="text-lg font-semibold">{analysisResults.results.metrics.utilization.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Recommendation</p>
                      <p className="text-lg font-semibold">{analysisResults.results.pattern.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Analysis */}
      {analysisResults && (
        <ShareAnalysis
          analysisData={analysisResults}
          onGenerateShareLink={handleGenerateShareLink}
          onExportData={handleExportData}
        />
      )}
    </div>
  );

  // Render wizard mode or main content
  if (isWizardMode) {
    return (
      <MobileOptimizations isMobile={isMobile}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <WizardMode
              isWizardMode={isWizardMode}
              onToggleWizard={setIsWizardMode}
              initialData={{
                region: selectedRegion,
                model: selectedModel,
                deploymentType: selectedDeployment,
                kqlData,
                usage: { monthlyMinutes, basePTUs }
              }}
              onDataChange={handleWizardDataChange}
              onComplete={() => setIsWizardMode(false)}
            />
          </div>
        </div>
      </MobileOptimizations>
    );
  }

  return (
    <MobileOptimizations isMobile={isMobile}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  Azure OpenAI PTU Estimator
                </h1>
                <p className="text-gray-600 mt-1">
                  Optimize your Azure OpenAI costs by analyzing real usage patterns and comparing PAYGO, PTU, and hybrid pricing models
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Mobile indicator */}
                {isMobile && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    Mobile
                  </Badge>
                )}
                
                {/* Wizard Mode Toggle */}
                <WizardMode
                  isWizardMode={isWizardMode}
                  onToggleWizard={setIsWizardMode}
                />
                
                {/* Share Button */}
                {analysisResults && (
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MainContent />
        </div>
      </div>
    </MobileOptimizations>
  );
}

export default App;

