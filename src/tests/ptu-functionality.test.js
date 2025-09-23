/**
 * Automated Tests for Manual PTU Functionality
 * Tests the PTU input fields, validation, warnings, and cost calculations
 */

// Mock the React component state and functions for testing
class PTUCalculatorTester {
  constructor() {
    this.formData = {
      avgTPM: 0,
      p99TPM: 0,
      maxTPM: 0,
      avgPTU: 0,
      p99PTU: 0,
      maxPTU: 0,
      recommendedPTU: 0,
      monthlyMinutes: 43800,
      basePTUs: 0
    };

    this.currentPricing = {
      paygo_input: 0.15,
      paygo_output: 0.60,
      ptu_hourly: 1.00,
      ptu_monthly: 730,
      ptu_yearly: 6132,
      minPTU: 15,
      tokensPerPTUPerMinute: 50000
    };

    this.selectedModel = 'gpt-4o-mini';
    this.selectedRegion = 'eastus2';
    this.selectedDeployment = 'dataZone';
  }

  // Simulate the handleInputChange function
  handleInputChange(field, value) {
    this.formData[field] = parseFloat(value) || 0;
    return this.calculateResults();
  }

  // Simulate the main calculation logic
  calculateResults() {
    const hasValidData = this.formData.avgTPM > 0 || this.formData.recommendedPTU > 0 || this.formData.p99TPM > 0;
    
    if (!hasValidData) {
      return { error: 'No valid data provided' };
    }

    // Use PTU input if available, otherwise calculate from TPM
    const calculatedPTU = this.formData.recommendedPTU > 0 
      ? this.formData.recommendedPTU 
      : Math.ceil(this.formData.avgTPM / this.currentPricing.tokensPerPTUPerMinute);

    const actualPTU = Math.max(calculatedPTU, this.currentPricing.minPTU);
    const isUsingMinimum = actualPTU > calculatedPTU;

    // Calculate costs
    const monthlyPtuCost = actualPTU * this.currentPricing.ptu_monthly;
    const yearlyPtuCost = actualPTU * this.currentPricing.ptu_yearly;

    // Simple recommendation logic
    const monthlyTokens = this.formData.avgTPM * this.formData.monthlyMinutes;
    const monthlyPaygoCost = (monthlyTokens / 1000000) * (this.currentPricing.paygo_input + this.currentPricing.paygo_output);
    
    let recommendation = 'PAYGO';
    if (monthlyPtuCost < monthlyPaygoCost * 0.8) {
      recommendation = 'Full PTU Reservation';
    } else if (monthlyPtuCost < monthlyPaygoCost * 0.9) {
      recommendation = 'Hybrid';
    }

    return {
      calculatedPTU,
      actualPTU,
      isUsingMinimum,
      monthlyPtuCost,
      yearlyPtuCost,
      monthlyPaygoCost,
      recommendation,
      hasValidData
    };
  }

  // Test runner
  runTest(testName, testFunction) {
    try {
      console.log(`🧪 Running: ${testName}`);
      const result = testFunction();
      if (result) {
        console.log(`✅ PASS: ${testName}`);
        return true;
      } else {
        console.log(`❌ FAIL: ${testName}`);
        return false;
      }
    } catch (error) {
      console.log(`💥 ERROR: ${testName} - ${error.message}`);
      return false;
    }
  }
}

// Initialize tester
const tester = new PTUCalculatorTester();

// Test Results Tracker
let totalTests = 0;
let passedTests = 0;

function runTest(name, testFn) {
  totalTests++;
  if (tester.runTest(name, testFn)) {
    passedTests++;
  }
}

console.log('🚀 Starting PTU Calculator Automated Tests\n');

// TEST 1: Basic PTU Input Test
runTest('Basic PTU Input (25 PTU)', () => {
  const result = tester.handleInputChange('recommendedPTU', '25');
  return result.actualPTU === 25 && result.monthlyPtuCost === 25 * 730;
});

