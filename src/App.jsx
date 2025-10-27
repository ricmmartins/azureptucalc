import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { RefreshCw, TrendingUp, Info, CheckCircle, AlertCircle, Brain, Globe, MapPin, DollarSign, Copy, Download, BarChart3, Target, Shield, Clock, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ptuModels from './ptu_supported_models.json';
// import AzureOpenAIPricingService from "./enhanced_pricing_service.js";
// import correctedPricingService from "./corrected_pricing_service.js";
import enhancedModelConfig from "./enhanced_model_config.json";
import correctedPricingData from './corrected_pricing_data.json';
import { calculateOfficialPTUPricing, OFFICIAL_PTU_PRICING } from "./officialPTUPricing.js";
import { getTokenPricing, calculatePAYGCost, OFFICIAL_TOKEN_PRICING } from "./official_token_pricing.js";
import { REGION_MODEL_AVAILABILITY, getRegionsByZone, isGovernmentRegion, getGovernmentAvailableModels } from "./regionModelAvailability.js";
import ExternalPricingService from './ExternalPricingService.js';
import ExportService from './ExportService.js';
// Temporarily comment out complex components
import InteractiveCharts from './components/InteractiveCharts';
// import MobileOptimizations, { useMobileDetection } from './components/MobileOptimizations';
import WelcomeModal from './components/WelcomeModal';
import GuidedTour from './components/GuidedTour';
import { TooltipIcon, TooltipText } from './components/Tooltip';
import './App.css';
import Modal from './components/ui/Modal';

function App() {
  // Enhanced features state
  console.log('🎯 FULL AZURE PTU CALCULATOR APP IS LOADING! Time:', new Date().toLocaleTimeString());
  const [showInteractiveCharts, setShowInteractiveCharts] = useState(true);
  // const deviceInfo = useMobileDetection(); // Commented out since import is disabled

  // Initialize enhanced pricing service with useMemo to prevent re-instantiation
  // const pricingService = useMemo(() => new AzureOpenAIPricingService(), []); // Commented out since import is disabled
  
  // State management
  const [selectedRegion, setSelectedRegion] = useState('eastus');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [selectedDeployment, setSelectedDeployment] = useState('global');
  const [useCustomPricing, setUseCustomPricing] = useState(false);
  const [isGovernmentRegionSelected, setIsGovernmentRegionSelected] = useState(false);
  
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
    basePTUs: 0,
    // Task 3: Input/Output token fields for PAYG calculation
    inputTokensMonthly: 0,
    outputTokensMonthly: 0,
    inputOutputRatio: 0.5  // Default 50/50 split
  });
  
  // Custom pricing data - aligned with official PTU pricing structure
  const [customPricing, setCustomPricing] = useState({
    paygo_input: 0.15,
    paygo_output: 0.60,
    ptu_hourly: 1.00,      // Official US$1/PTU-hour base rate
    ptu_monthly: 730,      // 730 hours/month * US$1/hour = $730/month
    ptu_yearly: 6132       // Monthly * 12 * 0.7 (30% yearly discount) = $6132/year
  });

  // Task 7: Load custom pricing from localStorage on component mount
  useEffect(() => {
    const savedCustomPricing = localStorage.getItem('azurePTUCustomPricing');
    if (savedCustomPricing) {
      try {
        setCustomPricing(JSON.parse(savedCustomPricing));
      } catch (error) {
        console.warn('Failed to load custom pricing from localStorage:', error);
      }
    }
    
    const savedUseCustomPricing = localStorage.getItem('azurePTUUseCustomPricing');
    if (savedUseCustomPricing) {
      setUseCustomPricing(savedUseCustomPricing === 'true');
    }
  }, []);

  // Task 7: Save custom pricing to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('azurePTUCustomPricing', JSON.stringify(customPricing));
  }, [customPricing]);

  // Task 7: Save custom pricing toggle to localStorage
  useEffect(() => {
    localStorage.setItem('azurePTUUseCustomPricing', useCustomPricing.toString());
  }, [useCustomPricing]);

  // Government region detection
  useEffect(() => {
    const isGov = isGovernmentRegion(selectedRegion);
    setIsGovernmentRegionSelected(isGov);

    // Auto-adjust deployment type for government regions
    if (isGov) {
      const regionInfo = REGION_MODEL_AVAILABILITY[selectedRegion];
      if (regionInfo && regionInfo.available_deployments.length > 0) {
        const availableDeployments = regionInfo.available_deployments;
        // If current deployment not available in gov region, switch to first available
        if (!availableDeployments.includes(selectedDeployment)) {
          setSelectedDeployment(availableDeployments[0]);
        }
      }
    }
  }, [selectedRegion, selectedDeployment]);
  
  // Task 9: External Pricing Service initialization
  const externalPricingService = useMemo(() => new ExternalPricingService(), []);
  const exportService = useMemo(() => new ExportService(), []);
  
  // Task 9: External pricing data state
  const [externalPricingData, setExternalPricingData] = useState(null);
  const [pricingUpdateInfo, setPricingUpdateInfo] = useState(null);
  const [isLoadingExternalPricing, setIsLoadingExternalPricing] = useState(false);
  
  // Task 9: Load external pricing data on component mount
  useEffect(() => {
    const loadExternalPricing = async () => {
      setIsLoadingExternalPricing(true);
      try {
        const data = await externalPricingService.loadPricingData();
        setExternalPricingData(data);
        
        // Check for updates
        const updateInfo = await externalPricingService.checkForUpdates();
        setPricingUpdateInfo(updateInfo);
      } catch (error) {
        console.warn('Failed to load external pricing:', error);
      } finally {
        setIsLoadingExternalPricing(false);
      }
    };
    
    loadExternalPricing();
  }, [externalPricingService]);

  // Onboarding state management
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [showReadmeModal, setShowReadmeModal] = useState(false);

  // Check if user is first-time visitor
  useEffect(() => {
    const hasVisited = localStorage.getItem('azurePTUCalculatorVisited');
    const hasCompletedOnboarding = localStorage.getItem('azurePTUOnboardingCompleted');
    
    if (!hasVisited && !hasCompletedOnboarding) {
      // First-time visitor - show welcome modal
      setShowWelcomeModal(true);
      localStorage.setItem('azurePTUCalculatorVisited', 'true');
    }
  }, []);

  // Onboarding handlers
  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setShowGuidedTour(true);
  };

  const handleCompleteTour = () => {
    setShowGuidedTour(false);
    localStorage.setItem('azurePTUOnboardingCompleted', 'true');
  };

  const handleSkipTour = () => {
    setShowGuidedTour(false);
    localStorage.setItem('azurePTUOnboardingCompleted', 'true');
  };

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('azurePTUOnboardingCompleted', 'true');
  };

  // Function to populate sample data for the guided tour
  const populateSampleData = () => {
    setFormData(prev => ({
      ...prev,
      avgTPM: 25000,        // Sample: 25K tokens per minute
      p99TPM: 45000,        // Sample: 45K peak tokens per minute
      recommendedPTU: 0,    // Will be calculated
      monthlyMinutes: 43800 // Keep existing monthly minutes
    }));
  };
  
  // Helper function to get current model throughput
  const getCurrentModelThroughput = () => {
    const modelConfig = enhancedModelConfig.models[selectedModel];
    return modelConfig?.throughput_per_ptu || 50000; // fallback for legacy models
  };

  // Task 4: PTU validation function
  const validatePTUInput = (ptuValue, fieldName) => {
    if (!ptuValue || ptuValue <= 0) return null;
    
    const modelConfig = enhancedModelConfig.models[selectedModel];
    if (!modelConfig) return null;
    
    const deployment = modelConfig.deployments[selectedDeployment];
    if (!deployment) return null;
    
    const minPTU = deployment.min_ptu;
    const increment = deployment.increment;
    const warnings = [];
    
    // Check minimum requirement
    if (ptuValue < minPTU) {
      warnings.push(`Below minimum of ${minPTU} PTUs for ${selectedModel} (${selectedDeployment} deployment)`);
    }
    
    // Check increment alignment
    if (ptuValue % increment !== 0) {
      const rounded = Math.ceil(ptuValue / increment) * increment;
      warnings.push(`Must be in increments of ${increment}. Suggested: ${rounded} PTUs`);
    }
    
    // Check realistic maximum (warning at 1000+ PTUs)
    if (ptuValue > 1000) {
      warnings.push(`Very high PTU count (${ptuValue}). Please verify this is correct.`);
    }
    
    return warnings.length > 0 ? warnings : null;
  };

  // Get PTU validation warnings for display
  const getPTUValidationWarnings = () => {
    const warnings = [];
    
    if (formData.avgPTU > 0) {
      const avgWarnings = validatePTUInput(formData.avgPTU, 'Average PTU');
      if (avgWarnings) warnings.push({ field: 'Average PTU', warnings: avgWarnings });
    }
    
    if (formData.p99PTU > 0) {
      const p99Warnings = validatePTUInput(formData.p99PTU, 'P99 PTU');
      if (p99Warnings) warnings.push({ field: 'P99 PTU', warnings: p99Warnings });
    }
    
    if (formData.maxPTU > 0) {
      const maxWarnings = validatePTUInput(formData.maxPTU, 'Max PTU');
      if (maxWarnings) warnings.push({ field: 'Max PTU', warnings: maxWarnings });
    }
    
    if (formData.recommendedPTU > 0) {
      const recWarnings = validatePTUInput(formData.recommendedPTU, 'Recommended PTU');
      if (recWarnings) warnings.push({ field: 'Recommended PTU', warnings: recWarnings });
    }
    
    return warnings;
  };

  // Pricing state - initialized with official pricing structure
  const [currentPricing, setCurrentPricing] = useState({
    paygo_input: 0.15,
    paygo_output: 0.60,
    ptu_hourly: 1.00,      // Official US$1/PTU-hour base rate
    ptu_monthly: 730,      // Official monthly calculation
    ptu_yearly: 6132,      // Official yearly calculation with 30% discount
    minPTU: 15,
    tokensPerPTUPerMinute: 50000  // Will be updated dynamically
  });
  
  const [calculations, setCalculations] = useState({});
  const [pricingStatus, setPricingStatus] = useState({
    lastRefreshed: new Date().toLocaleString(),
    isLoading: false,
    usingLiveData: false,
    dataExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000).toLocaleString() // 3 hours from now
  });

  // Enhanced pricing data state
  const [livePricingData, setLivePricingData] = useState(null);
  // Check if user has entered valid data

  // Function to refresh pricing data
  const refreshPricingData = async () => {
    if (!selectedModel) return;
    
    setPricingStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Clear cache and fetch fresh data
      // pricingService.cache.clear(); // Commented out since pricingService is disabled
      
      const deploymentTypeMap = {
        global: "global",
        dataZone: "data-zone",
        regional: "regional"
      };
      
      const enhancedDeploymentType = deploymentTypeMap[selectedDeployment] || "data-zone";
      // const pricing = await pricingService.getPricing(selectedModel, selectedRegion, enhancedDeploymentType); // Commented out since pricingService is disabled
      
      // Use fallback pricing for now
      // Use official base PTU pricing as a safe fallback (US$1/PTU-hour base)
      const pricing = {
        paygo_input: 0.002,
        paygo_output: 0.006,
        ptu_hourly: 1.00,
        ptu_monthly: 730, // 24 * 30.4167 ~ 730 hours/month
        ptu_yearly: 6132  // monthly * 12 * 0.7 (30% yearly discount)
      };
      
      setLivePricingData(pricing);
      setPricingStatus(prev => ({
        ...prev,
        isLoading: false,
        usingLiveData: true,
        lastRefreshed: new Date().toLocaleString()
      }));
    } catch (error) {
      console.warn("Failed to refresh pricing:", error);
      setPricingStatus(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };
  // Enhanced PTU calculation with model-specific minimums and increments
  const calculateEnhancedPTU = (avgTPM, model, deploymentType) => {
    const modelConfig = enhancedModelConfig.models[model];
    if (!modelConfig) {
      console.warn(`Model ${model} not found in enhanced config`);
      return { calculatedPTU: 0, ptuNeeded: 0, isUsingMinimum: false, increment: 1, throughput: 50000 };
    }

    const deployment = modelConfig.deployments[deploymentType];
    if (!deployment) {
      console.warn(`Deployment ${deploymentType} not available for ${model}`);
      return { calculatedPTU: 0, ptuNeeded: 0, isUsingMinimum: false, increment: 1, throughput: 50000 };
    }

    const throughput = modelConfig.throughput_per_ptu || 50000;
    const minPTU = deployment.min_ptu;
    const increment = deployment.increment;

    // Calculate raw PTU requirement based on throughput
    const rawPTU = avgTPM > 0 ? Math.ceil(avgTPM / throughput) : 0;
    
    // Apply minimum requirement
    const afterMinimum = Math.max(rawPTU, minPTU);
    
    // Round up to nearest increment
    const finalPTU = Math.ceil(afterMinimum / increment) * increment;
    
    return {
      calculatedPTU: rawPTU,
      ptuNeeded: finalPTU,
      isUsingMinimum: rawPTU < minPTU,
      increment: increment,
      throughput: throughput,
      minPTU: minPTU
    };
  };


  const hasValidData = formData.avgTPM > 0 || formData.recommendedPTU > 0 || formData.p99TPM > 0;

  // Load live pricing data when model or deployment changes
  useEffect(() => {
    const loadPricingData = async () => {
      if (!selectedModel) return;
      
      setPricingStatus(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Map deployment types to enhanced service format
        const deploymentTypeMap = {
          global: "global",
          dataZone: "data-zone", 
          regional: "regional"
        };
        
        const enhancedDeploymentType = deploymentTypeMap[selectedDeployment] || "data-zone";
        const pricing = await pricingService.getPricing(selectedModel, selectedRegion, enhancedDeploymentType);
        
        setLivePricingData(pricing);
        setPricingStatus(prev => ({
          ...prev,
          isLoading: false,
          usingLiveData: true,
          lastRefreshed: new Date().toLocaleString()
        }));
      } catch (error) {
        console.warn("Failed to load live pricing, using fallback:", error);
        setLivePricingData(null);
        setPricingStatus(prev => ({
          ...prev,
          isLoading: false,
          usingLiveData: false
        }));
      }
    };
    
    loadPricingData();
  }, [selectedModel, selectedDeployment, selectedRegion]);

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
        tokensPerPTUPerMinute: getCurrentModelThroughput()
      };
    }
    
    try {
      // TASK 2: Use official PTU pricing alignment (prefer authoritative corrected_pricing_data.json)
      const officialPTUPricing = calculateOfficialPTUPricing
        ? calculateOfficialPTUPricing(selectedRegion, selectedDeployment)
        : null;

      // If calculateOfficialPTUPricing is unavailable or missing reservation values,
      // fall back to corrected_pricing_data.json which contains authoritative reservation rates.
      const correctedModel = correctedPricingData.models?.[selectedModel];
      const correctedReservations = correctedModel?.reservations || null;

      // Safety guard: Global deployments should not receive a regional premium.
      if (selectedDeployment === 'global') {
        officialPTUPricing.multipliers = officialPTUPricing.multipliers || {};
        officialPTUPricing.multipliers.regional = 1;
        officialPTUPricing.multipliers.deployment = 1;
        officialPTUPricing.multipliers.combined = 1;
      }

      // Ensure PTU hourly/monthly/yearly align with the official base rate when available
      officialPTUPricing.hourly = officialPTUPricing.hourly || 1.00;
      officialPTUPricing.monthly = officialPTUPricing.monthly || Math.round(officialPTUPricing.hourly * 24 * 30.4167);
      officialPTUPricing.yearly = officialPTUPricing.yearly || Math.round(officialPTUPricing.monthly * 12 * 0.7);
      
      // Use official token pricing for PAYG
  const tokenPricing = getTokenPricing(selectedModel);
  const tokenPricingIsFallback = tokenPricing.isFallback === true;
      
      // Prefer explicit reservation (monthly/yearly) from corrected_pricing_data.json when present
      const ptuMonthly = correctedReservations?.monthly || officialPTUPricing?.monthly || (officialPTUPricing?.hourly ? Math.round(officialPTUPricing.hourly * 24 * 30.4167) : 730);
      const ptuYearly = correctedReservations?.yearly || officialPTUPricing?.yearly || Math.round(ptuMonthly * 12 * 0.7);

      return {
  paygo_input: tokenPricing.input,
  paygo_output: tokenPricing.output,
        ptu_hourly: officialPTUPricing?.hourly || correctedModel?.ptu?.[selectedDeployment] || 1.00,
        ptu_monthly: ptuMonthly,
        ptu_yearly: ptuYearly,
        minPTU: correctedModel?.minPTU?.[selectedDeployment] || 15,
        tokensPerPTUPerMinute: getCurrentModelThroughput(),
        // Additional metadata for transparency
        officialPricing: officialPTUPricing || { source: 'corrected_pricing_data.json', model: correctedModel },
        paygoIsFallback: tokenPricingIsFallback
      };
    } catch (error) {
      console.error('Error getting pricing:', error);
      // Fallback to official base pricing structure
      // Final fallback: use corrected_pricing_data.json entries or safe defaults
      const correctedModel = correctedPricingData.models?.[selectedModel];
      const fallbackTokenPricing = getTokenPricing(selectedModel);
      const ptuMonthly = correctedModel?.reservations?.monthly || 730;
      const ptuYearly = correctedModel?.reservations?.yearly || 6132;
      return {
        paygo_input: fallbackTokenPricing.input,
        paygo_output: fallbackTokenPricing.output,
        ptu_hourly: correctedModel?.ptu?.[selectedDeployment] || 1.00,
        ptu_monthly: ptuMonthly,
        ptu_yearly: ptuYearly,
        minPTU: correctedModel?.minPTU?.[selectedDeployment] || 15,
        tokensPerPTUPerMinute: getCurrentModelThroughput(),
        officialPricing: { source: 'fallback-corrected_pricing_data.json', model: correctedModel }
      };
    }
  };

  // Update pricing when selections change
  useEffect(() => {
    const pricing = getCurrentPricing();
    setCurrentPricing(pricing);
  }, [selectedModel, selectedDeployment, useCustomPricing, customPricing, formData.model]);

  // Calculate costs and recommendations
  useEffect(() => {
    // Only calculate if user has entered valid data
    if (!hasValidData) {
      setCalculations({});
      return;
    }
    // FIXED: Dynamic burst pattern analysis
    const burstRatio = formData.p99TPM && formData.avgTPM ? formData.p99TPM / formData.avgTPM : 1;
    const peakRatio = formData.maxTPM && formData.avgTPM ? formData.maxTPM / formData.avgTPM : 1;
    const ptuVariance = formData.p99PTU && formData.avgPTU ? Math.abs(formData.p99PTU - formData.avgPTU) : 0;
    
    // FIXED: PTU calculation logic with Task 4 manual PTU support
    // Use enhanced PTU calculation
    const enhancedPTUData = calculateEnhancedPTU(formData.avgTPM, selectedModel, selectedDeployment);
    
    // Task 4: Determine which PTU value to use (priority order)
    let manualPTU = 0;
    let manualPTUSource = '';
    
    if (formData.recommendedPTU > 0) {
      manualPTU = formData.recommendedPTU;
      manualPTUSource = 'Recommended PTU';
    } else if (formData.maxPTU > 0) {
      manualPTU = formData.maxPTU;
      manualPTUSource = 'Max PTU';
    } else if (formData.p99PTU > 0) {
      manualPTU = formData.p99PTU;
      manualPTUSource = 'P99 PTU';
    } else if (formData.avgPTU > 0) {
      manualPTU = formData.avgPTU;
      manualPTUSource = 'Average PTU';
    }
    
    // Apply minimum and increment validation to manual PTU if provided
    let finalPTU, finalCalculatedPTU;
    if (manualPTU > 0) {
      const minPTU = enhancedPTUData.minPTU;
      const increment = enhancedPTUData.increment;
      finalCalculatedPTU = manualPTU;
      finalPTU = Math.max(Math.ceil(manualPTU / increment) * increment, minPTU);
    } else {
      finalCalculatedPTU = enhancedPTUData.calculatedPTU;
      finalPTU = enhancedPTUData.ptuNeeded;
    }
    
    const calculatedPTU = finalCalculatedPTU;
    const ptuNeeded = finalPTU;
    
    // FIXED: Check if manual PTU is below minimum (not automatic calculation)
    const isUsingMinimum = manualPTU > 0 
      ? manualPTU < enhancedPTUData.minPTU 
      : enhancedPTUData.isUsingMinimum;
    
    // Monthly calculations
    // Task 3: Enhanced PAYG calculation using official token pricing
    let monthlyTokens, monthlyPaygoCost, paygoBreakdown;
    
    if (formData.inputTokensMonthly > 0 || formData.outputTokensMonthly > 0) {
      // Use explicit input/output token counts if provided
      const inputTokensInMillions = formData.inputTokensMonthly / 1000000;
      const outputTokensInMillions = formData.outputTokensMonthly / 1000000;
      paygoBreakdown = calculatePAYGCost(selectedModel, inputTokensInMillions, outputTokensInMillions);
      monthlyPaygoCost = paygoBreakdown.totalCost;
      monthlyTokens = formData.inputTokensMonthly + formData.outputTokensMonthly;
    } else if (formData.avgTPM > 0) {
      // Calculate from TPM using input/output ratio
      monthlyTokens = (formData.avgTPM * formData.monthlyMinutes) / 1000000;
      const inputTokensInMillions = monthlyTokens * formData.inputOutputRatio;
      const outputTokensInMillions = monthlyTokens * (1 - formData.inputOutputRatio);
      paygoBreakdown = calculatePAYGCost(selectedModel, inputTokensInMillions, outputTokensInMillions);
      monthlyPaygoCost = paygoBreakdown.totalCost;
    } else {
      monthlyTokens = 0;
      monthlyPaygoCost = 0;
      paygoBreakdown = { inputCost: 0, outputCost: 0, totalCost: 0, pricing: getTokenPricing(selectedModel) };
    }
  // Use official Azure convention: 730 hours/month
  const monthlyPtuCost = ptuNeeded * currentPricing.ptu_hourly * 730;
    const monthlyPtuHourlyCost = monthlyPtuCost;
    const monthlyPtuReservationCost = ptuNeeded * currentPricing.ptu_monthly;
  // Yearly reservation cost: use official value, monthly equivalent = (currentPricing.ptu_yearly * ptuNeeded) / 12
  const yearlyPtuReservationCost = (currentPricing.ptu_yearly * ptuNeeded) / 12;
    
    // FIXED: Dynamic utilization calculation
    const utilizationRate = formData.avgTPM > 0 ? formData.avgTPM / (ptuNeeded * enhancedPTUData.throughput) : 0;
    
    // Task 6: Break-even analysis calculations
    const breakEvenAnalysis = (() => {
      if (monthlyPaygoCost === 0 || currentPricing.ptu_monthly === 0) {
        return { breakEvenPTUs: 0, breakEvenTPM: 0, utilizationAtBreakEven: 0 };
      }
      
      // Break-even PTU count: where PTU monthly cost equals PAYG monthly cost
      const breakEvenPTUs = Math.ceil(monthlyPaygoCost / currentPricing.ptu_monthly);
      
      // Break-even TPM: TPM needed to justify PTU reservation
      const breakEvenTPM = breakEvenPTUs * enhancedPTUData.throughput;
      
      // Utilization at break-even point
      const utilizationAtBreakEven = breakEvenTPM > 0 ? formData.avgTPM / breakEvenTPM : 0;
      
      return { breakEvenPTUs, breakEvenTPM, utilizationAtBreakEven };
    })();
    
    // Cost per 1M tokens
    const costPer1MTokens = monthlyTokens > 0 ? monthlyPaygoCost / monthlyTokens : 0;
    
    // PTU cost effectiveness
    const ptuCostEffectiveness = monthlyPaygoCost > 0 ? monthlyPtuCost / monthlyPaygoCost : 0;
    
  // FIXED: Dynamic reservation savings calculations (align with official pricing)
  const oneYearSavings = Math.max(0, monthlyPtuCost - yearlyPtuReservationCost);
  const oneYearSavingsPercent = monthlyPtuCost > 0 ? ((monthlyPtuCost - yearlyPtuReservationCost) / monthlyPtuCost) * 100 : 0;
  // Multi-year logic placeholder (if needed)
  const threeYearSavings = 0;
  const threeYearSavingsPercent = 0;
    
    // FIXED: Dynamic monthly savings calculation
    const monthlySavings = Math.max(0, monthlyPaygoCost - monthlyPtuReservationCost);
    
    // FIXED: Aligned recommendation logic with cost calculations
    let recommendation = 'PAYGO';
    let recommendationReason = 'Very low utilization. PTU reservations would be cost-ineffective. Stick with PAYGO for maximum flexibility.';
    let recommendationIcon = '❌';
    
    // Base recommendation on actual cost comparison and utilization
    if (monthlyPtuReservationCost < monthlyPaygoCost && utilizationRate > 0.6) {
      recommendation = 'Full PTU Reservation';
      recommendationReason = 'High utilization with significant cost savings. PTU reservations offer substantial monthly savings.';
      recommendationIcon = '✅';
    } else if (monthlyPtuReservationCost < monthlyPaygoCost && utilizationRate > 0.2) {
      recommendation = 'Consider Spillover Model';
      recommendationReason = 'Moderate utilization with some cost benefits. Hybrid approach balances cost savings and flexibility.';
      recommendationIcon = '⚠️';
    } else if (utilizationRate < 0.2) {
      recommendation = 'PAYGO';
      recommendationReason = 'Low utilization makes PTU cost-ineffective. PAYGO provides better value for variable workloads.';
      recommendationIcon = '❌';
    }
    
    // FIXED: Dynamic pattern classification
    let usagePattern = 'Steady';
    if (burstRatio > 3.0) {
      usagePattern = 'Spiky';
    } else if (burstRatio > 2.0) {
      usagePattern = 'Bursty';
    }
    
    // FIXED: Dynamic burst frequency calculation (bursts per day)
    const burstFrequency = burstRatio > 2.0 ? Math.min(burstRatio * 1.5, 10) : burstRatio;
    
    // FIXED: Dynamic peak efficiency calculation
    const peakEfficiency = Math.min(utilizationRate * 100, 100);
    
    // Spillover model calculations
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
      // Use Azure's official terminology: "Spillover" instead of "Hybrid"
      { name: 'Spillover', cost: hybridTotalCost },
      { name: 'Spillover (1Y)', cost: hybridBaseCost * 0.75 + hybridOverflowCost },
      { name: 'Spillover (3Y)', cost: hybridBaseCost * 0.6 + hybridOverflowCost }
    ];
    
    setCalculations({
      enhancedPTUData,
      burstRatio,
      peakRatio,
      ptuVariance,
      calculatedPTU,
      ptuNeeded,
      isUsingMinimum,
      // Task 4: Manual PTU information
      manualPTU,
      manualPTUSource,
      monthlyTokens,
      monthlyPaygoCost,
      monthlyPtuCost,
      monthlyPtuHourlyCost,
      monthlyPtuReservationCost,
      yearlyPtuReservationCost,
      utilizationRate,
      // Task 6: Break-even analysis
      breakEvenAnalysis,
      costPer1MTokens,
      ptuCostEffectiveness,
      oneYearSavings,
      threeYearSavings,
      oneYearSavingsPercent,
      threeYearSavingsPercent,
      monthlySavings, // FIXED: Dynamic monthly savings
      burstFrequency, // FIXED: Dynamic burst frequency
      peakEfficiency, // FIXED: Dynamic peak efficiency
      recommendation,
      recommendationReason,
      recommendationIcon,
      usagePattern,
      hybridBasePTU,
      hybridOverflowCost,
      hybridBaseCost,
      hybridTotalCost,
      chartData,
      // Task 3: PAYG breakdown for detailed cost display
      paygoBreakdown
    });
  }, [formData, currentPricing, hasValidData, selectedModel, selectedDeployment]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    console.log(`Input change: ${field} = ${value}`);
    let parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) parsed = 0;
    setFormData(prev => ({
      ...prev,
      [field]: parsed
    }));
  };

  // Handle custom pricing changes
  const handleCustomPricingChange = (field, value) => {
    setCustomPricing(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Task 10: Export functionality handlers
  const handleExportCSV = () => {
    try {
      const reportData = {
        model: selectedModel,
        region: selectedRegion,
        deployment: selectedDeployment,
        ptuCount: calculations.ptuNeeded || formData.manualPTU || 0,
        usageScenario: calculations.usagePattern || 'Unknown',
        throughputNeeded: formData.avgTPM,
        ptuCostCalculation: {
          hourly: calculations.monthlyPtuHourlyCost / 730,
          monthly: calculations.monthlyPtuCost,
          yearly: calculations.yearlyPtuReservationCost,
          yearlyDiscount: currentPricing.officialPricing?.discount?.yearlyVsHourly || 0
        },
        paygCostCalculation: calculations.paygoBreakdown || {
          inputCost: 0,
          outputCost: 0,
          total: calculations.monthlyPaygoCost,
          inputTokens: formData.inputTokensMonthly,
          outputTokens: formData.outputTokensMonthly,
          inputPricePerK: currentPricing.token?.input || 0,
          outputPricePerK: currentPricing.token?.output || 0
        },
        breakEvenAnalysis: calculations.breakEvenAnalysis || {},
        customPricing: { enabled: useCustomPricing },
        validationWarnings: calculations.validationWarnings || []
      };
      
      exportService.generateReport(reportData);
      exportService.downloadCSV();
    } catch (error) {
      console.error('Export CSV failed:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleExportJSON = () => {
    try {
      const reportData = {
        model: selectedModel,
        region: selectedRegion,
        deployment: selectedDeployment,
        ptuCount: calculations.ptuNeeded || formData.manualPTU || 0,
        usageScenario: calculations.usagePattern || 'Unknown',
        throughputNeeded: formData.avgTPM,
        ptuCostCalculation: {
          hourly: calculations.monthlyPtuHourlyCost / 730,
          monthly: calculations.monthlyPtuCost,
          yearly: calculations.yearlyPtuReservationCost,
          yearlyDiscount: currentPricing.officialPricing?.discount?.yearlyVsHourly || 0
        },
        paygCostCalculation: calculations.paygoBreakdown || {
          inputCost: 0,
          outputCost: 0,
          total: calculations.monthlyPaygoCost,
          inputTokens: formData.inputTokensMonthly,
          outputTokens: formData.outputTokensMonthly,
          inputPricePerK: currentPricing.token?.input || 0,
          outputPricePerK: currentPricing.token?.output || 0
        },
        breakEvenAnalysis: calculations.breakEvenAnalysis || {},
        customPricing: { enabled: useCustomPricing },
        validationWarnings: calculations.validationWarnings || []
      };
      
      exportService.generateReport(reportData);
      exportService.downloadJSON();
    } catch (error) {
      console.error('Export JSON failed:', error);
      alert('Failed to export JSON. Please try again.');
    }
  };

  // Task 9: External pricing update handler
  const handleUpdateExternalPricing = async () => {
    setIsLoadingExternalPricing(true);
    try {
      const updatedData = await externalPricingService.updatePricingData();
      setExternalPricingData(updatedData);
      
      const updateInfo = await externalPricingService.checkForUpdates();
      setPricingUpdateInfo(updateInfo);
      
      alert('Pricing data updated successfully!');
    } catch (error) {
      console.error('Failed to update pricing:', error);
      alert('Failed to update pricing data. Please try again.');
    } finally {
      setIsLoadingExternalPricing(false);
    }
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
    try {
      if (!ptuModels || !ptuModels.ptu_supported_models) {
        console.warn('ptuModels not loaded, using fallback models');
        return [
          { id: 'gpt-4o', name: 'GPT-4o', minPTU: 15 },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', minPTU: 10 },
          { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo', minPTU: 5 }
        ];
      }
      
      let availableModels = Object.entries(ptuModels.ptu_supported_models).map(([id, model]) => ({
        id,
        name: model.name,
        minPTU: model.min_ptu
      }));

      // Filter models for government regions
      if (isGovernmentRegionSelected) {
        const govModels = getGovernmentAvailableModels();
        availableModels = availableModels.filter(model => govModels.includes(model.id));
      }

      return availableModels;
    } catch (error) {
      console.error('Error in getAvailableModels:', error);
      return [
        { id: 'gpt-4o', name: 'GPT-4o', minPTU: 15 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', minPTU: 10 }
      ];
    }
  };

  // Enhanced: Get available regions organized by zone with region-specific model availability
  const getAvailableRegions = () => {
    try {
      console.log('🔍 Attempting to load regions...');
      const regionsByZone = getRegionsByZone();
      console.log('✅ Regions loaded successfully:', regionsByZone);
      
      return Object.entries(regionsByZone).map(([zoneName, regions]) => ({
        zone: zoneName === 'US' ? 'North America' : 
              zoneName === 'EU' ? 'Europe' : 
              zoneName === 'APAC' ? 'Asia Pacific' : 
              zoneName === 'CA' ? 'Canada' : 
              zoneName === 'LATAM' ? 'South America' :
              zoneName === 'ME' ? 'Middle East' : zoneName,
        regions: regions.map(region => ({
          id: region.code,
          name: region.displayName,
          modelCount: Object.keys(region.available_models).length,
          capacity: region.available_models['gpt-4o']?.capacity || 'medium'
        }))
      }));
    } catch (error) {
      console.error('❌ Error loading regions:', error);
      console.warn('Error loading regions, using fallback:', error);
      // Fallback to simplified list if regionModelAvailability fails
      return [
        {
          zone: "All Regions",
          regions: [
            { id: 'eastus2', name: 'East US 2', modelCount: 8, capacity: 'high' },
            { id: 'westus', name: 'West US', modelCount: 8, capacity: 'high' },
            { id: 'westeurope', name: 'West Europe', modelCount: 6, capacity: 'medium' },
            { id: 'southeastasia', name: 'Southeast Asia', modelCount: 6, capacity: 'medium' }
          ]
        }
      ];
    }
  };

  // KQL Query code - Dynamic based on selected model
  const kqlQuery = `// Burst-Aware Azure OpenAI PTU Sizing Analysis
// Run this query in Azure Monitor Log Analytics for accurate capacity planning
// PTU calculator for model: ${formData.model}

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
    AvgPTU = ceiling(AvgTPM / ${getCurrentModelThroughput()}.0),
    P99PTU = ceiling(P99TPM / ${getCurrentModelThroughput()}.0),
    MaxPTU = ceiling(MaxTPM / ${getCurrentModelThroughput()}.0)
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
                Azure OpenAI PTU Calculator
              </CardTitle>
            </div>
            <CardDescription className="text-lg">
              Optimize your Azure OpenAI costs by analyzing real usage patterns and comparing PAYGO, PTU, and hybrid pricing models
            </CardDescription>
            
            {/* Quick Action Button */}
            <div className="flex justify-center mt-4">
              <Button 
                onClick={handleStartTour}
                variant="outline"
                size="sm"
              >
                <Target className="h-4 w-4 mr-2" />
                Quick Tour
              </Button>
            </div>
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
                onClick={refreshPricingData}
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
                <span className="text-sm">{pricingStatus.usingLiveData ? "Live pricing data from Azure API (prices.azure.com/api/retail/prices)" : "Static pricing data (expires in 3 hours)"}</span>
              </div>
              <div className="text-sm text-gray-600">
                Last refreshed: {pricingStatus.lastRefreshed}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Data Sources:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Azure Retail Prices API (prices.azure.com/api/retail/prices) - Live pricing data</li>
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
              Run this KQL query in your Azure Log Analytics workspace to calculate PTU requirements for <strong>{formData.model}</strong>
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
                <code>{`// Burst-Aware Azure OpenAI PTU Sizing Analysis\n// Run this query in Azure Monitor Log Analytics for accurate capacity planning\nlet window = 1m;              // granularity for burst detection\nlet p = 0.99;                 // percentile for burst sizing\nAzureMetrics\n| where ResourceProvider == \"MICROSOFT.COGNITIVESERVICES\"\n| where MetricName in (\"ProcessedPromptTokens\", \"ProcessedCompletionTokens\")\n| where TimeGenerated >= ago(7d)\n| summarize Tokens = sum(Total) by bin(TimeGenerated, window)\n| summarize\n    AvgTPM = avg(Tokens),\n    P99TPM = percentile(Tokens, p),\n    MaxTPM = max(Tokens)\n| extend\n    AvgPTU = ceiling(AvgTPM / 37000.0),    // <-- Adjust divisor for your model\n    P99PTU = ceiling(P99TPM / 37000.0),    // <-- Adjust divisor for your model\n    MaxPTU = ceiling(MaxTPM / 37000.0)     // <-- Adjust divisor for your model\n| extend RecommendedPTU = max_of(AvgPTU, P99PTU)  // higher value covers bursts\n| project AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU`}</code>
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
              <div className="mt-6 flex justify-center">
                <div className="w-full flex justify-start">
                  <button
                    type="button"
                    onClick={() => setShowReadmeModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg border border-blue-300 transition-colors duration-150"
                    style={{ textDecoration: 'none' }}
                  >
                    <Info className="h-5 w-5" />
                    Learn more about throughput per PTU & KQL Analysis
                  </button>
                </div>
      {/* Modal for README content */}
      <Modal
        isOpen={showReadmeModal}
        onClose={() => setShowReadmeModal(false)}
        title="Throughput per PTU & KQL Analysis"
      >
        <div className="space-y-4 text-sm text-gray-800 max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold text-base mb-2">How to Find the Right throughput_per_ptu (TPM per PTU) for Each Model</h3>
          <p>
            The correct <code>throughput_per_ptu</code> (tokens per minute per PTU) for each model is published by Microsoft in their official documentation:
            <br />
            <a href="https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding#latest-azure-openai-models" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Latest Azure OpenAI Models – Provisioned Throughput Table</a>
          </p>
          <ul className="list-disc ml-6">
            <li><b>GPT-4.1:</b> 3,000 tokens per minute per PTU (each output token counts as 4 input tokens for quota)</li>
            <li><b>GPT-4.1 Mini:</b> 14,900 tokens per minute per PTU</li>
            <li><b>GPT-4.1 Nano:</b> 59,400 tokens per minute per PTU</li>
            <li>The 50,000 value in the KQL step is a generic placeholder. Always refer to the official table for the exact value for your selected model. Adjust the KQL and calculator input accordingly.</li>
          </ul>
          <ol className="list-decimal ml-6">
            <li>Go to the link above.</li>
            <li>Find your model in the “Latest Azure OpenAI models” table.</li>
            <li>Use the “Tokens per minute per PTU” column for your calculations.</li>
          </ol>
          <p>If you have questions or spot discrepancies, please open an issue or suggestion!</p>
          <hr className="my-4" />
          <h3 className="font-semibold text-base mb-2">KQL Query Example</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto"><code>{`// Burst-Aware Azure OpenAI PTU Sizing Analysis\n// Run this query in Azure Monitor Log Analytics for accurate capacity planning\nlet window = 1m;           // granularity for burst detection\nlet p = 0.99;             // percentile for burst sizing\nAzureMetrics\n| where ResourceProvider == \"MICROSOFT.COGNITIVESERVICES\"\n| where MetricName in (\"ProcessedPromptTokens\", \"ProcessedCompletionTokens\")\n| where TimeGenerated >= ago(7d)\n| summarize Tokens = sum(Total) by bin(TimeGenerated, window)\n| summarize\n    AvgTPM = avg(Tokens),\n    P99TPM = percentile(Tokens, p),\n    MaxTPM = max(Tokens)\n| extend\n    AvgPTU = ceiling(AvgTPM / 50000.0),\n    P99PTU = ceiling(P99TPM / 50000.0),\n    MaxPTU = ceiling(MaxTPM / 50000.0)\n| extend RecommendedPTU = max_of(AvgPTU, P99PTU)  // higher value covers bursts\n| project AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU`}</code></pre>
        </div>
      </Modal>
              </div>
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

              <Alert className="border-blue-300 bg-blue-50 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <AlertDescription className="text-blue-800 ml-1">
                  <strong>Pro Tip:</strong> Start conservative with your estimates. You can always scale up PTU reservations later, but it's harder to scale down.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Configuration */}
        <Card className="region-model-section">
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
                        {getAvailableRegions().map(zone => (
                          zone.regions.length > 0 && (
                            <div key={zone.zone}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-100">
                                {zone.zone}
                              </div>
                              {zone.regions.map(region => (
                                <SelectItem key={region.id} value={region.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{region.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          )
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

                {/* Government Region Notice */}
                {isGovernmentRegionSelected && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center gap-2 mb-2">
                        <strong className="text-blue-800">Government Region Selected</strong>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">USGov Cloud</Badge>
                      </div>
                      <p className="text-blue-700 mb-2">
                        You've selected a US Government region ({selectedRegion}). 
                        Use "Custom Pricing" below if you have specific contract rates or enterprise agreements.
                      </p>
                      <div className="text-sm text-blue-600">
                        <strong>Available Models:</strong> This region supports a limited set of models optimized for government workloads.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Current Model Pricing Display */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-green-800">
                        {(ptuModels.ptu_supported_models?.[selectedModel]?.name || 'Unknown Model').toString().toUpperCase()} - Official Pricing Available
                      </h3>
                      <Badge variant="default" className="bg-green-600">Official</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Deployment Type:</strong> {selectedDeployment === 'dataZone' ? 'Data Zone' : selectedDeployment === 'regional' ? 'Regional' : 'Global'}
                      </div>
                      <div>
                        <strong>PAYGO:</strong> ${currentPricing.paygo_input}/1M input tokens
                        {currentPricing.paygoIsFallback && (
                          <div className="text-xs text-yellow-700">(PAYGO fallback rates used)</div>
                        )}
                      </div>
                      <div>
                        <strong>PTU Hourly:</strong> ${currentPricing.ptu_hourly}/hour per PTU
                      </div>
                      <div>
                        <strong>Output tokens:</strong> ${currentPricing.paygo_output}/1M ({selectedDeployment === 'dataZone' ? 'Data Zone' : selectedDeployment === 'regional' ? 'Regional' : 'Global'} deployment)
                      </div>
                    </div>
                    
                    {/* TASK 2: Official PTU Pricing Structure Display */}
                    {currentPricing.officialPricing && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Official PTU Pricing Structure (US$1/PTU-hour base)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Monthly:</strong> ${currentPricing.ptu_monthly}/PTU
                            <div className="text-xs text-blue-600">730 hours × ${currentPricing.ptu_hourly}</div>
                          </div>
                          <div>
                            <strong>Yearly:</strong> ${currentPricing.ptu_yearly}/PTU
                            <div className="text-xs text-blue-600">{currentPricing.officialPricing?.discount?.yearlyVsHourly || 30}% discount vs monthly</div>
                          </div>
                          <div>
                            <strong>Regional Multiplier:</strong> {currentPricing.officialPricing?.multipliers?.combined || 1}x
                            <div className="text-xs text-blue-600">{selectedRegion.toUpperCase()} + {selectedDeployment}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-blue-700">
                          💡 <strong>Discount Transparency:</strong> Yearly reservations provide {currentPricing.officialPricing?.discount?.yearlyVsHourly || 30}% savings compared to monthly billing
                        </div>
                      </div>
                    )}
                    
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

                {/* Task 7: Enhanced Custom Pricing Toggle with better labeling */}
                <div className="flex items-center gap-2 mt-4 custom-pricing-section">
                  <input
                    type="checkbox"
                    id="customPricing"
                    checked={useCustomPricing}
                    onChange={(e) => setUseCustomPricing(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="customPricing" className="text-red-600">
                    Use Custom Pricing
                    <TooltipIcon term="custom-pricing" />
                  </Label>
                </div>
                
                {/* Task 7: Enhanced help text for custom pricing */}
                <Alert className="mt-2 border-red-200 bg-red-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    <strong>Custom Pricing:</strong> Use this section only if you have negotiated rates with Microsoft 
                    or special enterprise agreements. Default values shown are official Microsoft pricing. 
                    Custom pricing will override all calculations below.
                  </AlertDescription>
                </Alert>

                {/* Task 7: Enhanced Custom Pricing Inputs with defaults and descriptions */}
                {useCustomPricing && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">PAYGO Input ($/1M tokens)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customPricing.paygo_input}
                        onChange={(e) => handleCustomPricingChange('paygo_input', e.target.value)}
                        placeholder={getTokenPricing(selectedModel).input.toString()}
                      />
                      <p className="text-xs text-red-600 mt-1">Default: ${getTokenPricing(selectedModel).input}/M</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">PAYGO Output ($/1M tokens)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customPricing.paygo_output}
                        onChange={(e) => handleCustomPricingChange('paygo_output', e.target.value)}
                        placeholder={getTokenPricing(selectedModel).output.toString()}
                      />
                      <p className="text-xs text-red-600 mt-1">Default: ${getTokenPricing(selectedModel).output}/M</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">PTU Hourly ($/hour)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customPricing.ptu_hourly}
                        onChange={(e) => handleCustomPricingChange('ptu_hourly', e.target.value)}
                        placeholder="1.00"
                      />
                      <p className="text-xs text-red-600 mt-1">Official: $1.00/hour base</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">PTU Monthly ($/month)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={customPricing.ptu_monthly}
                        onChange={(e) => handleCustomPricingChange('ptu_monthly', e.target.value)}
                        placeholder="730"
                      />
                      <p className="text-xs text-red-600 mt-1">Official: $730/month</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">PTU Yearly ($/year)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={customPricing.ptu_yearly}
                        onChange={(e) => handleCustomPricingChange('ptu_yearly', e.target.value)}
                        placeholder="6132"
                      />
                      <p className="text-xs text-red-600 mt-1">Official: $6,132/year (30% discount)</p>
                    </div>
                    
                    {/* Task 7: Reset button for custom pricing */}
                    <div className="col-span-full">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          const official = calculateOfficialPTUPricing(selectedRegion, selectedDeployment);
                          const tokens = getTokenPricing(selectedModel);
                          setCustomPricing({
                            paygo_input: tokens.input,
                            paygo_output: tokens.output,
                            ptu_hourly: official.hourly,
                            ptu_monthly: official.monthly,
                            ptu_yearly: official.yearly
                          });
                        }}
                        className="mt-2"
                      >
                        Reset to Official Pricing
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KQL Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 usage-inputs-section">
              <div>
                <Label htmlFor="avgTPM">
                  Average TPM (from KQL)
                  <TooltipIcon term="tpm" />
                </Label>
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
                <Label htmlFor="p99TPM">
                  P99 TPM (from KQL)
                  <TooltipIcon term="p99" />
                </Label>
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
                <Label htmlFor="recommendedPTU">
                  Recommended PTU (from KQL)
                  <TooltipIcon term="ptu" />
                </Label>
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
                <Label htmlFor="basePTUs">Base PTUs (for Spillover)</Label>
                <Input
                  id="basePTUs"
                  type="number"
                  value={formData.basePTUs}
                  onChange={(e) => handleInputChange('basePTUs', e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">Base PTU reservation for spillover approach</p>
              </div>
            </div>

            {/* Task 4: PTU Validation Warnings */}
            {(() => {
              const validationWarnings = getPTUValidationWarnings();
              return validationWarnings.length > 0 && (
                <div className="mt-4 border border-orange-200 bg-orange-50 rounded-lg px-4 py-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                    <div className="ml-1 space-y-2">
                      <strong className="text-orange-800">PTU Input Validation:</strong>
                      {validationWarnings.map((warning, index) => (
                        <div key={index} className="ml-4">
                          <div className="font-medium text-orange-800">{warning.field}:</div>
                          <ul className="ml-4 text-orange-700">
                            {warning.warnings.map((msg, msgIndex) => (
                              <li key={msgIndex} className="text-sm">• {msg}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Task 3: PAYG Token-based Pricing Inputs */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  PAYG Token Usage (Alternative to TPM)
                </CardTitle>
                <CardDescription>
                  Specify input/output token usage for more accurate PAYG cost calculation.
                  Leave blank to use TPM-based estimation with ratio below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="inputTokensMonthly">Monthly Input Tokens</Label>
                    <Input
                      id="inputTokensMonthly"
                      type="number"
                      value={formData.inputTokensMonthly}
                      onChange={(e) => handleInputChange('inputTokensMonthly', e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-sm text-gray-600 mt-1">Total input tokens per month</p>
                  </div>
                  <div>
                    <Label htmlFor="outputTokensMonthly">Monthly Output Tokens</Label>
                    <Input
                      id="outputTokensMonthly"
                      type="number"
                      value={formData.outputTokensMonthly}
                      onChange={(e) => handleInputChange('outputTokensMonthly', e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-sm text-gray-600 mt-1">Total output tokens per month</p>
                  </div>
                  <div>
                    <Label htmlFor="inputOutputRatio">Input/Output Ratio</Label>
                    <Input
                      id="inputOutputRatio"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={formData.inputOutputRatio}
                      onChange={(e) => handleInputChange('inputOutputRatio', e.target.value)}
                      placeholder="0.5"
                    />
                    <p className="text-sm text-gray-600 mt-1">Ratio of input to total tokens (0.5 = 50/50 split)</p>
                  </div>
                </div>
                <div className="mt-4 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0 mr-1" />
                    <div className="text-blue-700">
                      <strong>Usage:</strong> If you specify monthly token counts above, they will be used for PAYG calculation.
                      Otherwise, TPM values will be used with the input/output ratio.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="mt-6 border-green-200 bg-green-50">
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                      Pro Tip: Spillover Strategy
                    </h4>
                    <p className="text-green-700 mb-3">
                      <strong>Spillover Model (Base + PAYGO overflow):</strong> Reserve base PTUs for average usage, let burst traffic "spill over" to PAYGO. 
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
            <Card className="results-section">
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
                      <div className="text-2xl font-bold text-blue-600 mt-2">{calculations.usagePattern || 'N/A'}</div>
                      <p className="text-sm text-blue-600 mt-1">
                        {calculations.usagePattern === 'Steady' && 'Consistent usage with minimal spikes'}
                        {calculations.usagePattern === 'Bursty' && 'Moderate spikes in usage patterns'}
                        {calculations.usagePattern === 'Spiky' && 'High variability with significant peaks'}
                        {!calculations.usagePattern && 'Enter TPM values to see usage pattern analysis'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium text-green-800">Burst Ratio</h3>
                      <div className="text-2xl font-bold text-green-600 mt-2">{calculations.burstRatio?.toFixed(1) || '0.0'}x</div>
                      <p className="text-sm text-green-600 mt-1">P99 vs Average TPM</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium text-purple-800">Peak Ratio</h3>
                      <div className="text-2xl font-bold text-purple-600 mt-2">{calculations.peakRatio?.toFixed(1) || '0.0'}x</div>
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
                      <p className="text-xs text-green-600 mb-2">Save ${calculations.oneYearSavings?.toFixed(2) || '0.00'}/mo</p>
                      <div className="text-right">
                        <span className="text-xs text-green-600">{calculations.oneYearSavingsPercent?.toFixed(1) || '0.0'}% savings</span>
                        <div className="text-2xl font-bold text-green-600">${calculations.monthlyPtuReservationCost?.toFixed(2) || '0.00'}/mo</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-100 border-green-300">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-green-800">3-Year Reservation</h3>
                        <Badge variant="secondary" className="bg-green-200 text-green-900">45% off</Badge>
                      </div>
                      <p className="text-xs text-green-700 mb-2">Save ${calculations.threeYearSavings?.toFixed(2) || '0.00'}/mo</p>
                      <div className="text-right">
                        <span className="text-xs text-green-700">{calculations.threeYearSavingsPercent?.toFixed(1) || '0.0'}% savings</span>
                        <div className="text-2xl font-bold text-green-800">${((calculations.yearlyPtuReservationCost || 0) / 12).toFixed(2)}/mo</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4 bg-gradient-to-r from-green-100 to-blue-100 border-green-300">
                  <CardContent className="p-4 text-center">
                    <h3 className="font-medium text-green-800 mb-2">3-Year Total Savings</h3>
                    <div className="text-3xl font-bold text-green-600">${((calculations.threeYearSavings || 0) * 36).toFixed(2)}</div>
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
                  {/* Task 3: Enhanced PAYGO breakdown */}
                  {calculations.paygoBreakdown && (
                    <div className="text-xs text-gray-600 mb-2 space-y-1">
                      <div>Input: ${calculations.paygoBreakdown.inputCost?.toFixed(2) || '0.00'}</div>
                      <div>Output: ${calculations.paygoBreakdown.outputCost?.toFixed(2) || '0.00'}</div>
                      {calculations.paygoBreakdown.pricing && (
                        <div className="mt-1 pt-1 border-t border-gray-300">
                          <div>${calculations.paygoBreakdown.pricing.input}/M input</div>
                          <div>${calculations.paygoBreakdown.pricing.output}/M output</div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-xs text-gray-600">Pay-as-you-go</span>
                    <div className="text-2xl font-bold text-gray-600">${calculations.monthlyPaygoCost?.toFixed(2) || '0.00'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <h3 className="font-medium text-blue-800">PTU (On-Demand)</h3>
                  <p className="text-xs text-blue-600 mb-2">
                    {calculations.ptuNeeded || 0} PTUs needed
                    {calculations.isUsingMinimum && (
                      <span className="block text-xs text-orange-600 mt-1">
                        (Minimum: {calculations.enhancedPTUData?.minPTU || 0} PTUs, Increment: {calculations.enhancedPTUData?.increment || 1})
                      </span>
                    )}
                  </p>
                  <div className="text-right">
                    <span className="text-xs text-blue-600">Reserved</span>
                    <div className="text-2xl font-bold text-blue-600">${calculations.monthlyPtuCost?.toFixed(2) || '0.00'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-100 border-green-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-green-800">PTU (Yearly)</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {currentPricing.officialPricing?.discount.yearlyVsMonthly || 30}% off
                    </Badge>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    Save ${calculations.oneYearSavings?.toFixed(2) || '0.00'}/mo
                    {currentPricing.officialPricing && (
                      <span className="block text-xs text-green-700">Official {currentPricing.officialPricing?.discount?.yearlyVsMonthly || 30}% yearly discount</span>
                    )}
                  </p>
                  <div className="text-right">
                    <span className="text-xs text-green-600">
                      {currentPricing.officialPricing?.discount.yearlyVsMonthly || 30}% off
                    </span>
                    <div className="text-2xl font-bold text-green-600">${calculations.monthlyPtuReservationCost?.toFixed(2) || '0.00'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-green-800">PTU (Multi-Year)</h3>
                    <Badge variant="secondary" className="bg-green-200 text-green-900">
                      {(currentPricing.officialPricing?.discount?.yearlyVsHourly?.toFixed(1)) || '45'}% off
                    </Badge>
                  </div>
                  <p className="text-xs text-green-700 mb-2">
                    Save ${calculations.threeYearSavings?.toFixed(2) || '0.00'}/mo
                    <span className="block text-xs text-green-600">vs hourly billing</span>
                  </p>
                  <div className="text-right">
                    <span className="text-xs text-green-700">45% off</span>
                    <div className="text-2xl font-bold text-green-800">${((calculations.yearlyPtuReservationCost || 0) / 12).toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PTU Requirements Explanation */}
            {calculations.isUsingMinimum && (
              <Alert className="border-orange-200 bg-orange-50 flex items-center gap-2">
                <Info className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <AlertDescription className="text-orange-800">
                  <strong>Using Minimum PTU Requirement:</strong> Your calculated need is {calculations.calculatedPTU || 0} PTU(s), but Azure requires a minimum of {calculations.enhancedPTUData?.minPTU || 0} PTUs for this model and deployment type. You'll pay for {calculations.ptuNeeded || 0} PTUs but get extra capacity for bursts.
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
                  <BarChart data={calculations.chartData || []}>
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

            {/* Task 10: Export Functionality */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 export-section">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-800">Export Analysis Report</CardTitle>
                </div>
                <CardDescription>Download comprehensive cost analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">Report Contents:</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Configuration summary ({selectedModel}, {selectedRegion}, {selectedDeployment})
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Cost breakdown (PTU vs PAYG)
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
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 mb-2">Export Options:</h4>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleExportCSV}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        variant="default"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button 
                        onClick={handleExportJSON}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        variant="default"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export as JSON
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Files include timestamp and are ready for sharing or further analysis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task 9: External Pricing Data Status */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-purple-800">External Pricing Data</CardTitle>
                  </div>
                  {pricingUpdateInfo?.hasUpdate && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Update Available
                    </Badge>
                  )}
                </div>
                <CardDescription>Current pricing data version and status</CardDescription>
              </CardHeader>
              <CardContent>
                {externalPricingData ? (
                  <div className="space-y-4">
                    {/* Pricing Data Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600">Version</span>
                        <div className="text-sm font-medium">{externalPricingData.version}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600">Last Updated</span>
                        <div className="text-sm font-medium">
                          {new Date(externalPricingData.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600">Status</span>
                        <div className="text-sm font-medium">
                          {pricingUpdateInfo ? pricingUpdateInfo.message : 'Recently checked'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Source Information */}
                    {externalPricingData.sourceUrl && (
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Data Source</span>
                        </div>
                        <div className="text-sm text-gray-600 break-all">
                          <a 
                            href={externalPricingData.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {externalPricingData.sourceUrl}
                          </a>
                        </div>
                        <div className="text-xs text-gray-500">
                          Official Microsoft Learn documentation
                        </div>
                      </div>
                    )}
                    
                    {/* Update Button */}
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleUpdateExternalPricing}
                        disabled={isLoadingExternalPricing}
                        className="min-w-[200px]"
                        variant="outline"
                      >
                        {isLoadingExternalPricing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        {isLoadingExternalPricing ? 'Updating...' : 'Check for Updates'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <RefreshCw className={`h-8 w-8 mx-auto text-gray-400 mb-3 ${isLoadingExternalPricing ? 'animate-spin' : ''}`} />
                      <p className="text-gray-600">
                        {isLoadingExternalPricing ? 'Loading external pricing data...' : 'External pricing data unavailable'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Using fallback pricing configuration
                      </p>
                    </div>
                    
                    {/* Fallback source information */}
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Data Source</span>
                      </div>
                      <div className="text-sm text-gray-600 break-all">
                        <a 
                          href="https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding
                        </a>
                      </div>
                      <div className="text-xs text-gray-500">
                        Official Microsoft Learn documentation
                      </div>
                    </div>
                    
                    {/* Update Button */}
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleUpdateExternalPricing}
                        disabled={isLoadingExternalPricing}
                        className="min-w-[200px]"
                        variant="outline"
                      >
                        {isLoadingExternalPricing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        {isLoadingExternalPricing ? 'Loading...' : 'Load External Data'}
                      </Button>
                    </div>
                  </div>
                )}
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
                      <span className="font-semibold">{calculations.calculatedPTU || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PTUs Needed:</span>
                      <span className="font-semibold">{calculations.ptuNeeded || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Tokens:</span>
                      <span className="font-semibold">{calculations.monthlyTokens?.toFixed(1) || '0.0'}M</span>
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
                      <span className="font-semibold">${calculations.costPer1MTokens?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization:</span>
                      <span className="font-semibold">{((calculations.utilizationRate || 0) * 100).toFixed(1)}%</span>
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
                        <h3 className="font-medium text-yellow-800">Consider Spillover Model</h3>
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
                      <li><strong>• Capacity Planning:</strong> Each PTU provides guaranteed throughput capacity (varies by model)</li>
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
                      <span className="text-2xl">{calculations.recommendationIcon || '❓'}</span>
                      <h3 className="font-medium text-yellow-800">Recommended: {calculations.recommendation || 'N/A'}</h3>
                    </div>
                    <p className="text-yellow-700 mb-4">{calculations.recommendationReason || 'Enter TPM values to see recommendations'}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Next Steps
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                          {calculations.recommendation === 'PAYGO' && (
                            <>
                              <li>Continue with your current PAYGO setup</li>
                              <li>Monitor usage patterns for future optimization</li>
                              <li>Consider PTU if usage grows consistently</li>
                            </>
                          )}
                          {calculations.recommendation === 'Consider Spillover Model' && (
                            <>
                              <li>Reserve base PTUs for average usage</li>
                              <li>Let burst traffic use PAYGO overflow</li>
                              <li>Monitor cost savings and adjust as needed</li>
                            </>
                          )}
                          {calculations.recommendation === 'Full PTU Reservation' && (
                            <>
                              <li>Consider 1-year or 3-year PTU reservations</li>
                              <li>Start with 1-year for flexibility</li>
                              <li>Monitor utilization and optimize sizing</li>
                            </>
                          )}
                        </ol>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Considerations
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                          {calculations.recommendation === 'PAYGO' && (
                            <>
                              <li>No commitment but higher per-token costs</li>
                              <li>Best for variable or experimental workloads</li>
                              <li>Monitor for usage pattern changes</li>
                            </>
                          )}
                          {calculations.recommendation === 'Consider Spillover Model' && (
                            <>
                              <li>Balance between cost and flexibility</li>
                              <li>Requires monitoring of overflow costs</li>
                              <li>Good for growing applications</li>
                            </>
                          )}
                          {calculations.recommendation === 'Full PTU Reservation' && (
                            <>
                              <li>Significant upfront commitment required</li>
                              <li>Best for stable, predictable workloads</li>
                              <li>Maximum cost savings potential</li>
                            </>
                          )}
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
                        <div className="text-2xl font-bold text-green-600">
                          ${calculations.recommendation === 'PAYGO' ? (calculations.monthlyPaygoCost?.toFixed(2) || '0.00') : 
                            calculations.recommendation === 'Full PTU Reservation' ? (calculations.monthlyPtuReservationCost?.toFixed(2) || '0.00') :
                            (calculations.hybridTotalCost?.toFixed(2) || '0.00')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">PTU Utilization</div>
                        <div className="text-2xl font-bold text-orange-600">{((calculations.utilizationRate || 0) * 100).toFixed(1)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Monthly Savings</div>
                        <div className="text-2xl font-bold text-purple-600">${calculations.monthlySavings?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Interactive Analytics Dashboard with dynamic data - Updated */}
            {showInteractiveCharts && (
              <div className="interactive-charts-section">
                <InteractiveCharts
                costData={{
                  paygo: calculations.monthlyPaygoCost || 100,
                  ptuHourly: calculations.monthlyPtuHourlyCost || 80,
                  ptuMonthly: calculations.monthlyPtuReservationCost || 60,
                  ptuYearly: (calculations.yearlyPtuReservationCost / 12) || 50,
                  savings: calculations.monthlySavings || 20
                }}
                utilizationData={{
                  utilization: calculations.utilizationRate || 75,
                  burstRatio: calculations.burstRatio || 2.5,
                  peakRatio: calculations.peakRatio || 4.0
                }}
                projectionData={{
                  monthly: calculations.monthlyPaygoCost || 100,
                  yearly: (calculations.monthlyPaygoCost * 12) || 1200,
                  burstFrequency: calculations.burstFrequency || 3.2,
                  peakEfficiency: calculations.peakEfficiency || 85
                }}
                burstData={{
                  pattern: calculations.usagePattern || 'Moderate',
                  efficiency: calculations.utilizationRate || 75
                }}
                calculations={Object.keys(calculations).length ? calculations : {
                  recommendation: 'PTU',
                  utilizationRate: 75,
                  burstRatio: 2.5,
                  peakRatio: 4.0,
                  burstFrequency: 3.2
                }}
                selectedModel={selectedModel}
                selectedRegion={selectedRegion}
              />
              </div>
            )}
          </>
        )}

        {/* TASK 2: Official Pricing Transparency Section */}
        {formData.avgTPM > 0 && currentPricing?.officialPricing && (
          <Card className="border-indigo-200 bg-indigo-50 mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-indigo-800">Official PTU Pricing Transparency</CardTitle>
              </div>
              <CardDescription className="text-indigo-700">
                Aligned with Microsoft's official US$1/PTU-hour base rate with accurate regional and deployment multipliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Base Rate Structure */}
                <div className="space-y-3">
                  <h4 className="font-medium text-indigo-800 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Base Rate Structure
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Official Base:</strong> US$1.00/PTU-hour
                    </div>
                    <div>
                      <strong>Your Region:</strong> {selectedRegion.toUpperCase()} 
                      <span className="text-indigo-600"> ({currentPricing.officialPricing?.multipliers?.regional || 1}x)</span>
                    </div>
                    <div>
                      <strong>Deployment:</strong> {selectedDeployment} 
                      <span className="text-indigo-600"> ({currentPricing.officialPricing?.multipliers?.deployment || 1}x)</span>
                    </div>
                    <div className="pt-2 border-t border-indigo-200">
                      <strong>Your Rate:</strong> ${currentPricing.ptu_hourly}/PTU-hour
                    </div>
                  </div>
                </div>

                {/* Discount Structure */}
                <div className="space-y-3">
                  <h4 className="font-medium text-indigo-800 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Official Discounts
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Monthly:</strong> No discount (base rate)
                      <div className="text-xs text-indigo-600">${currentPricing.ptu_monthly}/PTU (730 hrs)</div>
                    </div>
                    <div>
                      <strong>Yearly:</strong> {currentPricing.officialPricing?.discount?.yearlyVsMonthly || 30}% discount
                      <div className="text-xs text-indigo-600">${currentPricing.ptu_yearly}/PTU annually</div>
                    </div>
                    <div className="pt-2 border-t border-indigo-200">
                      <strong>Annual Savings:</strong> ${((currentPricing.ptu_monthly * 12) - currentPricing.ptu_yearly).toFixed(0)}/PTU
                    </div>
                  </div>
                </div>

                {/* Calculation Transparency */}
                <div className="space-y-3">
                  <h4 className="font-medium text-indigo-800 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Your Calculations
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Required PTUs:</strong> {calculations.ptuNeeded || 0}
                    </div>
                    <div>
                      <strong>Monthly Cost:</strong> ${(calculations.ptuNeeded * currentPricing.ptu_monthly).toLocaleString()}
                    </div>
                    <div>
                      <strong>Yearly Cost:</strong> ${(calculations.ptuNeeded * currentPricing.ptu_yearly).toLocaleString()}
                    </div>
                    <div className="pt-2 border-t border-indigo-200">
                      <strong>Annual Savings:</strong> ${((calculations.ptuNeeded * currentPricing.ptu_monthly * 12) - (calculations.ptuNeeded * currentPricing.ptu_yearly)).toLocaleString()}
                      <div className="text-xs text-green-600">
                        {currentPricing.officialPricing?.discount?.yearlyVsHourly || 30}% saved with yearly commitment
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-indigo-600 mt-0.5" />
                  <div className="text-sm text-indigo-800">
                    <strong>Pricing Accuracy:</strong> This calculator now uses Microsoft's official PTU pricing structure with accurate regional multipliers and the standard 30% yearly discount. All calculations are aligned with Azure's official pricing model.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    🔢 PTU Conversion Rate
                  </h4>
                  <p className="text-sm text-purple-700">
                    Each PTU represents a unit of provisioned throughput capacity. The actual tokens/minute varies by model - for example, GPT-4 provides different throughput than GPT-3.5-Turbo per PTU based on model complexity and resource requirements.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    ⚖️ Base PTUs for Spillover Model
                  </h4>
                  <p className="text-sm text-purple-700">
                    Reserve a fixed number of PTUs (e.g., 2 PTUs = 100k tokens/min guaranteed) for your baseline usage, with automatic PAYGO billing when demand exceeds reserved capacity.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    🎯 Spillover Strategy Benefits
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

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f8f8', borderRadius: '8px', color: '#333', fontSize: '0.95rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <strong>Disclaimer:</strong> The information provided on this website is for informational purposes only. While we strive for accuracy, no guarantee is made regarding the completeness or correctness of the data. Microsoft and the site operators are not responsible for any errors, omissions, or decisions made based on this information. Users should verify all information independently before making any decisions.
          <a
            href="https://github.com/ricmmartins/azureptucalc"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg border border-gray-700 transition-colors duration-150"
            style={{ textDecoration: 'none' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.289-1.552 3.295-1.23 3.295-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z"/></svg>
            GitHub Repo
          </a>
        </div>
        
        {/* Mobile Action Buttons */}
        {/* Mobile optimization disabled while useMobileDetection is not available */}
        {false && (
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

      {/* Onboarding Components */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        onStartTour={handleStartTour}
      />
      
      <GuidedTour
        isActive={showGuidedTour}
        onComplete={handleCompleteTour}
        onSkip={handleSkipTour}
        onPopulateSampleData={populateSampleData}
      />
    </div>
  );
}

export default App;

