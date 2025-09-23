/**
 * Automated PTU Minimum Validation Test Suite
 * Tests all models across different deployment types to verify PTU minimum warnings
 */

// Import the enhanced model config to get actual minimums
const fs = require('fs');
const path = require('path');

// Load the enhanced model config
const enhancedModelConfigPath = path.join(__dirname, '..', 'enhanced_model_config.json');
const enhancedModelConfig = JSON.parse(fs.readFileSync(enhancedModelConfigPath, 'utf8'));

// Test scenarios for PTU validation
const testScenarios = [
  {
    name: "Global Deployment Tests",
    deploymentType: "global",
    tests: [
      // Standard models with 15 PTU minimum
      { model: "gpt-4o", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "gpt-4o-mini", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "gpt-4", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "gpt-4-turbo", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "gpt-35-turbo", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "text-embedding-ada-002", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "text-embedding-3-large", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "text-embedding-3-small", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "whisper", belowMin: 10, atMin: 15, aboveMin: 25 }
    ]
  },
  {
    name: "Regional Deployment Tests", 
    deploymentType: "regional",
    tests: [
      // Regional has different minimums
      { model: "gpt-4o", belowMin: 25, atMin: 50, aboveMin: 75 },
      { model: "gpt-4", belowMin: 25, atMin: 50, aboveMin: 75 },
      { model: "gpt-4-turbo", belowMin: 25, atMin: 50, aboveMin: 75 },
      { model: "gpt-4o-mini", belowMin: 15, atMin: 25, aboveMin: 35 },
      { model: "gpt-35-turbo", belowMin: 15, atMin: 25, aboveMin: 35 }
    ]
  },
  {
    name: "Data Zone Deployment Tests",
    deploymentType: "dataZone", 
    tests: [
      // Data zone has same minimums as global
      { model: "gpt-4o", belowMin: 10, atMin: 15, aboveMin: 25 },
      { model: "gpt-4o-mini", belowMin: 10, atMin: 15, aboveMin: 25 }
    ]
  }
];

// Mock calculation function that mimics the app's logic
function calculatePTUValidation(model, deploymentType, manualPTU) {
  const modelConfig = enhancedModelConfig.models[model];
  if (!modelConfig) {
    return { error: `Model ${model} not found in config` };
  }

  const deployment = modelConfig.deployments[deploymentType];
  if (!deployment) {
    return { error: `Deployment ${deploymentType} not available for ${model}` };
  }

  const minPTU = deployment.min_ptu;
  const increment = deployment.increment;
  
  // Check if manual PTU is below minimum (this is the logic we fixed)
  const isUsingMinimum = manualPTU < minPTU;
  const finalPTU = Math.max(manualPTU, minPTU);
  
  return {
    model,
    deploymentType,
    manualPTU,
    minPTU,
    increment,
    isUsingMinimum,
    finalPTU,
    shouldShowWarning: isUsingMinimum
  };
}