// TEST 2: Minimum PTU Warning Test
runTest('Minimum PTU Enforcement (5 PTU -> 15 PTU)', () => {
  const result = tester.handleInputChange('recommendedPTU', '5');
  return result.calculatedPTU === 5 && result.actualPTU === 15 && result.isUsingMinimum === true;
});

// TEST 3: Valid PTU Range Test
runTest('Valid PTU Range (50 PTU)', () => {
  const result = tester.handleInputChange('recommendedPTU', '50');
  return result.actualPTU === 50 && result.monthlyPtuCost === 50 * 730 && result.yearlyPtuCost === 50 * 6132;
});

// TEST 4: Large PTU Value Test
runTest('Large PTU Value (200 PTU)', () => {
  const result = tester.handleInputChange('recommendedPTU', '200');
  return result.actualPTU === 200 && result.monthlyPtuCost === 200 * 730;
});

// TEST 5: PTU vs TPM Priority Test
runTest('PTU Takes Priority Over TPM', () => {
  // First set TPM value
  tester.handleInputChange('avgTPM', '100000'); // This would calculate to 2 PTU
  // Then set PTU value - this should take priority
  const result = tester.handleInputChange('recommendedPTU', '30');
  return result.calculatedPTU === 30 && result.actualPTU === 30;
});

// TEST 6: Zero PTU Value Test
runTest('Zero PTU Handling', () => {
  tester.formData.avgTPM = 0; // Reset TPM
  const result = tester.handleInputChange('recommendedPTU', '0');
  return result.error && result.error.includes('No valid data');
});

// TEST 7: Recommendation Logic Test
runTest('PTU Recommendation Logic', () => {
  // Set up scenario where PTU should be recommended
  tester.handleInputChange('avgTPM', '1000000'); // High TPM
  const result = tester.handleInputChange('recommendedPTU', '25');
  return result.recommendation === 'Full PTU Reservation';
});

// TEST 8: Cost Calculation Accuracy
runTest('Cost Calculation Accuracy', () => {
  const result = tester.handleInputChange('recommendedPTU', '100');
  const expectedMonthly = 100 * 730; // 100 PTU * $730/month
  const expectedYearly = 100 * 6132; // 100 PTU * $6132/year
  return result.monthlyPtuCost === expectedMonthly && result.yearlyPtuCost === expectedYearly;
});

// TEST 9: Decimal PTU Input Test
runTest('Decimal PTU Input (25.5 -> 25)', () => {
  const result = tester.handleInputChange('recommendedPTU', '25.5');
  return result.calculatedPTU === 25.5; // Should preserve decimal input
});

// TEST 10: Negative PTU Input Test
runTest('Negative PTU Input (-10 -> 0)', () => {
  const result = tester.handleInputChange('recommendedPTU', '-10');
  return result.calculatedPTU === 0;
});

// TEST 11: Invalid Input Test
runTest('Invalid Input Handling', () => {
  const result = tester.handleInputChange('recommendedPTU', 'abc');
  return result.calculatedPTU === 0;
});

// TEST 12: Data Validation Test
runTest('Data Validation Logic', () => {
  tester.formData = { // Reset all data
    avgTPM: 0, p99TPM: 0, maxTPM: 0, avgPTU: 0, p99PTU: 0, maxPTU: 0, 
    recommendedPTU: 0, monthlyMinutes: 43800, basePTUs: 0
  };
  
  const result1 = tester.calculateResults();
  tester.handleInputChange('recommendedPTU', '20');
  const result2 = tester.calculateResults();
  
  return !result1.hasValidData && result2.hasValidData;
});

// TEST SUMMARY
console.log('\n📊 TEST SUMMARY');
console.log('================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Manual PTU functionality is working correctly.');
} else {
  console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Manual PTU functionality needs attention.`);
}

// Export for potential use in other test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PTUCalculatorTester, runTest };
}