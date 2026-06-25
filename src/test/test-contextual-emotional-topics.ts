/**
 * Test Cases for Contextual Emotional Topics
 * 
 * Purpose: Test that the scope classifier correctly identifies emotional intent
 * across normally out-of-scope topics (finance, coding, politics, etc.)
 * 
 * Key Principle: Intent-based classification, not topic-based
 * - "What are stock market concepts?" → Information request → Block
 * - "How do I control emotions while trading?" → Emotional support → Allow
 * - "I panic while trading" → Emotional support → Allow
 */

import { ScopeClassifier } from '../services/scope/scope-classifier';

interface TestCase {
  name: string;
  message: string;
  expected: {
    inScope: boolean;
    category: string;
  };
}

const testCases: TestCase[] = [
  // FINANCE EMOTIONAL SUPPORT TESTS
  {
    name: "Finance: Emotional control while trading (should be allowed)",
    message: "do you provide emotional control suggestions while doing trading",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Finance: Improve wellness about stockmarket (should be allowed)",
    message: "I need to improve the wellness about stockmarket",
    expected: {
      inScope: true,
      category: "emotional_wellness"
    }
  },
  {
    name: "Finance: Control emotions while buy and sell (should be allowed)",
    message: "ok, how we control emotions while buy and sell?",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Finance: Get emotional while trading (should be allowed)",
    message: "I get very emotional while trading",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Finance: Panic while trading (should be allowed)",
    message: "I panic while trading",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Finance: Which is better F/O or stocks (should be blocked - financial advice)",
    message: "yes, which is better F/O or stocks for intraday?",
    expected: {
      inScope: false,
      category: "finance"
    }
  },
  {
    name: "Finance: What are stock market concepts (should be blocked - information request)",
    message: "what are the concepts in stockmarket?",
    expected: {
      inScope: false,
      category: "finance"
    }
  },
  {
    name: "Finance: Can you give me some tips (ambiguous - should be allowed)",
    message: "Can you give me some tips?",
    expected: {
      inScope: true,
      category: "unclear"
    }
  },

  // CODING EMOTIONAL SUPPORT TESTS
  {
    name: "Coding: My coding project is stressing me out (should be allowed)",
    message: "My coding project is stressing me out",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Coding: Stressed about coding (should be allowed)",
    message: "I'm stressed about coding",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Coding: Write me a Python function (should be blocked)",
    message: "Write me a Python function",
    expected: {
      inScope: false,
      category: "coding"
    }
  },
  {
    name: "Coding: How to debug JavaScript (should be blocked)",
    message: "How do I debug this JavaScript code?",
    expected: {
      inScope: false,
      category: "coding"
    }
  },

  // POLITICS EMOTIONAL SUPPORT TESTS
  {
    name: "Politics: Politics is making me anxious (should be allowed)",
    message: "Politics is making me anxious",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Politics: Stressed about election (should be allowed)",
    message: "I'm stressed about the upcoming election",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Politics: Who is the president (should be blocked)",
    message: "Who is the current president?",
    expected: {
      inScope: false,
      category: "politics"
    }
  },
  {
    name: "Politics: Tell me about government (should be blocked)",
    message: "Tell me about the government structure",
    expected: {
      inScope: false,
      category: "politics"
    }
  },

  // EXAMS/ACADEMIC EMOTIONAL SUPPORT TESTS
  {
    name: "Exams: Exams are overwhelming me (should be allowed)",
    message: "Exams are overwhelming me",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Exams: Worried about my exam (should be allowed)",
    message: "I'm worried about my exam",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Exams: Solve this math problem (should be blocked)",
    message: "Solve this math problem for me",
    expected: {
      inScope: false,
      category: "homework"
    }
  },
  {
    name: "Exams: Help with homework (should be blocked)",
    message: "Help me with my homework",
    expected: {
      inScope: false,
      category: "homework"
    }
  },

  // SOCIAL MEDIA EMOTIONAL SUPPORT TESTS
  {
    name: "Social Media: Social media makes me feel insecure (should be allowed)",
    message: "Social media makes me feel insecure",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Social Media: Depressed because of Instagram (should be allowed)",
    message: "I feel depressed because of Instagram",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },

  // GAMING EMOTIONAL SUPPORT TESTS
  {
    name: "Gaming: My gaming losses make me angry (should be allowed)",
    message: "My gaming losses make me angry",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Gaming: Frustrated with gaming (should be allowed)",
    message: "I'm frustrated with my gaming performance",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },

  // MOVIES/ENTERTAINMENT EMOTIONAL SUPPORT TESTS
  {
    name: "Movies: Depressed after watching sad movie (should be allowed)",
    message: "I feel depressed after watching that sad movie",
    expected: {
      inScope: true,
      category: "mental_health"
    }
  },
  {
    name: "Movies: What movie should I watch (should be blocked)",
    message: "What movie should I watch tonight?",
    expected: {
      inScope: false,
      category: "movie"
    }
  },
];

async function runTests() {
  console.log("🧪 Running Contextual Emotional Topic Tests\n");
  console.log("=".repeat(80));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await ScopeClassifier.classify(testCase.message);
    
    const inScopeMatch = result.inScope === testCase.expected.inScope;
    const categoryMatch = result.category === testCase.expected.category;
    
    const testPassed = inScopeMatch && categoryMatch;

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

  console.log("=".repeat(80));
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