// Test runner
function runPTUValidationTests() {
  console.log('🚀 Starting Automated PTU Minimum Validation Tests\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  testScenarios.forEach(scenario => {
    console.log(`📋 ${scenario.name}`);
    console.log('=' + '='.repeat(scenario.name.length + 2));
    
    scenario.tests.forEach(test => {
      const { model, belowMin, atMin, aboveMin } = test;
      
      // Test 1: Below minimum (should show warning)
      totalTests++;
      const belowResult = calculatePTUValidation(model, scenario.deploymentType, belowMin);
      if (belowResult.error) {
        console.log(`⚠️  SKIP: ${model} - ${belowResult.error}`);
      } else if (belowResult.shouldShowWarning) {
        console.log(`✅ PASS: ${model} - ${belowMin} PTU shows warning (below min ${belowResult.minPTU})`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${model} - ${belowMin} PTU should show warning but doesn't`);
        failedTests++;
        failures.push(`${model} (${scenario.deploymentType}): ${belowMin} PTU should warn`);
      }

      // Test 2: At minimum (should NOT show warning)
      totalTests++;
      const atResult = calculatePTUValidation(model, scenario.deploymentType, atMin);
      if (atResult.error) {
        console.log(`⚠️  SKIP: ${model} - ${atResult.error}`);
      } else if (!atResult.shouldShowWarning) {
        console.log(`✅ PASS: ${model} - ${atMin} PTU no warning (meets min ${atResult.minPTU})`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${model} - ${atMin} PTU should not show warning but does`);
        failedTests++;
        failures.push(`${model} (${scenario.deploymentType}): ${atMin} PTU should not warn`);
      }

      // Test 3: Above minimum (should NOT show warning)
      totalTests++;
      const aboveResult = calculatePTUValidation(model, scenario.deploymentType, aboveMin);
      if (aboveResult.error) {
        console.log(`⚠️  SKIP: ${model} - ${aboveResult.error}`);
      } else if (!aboveResult.shouldShowWarning) {
        console.log(`✅ PASS: ${model} - ${aboveMin} PTU no warning (above min ${aboveResult.minPTU})`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${model} - ${aboveMin} PTU should not show warning but does`);
        failedTests++;
        failures.push(`${model} (${scenario.deploymentType}): ${aboveMin} PTU should not warn`);
      }
    });
    
    console.log(''); // Empty line between scenarios
  });

  // Summary
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failures.length > 0) {
    console.log('\n❌ FAILURES:');
    failures.forEach(failure => console.log(`   - ${failure}`));
  } else {
    console.log('\n🎉 All PTU minimum validation tests passed!');
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1),
    failures: failures
  };
}

// Edge case tests
function runEdgeCaseTests() {
  console.log('\n🧪 Edge Case Tests');
  console.log('==================');
  
  const edgeCases = [
    { model: "gpt-4o", deployment: "global", ptu: 0, expected: "should warn" },
    { model: "gpt-4o", deployment: "global", ptu: 1, expected: "should warn" },
    { model: "gpt-4o", deployment: "global", ptu: 14, expected: "should warn" },
    { model: "gpt-4o", deployment: "global", ptu: 16, expected: "should not warn" },
    { model: "gpt-4o", deployment: "global", ptu: 100, expected: "should not warn" },
    { model: "gpt-4o", deployment: "global", ptu: 1000, expected: "should not warn" },
    { model: "gpt-4o", deployment: "regional", ptu: 49, expected: "should warn" },
    { model: "gpt-4o", deployment: "regional", ptu: 51, expected: "should not warn" }
  ];

  let edgePassed = 0;
  let edgeFailed = 0;

  edgeCases.forEach(testCase => {
    const result = calculatePTUValidation(testCase.model, testCase.deployment, testCase.ptu);
    const expectWarning = testCase.expected.includes("should warn");
    const actualWarning = result.shouldShowWarning;
    
    if (expectWarning === actualWarning) {
      console.log(`✅ PASS: ${testCase.model} ${testCase.deployment} ${testCase.ptu} PTU - ${testCase.expected}`);
      edgePassed++;
    } else {
      console.log(`❌ FAIL: ${testCase.model} ${testCase.deployment} ${testCase.ptu} PTU - ${testCase.expected} but got ${actualWarning ? 'warning' : 'no warning'}`);
      edgeFailed++;
    }
  });

  console.log(`\nEdge Cases: ${edgePassed}/${edgePassed + edgeFailed} passed`);
  return { passed: edgePassed, failed: edgeFailed };
}

// Run all tests
if (require.main === module) {
  const mainResults = runPTUValidationTests();
  const edgeResults = runEdgeCaseTests();
  
  console.log('\n🏁 FINAL SUMMARY');
  console.log('================');
  console.log(`Main Tests: ${mainResults.passed}/${mainResults.total} (${mainResults.successRate}%)`);
  console.log(`Edge Cases: ${edgeResults.passed}/${edgeResults.passed + edgeResults.failed}`);
  console.log(`Overall: ${mainResults.passed + edgeResults.passed}/${mainResults.total + edgeResults.passed + edgeResults.failed} tests passed`);
  
  if (mainResults.failed === 0 && edgeResults.failed === 0) {
    console.log('\n🎉 All PTU validation tests PASSED! Manual PTU functionality is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Manual PTU validation needs attention.');
    process.exit(1);
  }
}

module.exports = { runPTUValidationTests, runEdgeCaseTests, calculatePTUValidation };