// Region-Specific Model Availability and Deployment Patterns
// Comprehensive mapping of Azure OpenAI model availability across regions and deployment types

export const REGION_MODEL_AVAILABILITY = {
  // North America
  'eastus': {
    name: 'East US',
    displayName: 'East US',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-large': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },
  'eastus2': {
    name: 'East US 2',
    displayName: 'East US 2',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-large': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },
  'westus': {
    name: 'West US',
    displayName: 'West US',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },
  'westus2': {
    name: 'West US 2',
    displayName: 'West US 2',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-large': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },
  'northcentralus': {
    name: 'North Central US',
    displayName: 'North Central US',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },
  'southcentralus': {
    name: 'South Central US',
    displayName: 'South Central US',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-large': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },
  'canadacentral': {
    name: 'Canada Central',
    displayName: 'Canada Central',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'CA',
    pricing_tier: 'premium'
  },

  // Europe
  'westeurope': {
    name: 'West Europe',
    displayName: 'West Europe',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-large': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'EU',
    pricing_tier: 'standard'
  },
  'northeurope': {
    name: 'North Europe',
    displayName: 'North Europe',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'low' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-3-small': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'EU',
    pricing_tier: 'standard'
  },
  'uksouth': {
    name: 'UK South',
    displayName: 'UK South',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'EU',
    pricing_tier: 'premium'
  },
  'francecentral': {
    name: 'France Central',
    displayName: 'France Central',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'EU',
    pricing_tier: 'premium'
  },
  'swedencentral': {
    name: 'Sweden Central',
    displayName: 'Sweden Central',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-4': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'EU',
    pricing_tier: 'premium'
  },

  // Asia Pacific
  'eastasia': {
    name: 'East Asia',
    displayName: 'East Asia',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'APAC',
    pricing_tier: 'premium'
  },
  'southeastasia': {
    name: 'Southeast Asia',
    displayName: 'Southeast Asia',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'APAC',
    pricing_tier: 'standard'
  },
  'japaneast': {
    name: 'Japan East',
    displayName: 'Japan East',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'APAC',
    pricing_tier: 'premium'
  },
  'australiaeast': {
    name: 'Australia East',
    displayName: 'Australia East',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'APAC',
    pricing_tier: 'premium'
  },

  // Additional North America
  'westus3': {
    name: 'West US 3',
    displayName: 'West US 3',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },
  'centralus': {
    name: 'Central US',
    displayName: 'Central US', 
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'US',
    pricing_tier: 'standard'
  },

  // South America
  'brazilsouth': {
    name: 'Brazil South',
    displayName: 'Brazil South',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'LATAM',
    pricing_tier: 'premium'
  },

  // Additional Europe
  'switzerlandnorth': {
    name: 'Switzerland North',
    displayName: 'Switzerland North',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'EU',
    pricing_tier: 'premium'
  },
  'norwayeast': {
    name: 'Norway East',
    displayName: 'Norway East',
    available_deployments: ['global', 'dataZone', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'dataZone', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'dataZone', 'regional'], capacity: 'high' }
    },
    zone: 'EU',
    pricing_tier: 'premium'
  },

  // Middle East
  'uaenorth': {
    name: 'UAE North',
    displayName: 'UAE North',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'ME',
    pricing_tier: 'premium'
  },

  // Additional APAC
  'koreacentral': {
    name: 'Korea Central',
    displayName: 'Korea Central',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'APAC',
    pricing_tier: 'premium'
  },
  'australiasoutheast': {
    name: 'Australia Southeast',
    displayName: 'Australia Southeast',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'APAC',
    pricing_tier: 'premium'
  },
  'southindia': {
    name: 'South India',
    displayName: 'South India',
    available_deployments: ['global', 'regional'],
    available_models: {
      'gpt-4o': { deployments: ['global', 'regional'], capacity: 'medium' },
      'gpt-4o-mini': { deployments: ['global', 'regional'], capacity: 'high' },
      'gpt-35-turbo': { deployments: ['global', 'regional'], capacity: 'high' },
      'text-embedding-ada-002': { deployments: ['global', 'regional'], capacity: 'high' }
    },
    zone: 'APAC',
    pricing_tier: 'standard'
  }
};

// Helper functions for region-specific model availability
export const getRegionInfo = (regionCode) => {
  return REGION_MODEL_AVAILABILITY[regionCode] || null;
};

export const getAvailableModelsForRegion = (regionCode) => {
  const regionInfo = getRegionInfo(regionCode);
  if (!regionInfo) return [];
  
  return Object.keys(regionInfo.available_models);
};

export const getAvailableDeploymentsForRegionModel = (regionCode, modelId) => {
  const regionInfo = getRegionInfo(regionCode);
  if (!regionInfo || !regionInfo.available_models[modelId]) return [];
  
  return regionInfo.available_models[modelId].deployments;
};

export const getModelCapacityInRegion = (regionCode, modelId) => {
  const regionInfo = getRegionInfo(regionCode);
  if (!regionInfo || !regionInfo.available_models[modelId]) return 'unknown';
  
  return regionInfo.available_models[modelId].capacity;
};

export const isModelAvailableInRegion = (regionCode, modelId, deploymentType = null) => {
  const regionInfo = getRegionInfo(regionCode);
  if (!regionInfo) return false;
  
  const modelInfo = regionInfo.available_models[modelId];
  if (!modelInfo) return false;
  
  if (deploymentType) {
    return modelInfo.deployments.includes(deploymentType);
  }
  
  return true;
};

export const getRegionsByZone = () => {
  const zones = {};
  Object.entries(REGION_MODEL_AVAILABILITY).forEach(([regionCode, regionInfo]) => {
    const zone = regionInfo.zone;
    if (!zones[zone]) zones[zone] = [];
    zones[zone].push({ code: regionCode, ...regionInfo });
  });
  return zones;
};

export const getRegionsWithModel = (modelId) => {
  return Object.entries(REGION_MODEL_AVAILABILITY)
    .filter(([_, regionInfo]) => regionInfo.available_models[modelId])
    .map(([regionCode, regionInfo]) => ({
      code: regionCode,
      name: regionInfo.displayName,
      capacity: regionInfo.available_models[modelId].capacity,
      deployments: regionInfo.available_models[modelId].deployments
    }));
};

export const getDeploymentRecommendation = (regionCode, modelId, usagePattern = 'steady') => {
  const regionInfo = getRegionInfo(regionCode);
  if (!regionInfo || !regionInfo.available_models[modelId]) {
    return { recommended: 'global', reason: 'Region or model not found' };
  }
  
  const modelInfo = regionInfo.available_models[modelId];
  const availableDeployments = modelInfo.deployments;
  const capacity = modelInfo.capacity;
  
  // Recommendation logic based on usage pattern and capacity
  if (usagePattern === 'high-volume' && capacity === 'high' && availableDeployments.includes('regional')) {
    return { 
      recommended: 'regional', 
      reason: 'High capacity available for high-volume usage in this region',
      alternatives: availableDeployments.filter(d => d !== 'regional')
    };
  }
  
  if (usagePattern === 'burst' && availableDeployments.includes('global')) {
    return { 
      recommended: 'global', 
      reason: 'Global deployment provides best burst handling across regions',
      alternatives: availableDeployments.filter(d => d !== 'global')
    };
  }
  
  if (regionInfo.zone === 'EU' && availableDeployments.includes('dataZone')) {
    return { 
      recommended: 'dataZone', 
      reason: 'Data Zone deployment ensures EU data residency compliance',
      alternatives: availableDeployments.filter(d => d !== 'dataZone')
    };
  }
  
  // Default recommendation
  const defaultOrder = ['regional', 'dataZone', 'global'];
  const recommended = defaultOrder.find(d => availableDeployments.includes(d)) || availableDeployments[0];
  
  return {
    recommended,
    reason: `Best balance of performance and cost for ${usagePattern} usage`,
    alternatives: availableDeployments.filter(d => d !== recommended)
  };
};
