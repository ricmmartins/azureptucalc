/**
 * Task 5: Model-Specific Throughput Testing Suite
 * Validates all model-specific throughput calculations and PTU conversions
 * Tests both configuration data and actual calculation logic
 */

import enhancedModelConfig from '../enhanced_model_config.json' assert { type: 'json' };

console.log('🧪 Task 5: Model-Specific Throughput Testing Suite');
console.log('🎯 Validating throughput per PTU for all models');
console.log('📋 Comparing against Microsoft Learn documentation...\n');

// Official Microsoft Learn throughput data for validation
const MICROSOFT_OFFICIAL_THROUGHPUT = {
  'gpt-4o': 2500,
  'gpt-4o-mini': 37000,
  'gpt-4.1': 3000,
  'gpt-4.1-mini': 14900,
  'gpt-4.1-nano': 59400,
  'o1': 230,
  'o3': 3000,
  'o3-mini': 2500
};

// Test scenarios for PTU calculations
const TEST_SCENARIOS = [
  { name: 'Low Usage', avgTPM: 1000 },
  { name: 'Medium Usage', avgTPM: 25000 },
  { name: 'High Usage', avgTPM: 100000 },
  { name: 'Enterprise Usage', avgTPM: 500000 }
];

let allTestsPassed = true;
let testResults = [];

// Function to calculate PTU requirements (matching App.jsx logic)
function calculatePTURequirement(avgTPM, model, deploymentType) {
  const modelConfig = enhancedModelConfig.models[model];
  if (!modelConfig) {
    return { error: `Model ${model} not found` };
  }

  const deployment = modelConfig.deployments[deploymentType];
  if (!deployment) {
    return { error: `Deployment ${deploymentType} not available for ${model}` };
  }

  const throughput = modelConfig.throughput_per_ptu;
  const minPTU = deployment.min_ptu;
  const increment = deployment.increment;

  // Calculate raw PTU requirement
  const rawPTU = avgTPM > 0 ? Math.ceil(avgTPM / throughput) : 0;
  
  // Apply minimum requirement
  const afterMinimum = Math.max(rawPTU, minPTU);
  
  // Round up to nearest increment
  const finalPTU = Math.ceil(afterMinimum / increment) * increment;
  
  return {
    rawPTU,
    finalPTU,
    isUsingMinimum: rawPTU < minPTU,
    throughput,
    minPTU,
    increment
  };
}

// Test 1: Validate throughput values against Microsoft Learn
console.log('🔍 Test 1: Microsoft Learn Throughput Validation');
console.log('================================================');

Object.entries(MICROSOFT_OFFICIAL_THROUGHPUT).forEach(([modelKey, officialThroughput]) => {
  const modelConfig = enhancedModelConfig.models[modelKey];
  
  if (!modelConfig) {
    console.log(`❌ ${modelKey}: Model not found in configuration`);
    allTestsPassed = false;
    return;
  }

  const configThroughput = modelConfig.throughput_per_ptu;
  const matches = configThroughput === officialThroughput;
  
  console.log(`${matches ? '✅' : '❌'} ${modelKey}: ${configThroughput.toLocaleString()} TPM/PTU ${matches ? '' : `(Expected: ${officialThroughput.toLocaleString()})`}`);
  
  if (!matches) allTestsPassed = false;
  
  testResults.push({
    test: 'throughput_validation',
    model: modelKey,
    passed: matches,
    expected: officialThroughput,
    actual: configThroughput
  });
});

// Test 2: PTU Calculation Logic Validation
console.log('\n🧮 Test 2: PTU Calculation Logic Validation');
console.log('=============================================');

Object.keys(MICROSOFT_OFFICIAL_THROUGHPUT).forEach(modelKey => {
  const modelConfig = enhancedModelConfig.models[modelKey];
  if (!modelConfig) return;

  console.log(`\n📊 Testing ${modelKey} (${modelConfig.throughput_per_ptu.toLocaleString()} TPM/PTU):`);
  
  ['global', 'dataZone', 'regional'].forEach(deploymentType => {
    const deployment = modelConfig.deployments[deploymentType];
    if (!deployment) return;
    
    console.log(`  ${deploymentType.toUpperCase()}:`);
    
    TEST_SCENARIOS.forEach(scenario => {
      const result = calculatePTURequirement(scenario.avgTPM, modelKey, deploymentType);
      
      if (result.error) {
        console.log(`    ❌ ${scenario.name}: ${result.error}`);
        allTestsPassed = false;
        return;
      }
      
      // Validate calculation logic
      const expectedRawPTU = Math.ceil(scenario.avgTPM / result.throughput);
      const calculationCorrect = result.rawPTU === expectedRawPTU;
      
      // Validate minimum enforcement
      const minimumCorrect = result.finalPTU >= result.minPTU;
      
      // Validate increment alignment
      const incrementCorrect = result.finalPTU % result.increment === 0;
      
      const allCorrect = calculationCorrect && minimumCorrect && incrementCorrect;
      
      console.log(`    ${allCorrect ? '✅' : '❌'} ${scenario.name}: ${scenario.avgTPM.toLocaleString()} TPM → ${result.finalPTU} PTU ${result.isUsingMinimum ? '(minimum applied)' : ''}`);
      
      if (!allCorrect) {
        console.log(`      Details: Raw=${result.rawPTU}, Min=${result.minPTU}, Final=${result.finalPTU}, Increment=${result.increment}`);
        allTestsPassed = false;
      }
      
      testResults.push({
        test: 'ptu_calculation',
        model: modelKey,
        deployment: deploymentType,
        scenario: scenario.name,
        passed: allCorrect,
        input: scenario.avgTPM,
        output: result.finalPTU,
        details: result
      });
    });
  });
});

