/**
 * Test Cases for Daily-Life Topic Leakage
 * 
 * Purpose: Test that the scope classifier properly distinguishes between:
 * - Emotional impact of daily states (allowed)
 * - Daily-life topics becoming the main conversation (not allowed)
 * 
 * This prevents conversations from drifting to food, sleep, weather, shopping, etc.
 */

import { ScopeClassifier } from '../services/scope/scope-classifier';

interface TestCase {
  name: string;
  message: string;
  conversationHistory?: string[];
  expected: {
    inScope: boolean;
    category: string;
    reason: string;
  };
}

const testCases: TestCase[] = [
  // FOOD SCENARIOS
  {
    name: "Food: Simple hunger statement (should be allowed - it's a state)",
    message: "I am hungry",
    expected: {
      inScope: true,
      category: "unclear",
      reason: "Message does not match clear patterns - allowing with low confidence"
    }
  },
  {
    name: "Food: Hunger with emotional impact (should be allowed)",
    message: "I am hungry and it's making me irritable",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },
  {
    name: "Food: What should I eat for lunch (should be blocked)",
    message: "What should I eat for lunch?",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life food topic without emotional connection"
    }
  },
  {
    name: "Food: Let's grab a snack (should be blocked - daily-life leakage)",
    message: "Let's grab a snack",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life food topic without emotional connection"
    }
  },
  {
    name: "Food: I'm having deer curry (should be blocked - daily-life leakage)",
    message: "I'm having deer curry",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life food topic without emotional connection"
    }
  },
  {
    name: "Food: I'm cooking dinner (should be blocked - caught by recipe pattern)",
    message: "I'm cooking dinner right now",
    expected: {
      inScope: false,
      category: "recipe",
      reason: "Pure recipe request with no emotional context"
    }
  },
  {
    name: "Food: Stressed about cooking (should be allowed - emotional context)",
    message: "I'm stressed about cooking for my family tonight",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },
  {
    name: "Food: Haven't eaten all day (should be allowed - emotional context)",
    message: "I haven't eaten all day and I feel awful",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },
  
  // SLEEP SCENARIOS
  {
    name: "Sleep: I'm tired (should be allowed - it's a state)",
    message: "I'm tired",
    expected: {
      inScope: true,
      category: "unclear",
      reason: "Message does not match clear patterns - allowing with low confidence"
    }
  },
  {
    name: "Sleep: I'm going to bed (should be blocked - daily-life leakage)",
    message: "I'm going to bed now",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life sleep topic without emotional connection"
    }
  },
  {
    name: "Sleep: Goodnight (should be blocked)",
    message: "Goodnight",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life sleep topic without emotional connection"
    }
  },
  {
    name: "Sleep: Tired and can't focus (should be allowed - emotional context)",
    message: "I'm so tired I can't focus on anything",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },
  {
    name: "Sleep: Exhausted from studying (should be allowed)",
    message: "I'm exhausted from studying all night",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },

  // WEATHER SCENARIOS
  {
    name: "Weather: It's sunny (should be blocked - daily-life leakage)",
    message: "It's sunny today",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life weather topic without emotional connection"
    }
  },
  {
    name: "Weather: What's the weather (should be blocked)",
    message: "What's the weather like?",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life weather topic without emotional connection"
    }
  },
  {
    name: "Weather: Sad because it's raining (should be allowed - emotional context)",
    message: "I feel sad because it's been raining for days",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },

  // SHOPPING SCENARIOS
  {
    name: "Shopping: I'm going shopping (should be blocked)",
    message: "I'm going shopping",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life shopping topic without emotional connection"
    }
  },
  {
    name: "Shopping: What should I buy (should be blocked)",
    message: "What should I buy?",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life shopping topic without emotional connection"
    }
  },
  {
    name: "Shopping: Anxious about buying gift (should be allowed)",
    message: "I'm anxious about buying the right gift for my mom",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },

  // ENTERTAINMENT SCENARIOS
  {
    name: "Entertainment: I'm watching a movie (should be blocked)",
    message: "I'm watching a movie",
    expected: {
      inScope: false,
      category: "movie",
      reason: "Pure movie request with no emotional context"
    }
  },
  {
    name: "Entertainment: What should I watch (should be blocked)",
    message: "What movie should I watch?",
    expected: {
      inScope: false,
      category: "movie",
      reason: "Pure movie request with no emotional context"
    }
  },
  {
    name: "Entertainment: Depressed after watching sad movie (should be allowed)",
    message: "I feel depressed after watching that sad movie",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },

  // MUSIC SCENARIOS
  {
    name: "Music: I'm listening to music (should be blocked)",
    message: "I'm listening to music",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life music topic without emotional connection"
    }
  },
  {
    name: "Music: What should I listen to (should be blocked)",
    message: "What song should I listen to?",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life music topic without emotional connection"
    }
  },
  {
    name: "Music: Music helps when I'm sad (should be allowed)",
    message: "Listening to music helps when I'm feeling sad",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },

  // VACATION SCENARIOS
  {
    name: "Vacation: I'm going on vacation (should be blocked)",
    message: "I'm going on vacation next week",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life vacation topic without emotional connection"
    }
  },
  {
    name: "Vacation: Where should I go (should be blocked)",
    message: "Where should I go for vacation?",
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Daily-life vacation topic without emotional connection"
    }
  },
  {
    name: "Vacation: Stressed about vacation planning (should be allowed)",
    message: "I'm stressed about planning our family vacation",
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },

  // CONVERSATION HISTORY DRIFT TESTS
  {
    name: "History: Food conversation drift (should be blocked)",
    message: "I'm having pizza",
    conversationHistory: ["I am hungry", "Let's grab a snack"],
    expected: {
      inScope: false,
      category: "daily_life_leakage",
      reason: "Conversation has drifted to food topic without emotional context"
    }
  },
  {
    name: "History: Emotional food conversation (should be allowed)",
    message: "I haven't eaten and feel dizzy",
    conversationHistory: ["I am hungry", "It's making me feel weak"],
    expected: {
      inScope: true,
      category: "mental_health",
      reason: "Clear mental health/emotional content (emotions)"
    }
  },
];

async function runTests() {
  console.log("🧪 Running Daily-Life Topic Leakage Tests\n");
  console.log("=" .repeat(80));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await ScopeClassifier.classify(testCase.message, testCase.conversationHistory);
    
    const inScopeMatch = result.inScope === testCase.expected.inScope;
    const categoryMatch = result.category === testCase.expected.category;
    
    // For in-scope messages, reason can vary, so we only check it for out-of-scope
    const reasonMatch = result.inScope ? true : result.reason.includes(testCase.expected.reason.split(" without")[0]);
    
    const testPassed = inScopeMatch && categoryMatch && reasonMatch;

    if (testPassed) {
      console.log(`✅ PASS: ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Message: "${testCase.message}"`);
      console.log(`   Expected: inScope=${testCase.expected.inScope}, category=${testCase.expected.category}`);
      console.log(`   Got:      inScope=${result.inScope}, category=${result.category}, reason="${result.reason}"`);
      failed++;
    }
  }

  console.log("=" .repeat(80));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  
  if (failed === 0) {
    console.log("✨ All tests passed!");
  } else {
    console.log(`⚠️ ${failed} test(s) failed`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, testCases };
