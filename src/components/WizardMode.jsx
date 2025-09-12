import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Circle, 
  Play, 
  Database, 
  Settings, 
  BarChart3, 
  Share,
  Lightbulb,
  AlertCircle,
  Target,
  Zap
} from 'lucide-react';

const WizardMode = ({ 
  initialData = {}, 
  onDataChange,
  isWizardMode = false,
  onToggleWizard 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [wizardData, setWizardData] = useState({
    region: '',
    model: '',
    deploymentType: '',
    kqlData: {
      avgTPM: '',
      p99TPM: '',
      maxTPM: '',
      avgPTU: '',
      p99PTU: '',
      maxPTU: '',
      recommendedPTU: ''
    },
    usage: {
      monthlyMinutes: '',
      basePTUs: ''
    },
    ...initialData
  });

  const wizardSteps = [
    {
      id: 'welcome',
      title: 'Welcome to PTU Calculator',
      description: 'Let\'s optimize your Azure OpenAI costs step by step',
      icon: Play,
      component: WelcomeStep
    },
    {
      id: 'data-collection',
      title: 'Collect Your Usage Data',
      description: 'Run KQL query to get your current usage patterns',
      icon: Database,
      component: DataCollectionStep
    },
    {
      id: 'configuration',
      title: 'Configure Parameters',
      description: 'Set your region, model, and deployment preferences',
      icon: Settings,
      component: ConfigurationStep
    },
    {
      id: 'analysis',
      title: 'Review Analysis',
      description: 'Understand your usage patterns and recommendations',
      icon: BarChart3,
      component: AnalysisStep
    },
    {
      id: 'recommendations',
      title: 'Get Recommendations',
      description: 'Receive personalized cost optimization suggestions',
      icon: Target,
      component: RecommendationsStep
    },
    {
      id: 'completion',
      title: 'Complete Setup',
      description: 'Your analysis is ready! Share or export results',
      icon: CheckCircle,
      component: CompletionStep
    }
  ];

  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    if (completedSteps.has(stepIndex) || stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const updateWizardData = (section, data) => {
    const newData = {
      ...wizardData,
      [section]: typeof data === 'object' ? { ...wizardData[section], ...data } : data
    };
    setWizardData(newData);
    onDataChange?.(newData);
  };

  const UNUSED_isStepComplete = (stepIndex) => {
    return completedSteps.has(stepIndex);
  };

  const canProceed = () => {
    const step = wizardSteps[currentStep];
    switch (step.id) {
      case 'welcome':
        return true;
      case 'data-collection':
        return wizardData.kqlData.avgTPM && wizardData.kqlData.recommendedPTU;
      case 'configuration':
        return wizardData.region && wizardData.model && wizardData.deploymentType;
      case 'analysis':
        return true;
      case 'recommendations':
        return true;
      case 'completion':
        return true;
      default:
        return false;
    }
  };

  // Welcome Step Component
  function WelcomeStep() {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Zap className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Azure OpenAI PTU Calculator</h2>
          <p className="text-gray-600 mt-2">
            This guided wizard will help you optimize your Azure OpenAI costs by analyzing your usage patterns 
            and comparing different pricing models.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="pt-4 text-center">
              <Database className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold">Analyze Usage</h3>
              <p className="text-sm text-gray-600">Import your KQL query results</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold">Compare Costs</h3>
              <p className="text-sm text-gray-600">PAYGO vs PTU pricing models</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold">Get Recommendations</h3>
              <p className="text-sm text-gray-600">Personalized optimization advice</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-left">
              <h4 className="font-semibold text-blue-900">Pro Tip</h4>
              <p className="text-sm text-blue-700">
                Have your Azure Monitor KQL query results ready for the most accurate analysis. 
                We'll guide you through running the query in the next step.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Data Collection Step Component
  function DataCollectionStep() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Collect Your Usage Data</h2>
          <p className="text-gray-600">
            Run this KQL query in your Azure Monitor Log Analytics workspace to get accurate usage data.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KQL Query for Usage Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`// Burst-Aware Azure OpenAI PTU Sizing Analysis
let window = 1m;
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
            <Button className="mt-2" variant="outline" size="sm">
              Copy Query
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Average TPM (from KQL)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="5678"
              value={wizardData.kqlData.avgTPM}
              onChange={(e) => updateWizardData('kqlData', { avgTPM: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              P99 TPM (from KQL)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="12000"
              value={wizardData.kqlData.p99TPM}
              onChange={(e) => updateWizardData('kqlData', { p99TPM: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max TPM (from KQL)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="25000"
              value={wizardData.kqlData.maxTPM}
              onChange={(e) => updateWizardData('kqlData', { maxTPM: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommended PTU (from KQL)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="1"
              value={wizardData.kqlData.recommendedPTU}
              onChange={(e) => updateWizardData('kqlData', { recommendedPTU: e.target.value })}
            />
          </div>
        </div>

        {wizardData.kqlData.avgTPM && wizardData.kqlData.recommendedPTU && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-900">Data Collected Successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your usage data has been captured. Ready to proceed to configuration.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Configuration Step Component
  function ConfigurationStep() {
    const regions = [
      { id: 'east-us-2', name: 'East US 2', models: 13 },
      { id: 'west-europe', name: 'West Europe', models: 11 },
      { id: 'south-central-us', name: 'South Central US', models: 9 }
    ];

    const models = [
      { id: 'gpt-4o', name: 'GPT-4o', minPTU: 15 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', minPTU: 50 },
      { id: 'gpt-4', name: 'GPT-4', minPTU: 100 }
    ];

    const deploymentTypes = [
      { id: 'global', name: 'Global Deployment', description: 'Worldwide availability with load balancing' },
      { id: 'dataZone', name: 'Data Zone Deployment', description: 'Geographic-based deployment for compliance' },
      { id: 'regional', name: 'Regional Deployment', description: 'Single region deployment for lowest latency' }
    ];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configure Your Parameters</h2>
          <p className="text-gray-600">
            Select your preferred Azure region, OpenAI model, and deployment type.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Azure Region
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {regions.map((region) => (
                <Card 
                  key={region.id}
                  className={`cursor-pointer transition-colors ${
                    wizardData.region === region.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => updateWizardData('region', region.id)}
                >
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">{region.name}</h3>
                    <p className="text-sm text-gray-600">{region.models} PTU models</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI Model
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {models.map((model) => (
                <Card 
                  key={model.id}
                  className={`cursor-pointer transition-colors ${
                    wizardData.model === model.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => updateWizardData('model', model.id)}
                >
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">{model.name}</h3>
                    <Badge variant="secondary">Min: {model.minPTU} PTU</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deployment Type
            </label>
            <div className="space-y-3">
              {deploymentTypes.map((type) => (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-colors ${
                    wizardData.deploymentType === type.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => updateWizardData('deploymentType', type.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                      {wizardData.deploymentType === type.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Analysis Step Component
  function AnalysisStep() {
    const burstRatio = wizardData.kqlData.p99TPM && wizardData.kqlData.avgTPM 
      ? (parseFloat(wizardData.kqlData.p99TPM) / parseFloat(wizardData.kqlData.avgTPM)).toFixed(1)
      : '0';

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usage Pattern Analysis</h2>
          <p className="text-gray-600">
            Based on your KQL data, here's what we found about your usage patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Burst Ratio</p>
                  <p className="text-lg font-semibold">{burstRatio}x</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Recommended PTUs</p>
                  <p className="text-lg font-semibold">{wizardData.kqlData.recommendedPTU || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Usage Pattern</p>
                  <p className="text-lg font-semibold">
                    {parseFloat(burstRatio) > 3 ? 'Spiky' : parseFloat(burstRatio) > 1.5 ? 'Bursty' : 'Steady'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pattern Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  parseFloat(burstRatio) > 3 ? 'bg-red-500' : 
                  parseFloat(burstRatio) > 1.5 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div>
                  <p className="font-semibold">
                    {parseFloat(burstRatio) > 3 ? 'High Variability Detected' : 
                     parseFloat(burstRatio) > 1.5 ? 'Moderate Burst Pattern' : 'Consistent Usage Pattern'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {parseFloat(burstRatio) > 3 ? 
                      'Your usage has significant spikes. Consider hybrid model with base PTUs + PAYGO overflow.' : 
                      parseFloat(burstRatio) > 1.5 ? 
                      'Some burst activity detected. PTU reservations could provide cost savings.' :
                      'Very consistent usage. PTU reservations would be most cost-effective.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Recommendations Step Component
  function RecommendationsStep() {
    const burstRatio = wizardData.kqlData.p99TPM && wizardData.kqlData.avgTPM 
      ? parseFloat(wizardData.kqlData.p99TPM) / parseFloat(wizardData.kqlData.avgTPM)
      : 0;

    const getRecommendation = () => {
      if (burstRatio > 3) {
        return {
          primary: 'Hybrid Model',
          description: 'Reserve base PTUs for average usage, use PAYGO for bursts',
          icon: '🔄',
          color: 'blue',
          savings: '25-40%'
        };
      } else if (burstRatio > 1.5) {
        return {
          primary: 'PTU Monthly',
          description: '1-month PTU commitment with good flexibility',
          icon: '📅',
          color: 'green',
          savings: '15-30%'
        };
      } else {
        return {
          primary: 'PTU Yearly',
          description: '1-year commitment for maximum savings',
          icon: '🎯',
          color: 'purple',
          savings: '40-60%'
        };
      }
    };

    const recommendation = getRecommendation();

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Personalized Recommendations</h2>
          <p className="text-gray-600">
            Based on your usage patterns, here are our cost optimization recommendations.
          </p>
        </div>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{recommendation.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-900">
                  Recommended: {recommendation.primary}
                </h3>
                <p className="text-green-700 mt-1">{recommendation.description}</p>
                <div className="flex gap-2 mt-3">
                  <Badge className="bg-green-100 text-green-800">
                    Potential Savings: {recommendation.savings}
                  </Badge>
                  <Badge variant="outline">Best Match</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Review detailed cost comparison
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Plan your PTU reservation strategy
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Monitor usage patterns monthly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Set up cost alerts in Azure
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Considerations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <p className="text-sm">PTU reservations require minimum commitments</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <p className="text-sm">Monitor usage patterns for 2-4 weeks before committing</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <p className="text-sm">Consider seasonal variations in your workload</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Completion Step Component
  function CompletionStep() {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis Complete!</h2>
          <p className="text-gray-600 mt-2">
            Your Azure OpenAI cost optimization analysis is ready. You can now explore detailed 
            charts, share your results, or export the analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button className="flex items-center gap-2" onClick={() => onToggleWizard(false)}>
            <BarChart3 className="h-4 w-4" />
            View Full Dashboard
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Share className="h-4 w-4" />
            Share Analysis
          </Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">Your Configuration Summary</h3>
            <div className="text-left space-y-1 text-sm">
              <p><span className="font-medium">Region:</span> {wizardData.region}</p>
              <p><span className="font-medium">Model:</span> {wizardData.model}</p>
              <p><span className="font-medium">Deployment:</span> {wizardData.deploymentType}</p>
              <p><span className="font-medium">Avg TPM:</span> {wizardData.kqlData.avgTPM}</p>
              <p><span className="font-medium">Recommended PTU:</span> {wizardData.kqlData.recommendedPTU}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isWizardMode) {
    return (
      <Button 
        onClick={() => onToggleWizard(true)} 
        variant="outline" 
        className="flex items-center gap-2"
      >
        <Play className="h-4 w-4" />
        Start Wizard Mode
      </Button>
    );
  }

  const CurrentStepComponent = wizardSteps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Setup Wizard</h1>
          <Button 
            variant="ghost" 
            onClick={() => onToggleWizard(false)}
            className="text-gray-500"
          >
            Exit Wizard
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Step {currentStep + 1} of {wizardSteps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between mt-4 overflow-x-auto">
          {wizardSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);
            const isClickable = isCompleted || index <= currentStep;

            return (
              <div 
                key={step.id}
                className={`flex items-center cursor-pointer transition-colors ${
                  isClickable ? 'hover:text-blue-600' : 'cursor-not-allowed opacity-50'
                }`}
                onClick={() => isClickable && handleStepClick(index)}
              >
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isActive ? 'bg-blue-100 text-blue-700' : 
                  isCompleted ? 'bg-green-100 text-green-700' : 'text-gray-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium hidden md:block">{step.title}</span>
                </div>
                {index < wizardSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {React.createElement(wizardSteps[currentStep].icon, { 
                className: "h-5 w-5 text-blue-600" 
              })}
            </div>
            <div>
              <CardTitle>{wizardSteps[currentStep].title}</CardTitle>
              <CardDescription>{wizardSteps[currentStep].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent />
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button 
          onClick={handleNext}
          disabled={!canProceed() || currentStep === wizardSteps.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WizardMode;

