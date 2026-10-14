/**
 * Automated CLI Test Suite for Carpool Route-Matching Scenarios
 * Tests S1, S2, S4, S5 scenarios + error handling cases.
 * 
 * Run with: npx tsx test/scenarios.test.ts
 */

import { runAllScenarioTests } from '../src/services/carpoolValidationBackend';

console.log('======================================================================');
console.log('   ZALDI CARPOOL ROUTE-MATCHING & VALIDATION TEST SUITE');
console.log('   Scenarios: S1, S2, S4, S5 + Error Handling');
console.log('======================================================================\n');

const testSuite = runAllScenarioTests();

let testIndex = 1;
for (const result of testSuite.results) {
  const statusIcon = result.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[TEST ${testIndex}] ${statusIcon} - ${result.scenarioName} (${result.durationMs}ms)`);
  console.log(`  Description: ${result.description}`);
  
  for (const assertion of result.assertions) {
    const aIcon = assertion.passed ? '  ✓' : '  ✗';
    console.log(`${aIcon} ${assertion.label} (Expected: ${JSON.stringify(assertion.expected)}, Actual: ${JSON.stringify(assertion.actual)})`);
  }

  if (result.validationResult.validationErrors.length > 0) {
    console.log(`  Validation Errors Flagged: ${result.validationResult.validationErrors.map(e => `[${e.code}] ${e.message}`).join('; ')}`);
  }
  if (result.validationResult.warnings.length > 0) {
    console.log(`  System Warnings: ${result.validationResult.warnings.map(w => `[${w.code}] ${w.message}`).join('; ')}`);
  }
  
  console.log('');
  testIndex++;
}

console.log('======================================================================');
console.log(`TEST RUN SUMMARY: ${testSuite.passedCount}/${testSuite.totalTests} tests passed`);
console.log(`Overall Result: ${testSuite.allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
console.log(`Timestamp: ${testSuite.executionTimestamp}`);
console.log('======================================================================');

if (!testSuite.allPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
