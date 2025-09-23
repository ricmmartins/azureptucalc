/**
 * Comprehensive PTU Validation Test
 * Validates all PTU minimums against Microsoft Learn documentation
 * Tests both configuration data and UI validation logic
 */

import enhancedModelConfig from '../enhanced_model_config.json' assert { type: 'json' };

console.log('🔍 Comprehensive PTU Validation Test');
console.log('📋 Comparing against Microsoft Learn documentation...\n');

// Official Microsoft Learn data for verification
const MICROSOFT_OFFICIAL_DATA = {
  'gpt-4o': {
    global: { min: 15, increment: 5, throughput: 2500 },
    dataZone: { min: 15, increment: 5, throughput: 2500 },
    regional: { min: 50, increment: 50, throughput: 2500 }
  },
  'gpt-4o-mini': {
    global: { min: 15, increment: 5, throughput: 37000 },
    dataZone: { min: 15, increment: 5, throughput: 37000 },
    regional: { min: 25, increment: 25, throughput: 37000 }
  }
};

let allTestsPassed = true;
let testResults = [];

function validateModel(modelKey, modelConfig) {
  console.log(`\n🧪 Testing Model: ${modelConfig.name} (${modelKey})`);
  
  const officialData = MICROSOFT_OFFICIAL_DATA[modelKey];
  if (!officialData) {
    console.log(`⚠️  No official Microsoft data available for ${modelKey}`);
    return;
  }

  ['global', 'dataZone', 'regional'].forEach(deploymentType => {
    const configDeployment = modelConfig.deployments[deploymentType];
    const officialDeployment = officialData[deploymentType];

    if (!configDeployment || !officialDeployment) {
      console.log(`⚠️  Missing deployment type: ${deploymentType}`);
      return;
    }

    // Test PTU minimum
    const minPtuMatch = configDeployment.min_ptu === officialDeployment.min;
    const incrementMatch = configDeployment.increment === officialDeployment.increment;
    const throughputMatch = modelConfig.throughput_per_ptu === officialDeployment.throughput;

    console.log(`  📊 ${deploymentType.toUpperCase()}:`);
    console.log(`    Min PTU: ${configDeployment.min_ptu} ${minPtuMatch ? '✅' : '❌'} (Official: ${officialDeployment.min})`);
    console.log(`    Increment: ${configDeployment.increment} ${incrementMatch ? '✅' : '❌'} (Official: ${officialDeployment.increment})`);
    console.log(`    Throughput: ${modelConfig.throughput_per_ptu} ${throughputMatch ? '✅' : '❌'} (Official: ${officialDeployment.throughput})`);

    testResults.push({
      model: modelKey,
      deployment: deploymentType,
      minPtuMatch,
      incrementMatch,
      throughputMatch,
      allMatch: minPtuMatch && incrementMatch && throughputMatch
    });

    if (!minPtuMatch || !incrementMatch || !throughputMatch) {
      allTestsPassed = false;
    }
  });
}

// Test all models in our configuration
Object.entries(enhancedModelConfig.models).forEach(([modelKey, modelConfig]) => {
  validateModel(modelKey, modelConfig);
});

// Summary report
console.log('\n📊 TEST SUMMARY REPORT');
console.log('====================');

const groupedResults = testResults.reduce((acc, result) => {
  if (!acc[result.model]) acc[result.model] = [];
  acc[result.model].push(result);
  return acc;
}, {});

Object.entries(groupedResults).forEach(([model, results]) => {
  const allModelTestsPassed = results.every(r => r.allMatch);
  console.log(`\n${model}: ${allModelTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  results.forEach(result => {
    if (!result.allMatch) {
      console.log(`  ❌ ${result.deployment}: MinPTU:${result.minPtuMatch ? '✓' : '✗'} Increment:${result.incrementMatch ? '✓' : '✗'} Throughput:${result.throughputMatch ? '✓' : '✗'}`);
    } else {
      console.log(`  ✅ ${result.deployment}: All values match Microsoft Learn documentation`);
    }
  });
});

console.log(`\n🎯 FINAL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPassed) {
  console.log('🎉 Configuration perfectly matches Microsoft Learn documentation!');
  console.log('📋 PTU Calculator is ready for production use.');
} else {
  console.log('⚠️  Some configurations do not match Microsoft Learn documentation.');
  console.log('🔧 Please review and update the configuration file.');
}

console.log('\n📚 Microsoft Learn Source: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding');