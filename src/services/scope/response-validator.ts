/**
 * Response Validator Service
 * 
 * Purpose: Catch scope violations AFTER LLM generation
 * Last line of defense if LLM generates out-of-scope content
 * 
 * Critical Feature: Validates that LLM stayed in scope and corrects if needed
 */

import { RedirectEngine } from './redirect-engine';

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  correctedResponse?: string;
  confidence: number; // 0-100
}

export class ResponseValidator {
  /**
   * Validate LLM response stayed in scope
   * Returns validation result with any violations and corrected response if needed
   */
  static validate(response: string): ValidationResult {
    const violations: string[] = [];
    let confidence = 100;
    
    // Check for out-of-scope content patterns
    const violationPatterns = {
      'recipe_content': {
        pattern: /recipe|ingredients:|cooking instructions|steps?:\s*\d+|how to (cook|make|bake|prepare)|mix.*together|preheat|simmer|boil/i,
        message: 'Contains cooking instructions or recipe content'
      },
      'technical_content': {
        pattern: /download|install|click.*button|go to.*settings|technical steps|error code|system configuration/i,
        message: 'Contains technical instructions'
      },
      'entertainment_content': {
        pattern: /movie recommendation:|i recommend watching|you should watch|great films include|actors? (?:like|such as)|biography of|filmography/i,
        message: 'Contains entertainment recommendations or content'
      },
      'coding_content': {
        pattern: /function\s+\w+\s*\(|def\s+\w+\(|const\s+\w+\s*=|class\s+\w+|import.*from|<\/?\w+>|console\.log|print\(/i,
        message: 'Contains code or programming content'
      },
      'homework_solving': {
        pattern: /the answer is|solution:|step \d+:|let's solve|here's how to calculate|mathematical formula/i,
        message: 'Contains homework solution or academic problem solving'
      },
      'political_discussion': {
        pattern: /political party|election results|government policy|voting for|candidate.*platform/i,
        message: 'Contains political discussion'
      }
    };
    
    // Check each violation pattern
    for (const [key, { pattern, message }] of Object.entries(violationPatterns)) {
      if (pattern.test(response)) {
        violations.push(message);
        confidence -= 15; // Reduce confidence for each violation
      }
    }
    
    // Check for signs that LLM is answering general knowledge questions
    if (this.containsEncyclopedicContent(response)) {
      violations.push('Contains encyclopedic or general knowledge content');
      confidence -= 20;
    }
    
    // Check for multiple redirect patterns (sign of repetition)
    if (this.hasRepetitiveRedirects(response)) {
      violations.push('Uses repetitive redirect language');
      confidence -= 10;
    }
    
    // If violations found, return correction
    if (violations.length > 0) {
      return {
        valid: false,
        violations,
        correctedResponse: RedirectEngine.generate('default'),
        confidence: Math.max(0, confidence)
      };
    }
    
    // Response is valid
    return {
      valid: true,
      violations: [],
      confidence: 100
    };
  }
  
  /**
   * Detect if response contains encyclopedic/factual content
   * (Signs that LLM is answering general knowledge questions)
   */
  private static containsEncyclopedicContent(response: string): boolean {
    const encyclopedicPatterns = [
      /\b\d{4}\b.*born/i,           // Birth years
      /is an? (actor|actress|director|politician|scientist|author)/i,
      /capital of|population of|located in/i,
      /is known for|famous for|best known/i,
      /won.*award|received.*prize/i,
      /starred in|appeared in|featured in/i
    ];
    
    return encyclopedicPatterns.some(pattern => pattern.test(response));
  }
  
  /**
   * Detect repetitive redirect language
   * (Prevents "I'm here for mental well-being..." appearing repeatedly)
   */
  private static hasRepetitiveRedirects(response: string): boolean {
    const redirectPhrases = [
      "I'm here for mental well-being",
      "I'm here to support",
      "I'm designed for",
      "I'm focused on"
    ];
    
    const lowerResponse = response.toLowerCase();
    const matchCount = redirectPhrases.filter(phrase => 
      lowerResponse.includes(phrase.toLowerCase())
    ).length;
    
    // If multiple redirect phrases appear, it's repetitive
    return matchCount >= 2;
  }
  
  /**
   * Quick validation check (for performance-critical paths)
   * Only checks critical violations without detailed analysis
   */
  static quickValidate(response: string): boolean {
    const criticalPatterns = [
      /recipe|ingredients:|cooking instructions/i,
      /function\s+\w+\s*\(|def\s+\w+\(/i,
      /movie recommendation:|i recommend watching/i
    ];
    
    return !criticalPatterns.some(pattern => pattern.test(response));
  }
}