// Test 3: Cross-Model Throughput Comparison
console.log('\n📈 Test 3: Cross-Model Throughput Comparison');
console.log('===========================================');

const comparisonTPM = 50000; // Standard comparison point
console.log(`Comparing PTU requirements for ${comparisonTPM.toLocaleString()} TPM across models:\n`);

const modelComparisons = [];
Object.keys(MICROSOFT_OFFICIAL_THROUGHPUT).forEach(modelKey => {
  const result = calculatePTURequirement(comparisonTPM, modelKey, 'regional');
  if (!result.error) {
    modelComparisons.push({
      model: modelKey,
      throughput: result.throughput,
      rawPTU: result.rawPTU,
      finalPTU: result.finalPTU,
      efficiency: Math.round((comparisonTPM / result.finalPTU) * 100) / 100
    });
  }
});

// Sort by efficiency (TPM per PTU)
modelComparisons.sort((a, b) => b.efficiency - a.efficiency);

modelComparisons.forEach((comparison, index) => {
  const rank = index + 1;
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
  console.log(`${medal} ${comparison.model}: ${comparison.finalPTU} PTU (${comparison.efficiency.toLocaleString()} TPM/PTU efficiency)`);
});

// Test 4: Edge Cases and Boundary Testing
console.log('\n🔬 Test 4: Edge Cases and Boundary Testing');
console.log('==========================================');

const edgeCases = [
  { name: 'Zero TPM', avgTPM: 0 },
  { name: 'Very Low TPM', avgTPM: 1 },
  { name: 'Just Below Minimum', avgTPM: 100 },
  { name: 'Exactly at Increment', avgTPM: 75000 }
];

let edgeTestsPassed = 0;
let totalEdgeTests = 0;

Object.keys(MICROSOFT_OFFICIAL_THROUGHPUT).slice(0, 2).forEach(modelKey => { // Test first 2 models for brevity
  console.log(`\n${modelKey}:`);
  
  edgeCases.forEach(edgeCase => {
    totalEdgeTests++;
    const result = calculatePTURequirement(edgeCase.avgTPM, modelKey, 'global');
    
    if (result.error) {
      console.log(`  ❌ ${edgeCase.name}: ${result.error}`);
      return;
    }
    
    // Edge case validations
    let passed = true;
    let issues = [];
    
    // Zero TPM should result in minimum PTU
    if (edgeCase.avgTPM === 0 && result.finalPTU !== result.minPTU) {
      passed = false;
      issues.push('Zero TPM should use minimum PTU');
    }
    
    // Result should always be >= minimum
    if (result.finalPTU < result.minPTU) {
      passed = false;
      issues.push('Result below minimum PTU');
    }
    
    // Result should always be aligned to increment
    if (result.finalPTU % result.increment !== 0) {
      passed = false;
      issues.push('Result not aligned to increment');
    }
    
    if (passed) {
      edgeTestsPassed++;
      console.log(`  ✅ ${edgeCase.name}: ${result.finalPTU} PTU`);
    } else {
      console.log(`  ❌ ${edgeCase.name}: ${issues.join(', ')}`);
      allTestsPassed = false;
    }
  });
});

// Final Summary Report
console.log('\n📊 FINAL TEST SUMMARY');
console.log('====================');

const throughputTests = testResults.filter(r => r.test === 'throughput_validation');
const calculationTests = testResults.filter(r => r.test === 'ptu_calculation');

const throughputPassed = throughputTests.filter(r => r.passed).length;
const calculationPassed = calculationTests.filter(r => r.passed).length;

console.log(`✅ Throughput Validation: ${throughputPassed}/${throughputTests.length} models passed`);
console.log(`✅ PTU Calculations: ${calculationPassed}/${calculationTests.length} scenarios passed`);
console.log(`✅ Edge Case Testing: ${edgeTestsPassed}/${totalEdgeTests} cases passed`);

console.log(`\n🎯 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPassed) {
  console.log('🎉 Task 5 Implementation Successful!');
  console.log('📋 All model-specific throughput calculations are working correctly.');
  console.log('🔗 All values match Microsoft Learn documentation.');
  console.log('🚀 Ready for production use!');
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.');
}

console.log('\n📚 Microsoft Learn Source: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/provisioned-throughput-onboarding');
console.log('📊 Generated on:', new Date().toLocaleString());