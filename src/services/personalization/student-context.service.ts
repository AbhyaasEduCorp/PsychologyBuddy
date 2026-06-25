/**
 * Student Context Service
 * 
 * Provides TIER 1 (safe, non-invasive) personalization data to AI
 * WITHOUT exposing sensitive therapeutic information.
 * 
 * See: AI_DATA_ACCESS_POLICY.md for full policy
 */

import prisma from '@/src/prisma';

/**
 * Tier 1: Always accessible - basic personalization
 * NO sensitive data, NO clinical information, NO surveillance
 */
export interface StudentContextForAI {
  // Basic personal info
  personalInfo: {
    preferredName: string | null;
    age: number | null;
    class: string | null;
    preferredLanguage: string;
  };
  
  // Broad interests (not detailed)
  interests: {
    categories: string[]; // ["music", "art", "sports"]
    // Explicitly NO detailed information
  };
  
  // Recent mood (last 1-2 sessions only, NOT full history)
  recentMood: {
    lastSessionSummary: string | null; // "feeling stressed" not full details
    trend: 'improving' | 'stable' | 'declining' | 'unknown';
    // Explicitly limited to recent only
  };
  
  // Current active goals (NOT past/abandoned goals)
  activeGoals: {
    currentPathway: string | null;
    goalDescription: string | null;
  };
  
  // App usage preferences
  appPreferences: {
    usesBreathingExercises: boolean;
    usesJournaling: boolean;
    usesMoodTracking: boolean;
    preferredTools: string[];
  };
}

/**
 * Privacy-safe context string for AI prompt injection
 */
export interface StudentContextPrompt {
  contextText: string;
  dataUsed: string[]; // For transparency/logging
}

export class StudentContextService {
  /**
   * Fetch Tier 1 (safe) context for AI personalization
   * This is the ONLY method that should be used for AI access
   */
  static async getContextForAI(studentId: string): Promise<StudentContextForAI> {
    try {
      // Get user from studentId
      const user = await prisma.user.findUnique({
        where: { studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          classId: true,
          // Note: preferredLanguage and interests don't exist yet in schema
          // We'll use defaults for now
        },
      });

      if (!user) {
        return this.getEmptyContext();
      }

      // Calculate age if DOB exists
      let age: number | null = null;
      if (user.dateOfBirth) {
        const today = new Date();
        // dateOfBirth is stored as string, parse it
        const birthDate = new Date(user.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Get class info
      let className: string | null = null;
      if (user.classId) {
        const classInfo = await prisma.class.findUnique({
          where: { id: user.classId },
          select: { name: true },
        });
        className = classInfo?.name || null;
      }

      // Get recent mood (last 1-2 chat sessions only)
      const recentMood = await this.getRecentMoodSummary(user.id);

      // Get active goals (current only, not past)
      const activeGoals = await this.getActiveGoals(user.id);

      // Get app preferences
      const appPreferences = await this.getAppPreferences(user.id);

      // For now, interests is empty (field doesn't exist in schema yet)
      // TODO: Add interests field to User or StudentProfile table
      const interests: string[] = [];

      return {
        personalInfo: {
          preferredName: `${user.firstName} ${user.lastName}`,
          age,
          class: className,
          preferredLanguage: 'en', // Default to English for now
        },
        interests: {
          categories: interests,
        },
        recentMood,
        activeGoals,
        appPreferences,
      };
    } catch (error) {
      console.error('[StudentContext] Error fetching context:', error);
      return this.getEmptyContext();
    }
  }

  /**
   * Generate natural language context prompt for AI
   * This is what gets injected into the system prompt
   */
  static generateContextPrompt(context: StudentContextForAI): StudentContextPrompt {
    const parts: string[] = [];
    const dataUsed: string[] = [];

    parts.push('\n---\n');
    parts.push('# STUDENT CONTEXT FOR PERSONALIZATION\n');

    // Name - MOST PROMINENT
    if (context.personalInfo.preferredName) {
      parts.push(`## Student Name: ${context.personalInfo.preferredName}`);
      parts.push(`**IMPORTANT: Use this name when greeting. Say "Hey ${context.personalInfo.preferredName.split(' ')[0]}" NOT "Hey there"**\n`);
      dataUsed.push('name');
    }

    // Age/Class
    if (context.personalInfo.age || context.personalInfo.class) {
      const ageClass = [
        context.personalInfo.age ? `${context.personalInfo.age} years old` : null,
        context.personalInfo.class ? `Class ${context.personalInfo.class}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      parts.push(`Age/Class: ${ageClass}`);
      dataUsed.push('age/class');
    }

    // Interests
    if (context.interests.categories.length > 0) {
      parts.push(`Interests: ${context.interests.categories.join(', ')}`);
      dataUsed.push('interests');
    }

    // Recent mood (if available)
    if (context.recentMood.lastSessionSummary) {
      parts.push(`Recent Mood: ${context.recentMood.lastSessionSummary} (${context.recentMood.trend})`);
      dataUsed.push('recent-mood');
    }

    // Active goals
    if (context.activeGoals.currentPathway) {
      parts.push(`Active Goal: ${context.activeGoals.currentPathway}`);
      if (context.activeGoals.goalDescription) {
        parts.push(`  → ${context.activeGoals.goalDescription}`);
      }
      dataUsed.push('active-goals');
    }

    // App preferences (for suggestions)
    const usedTools: string[] = [];
    if (context.appPreferences.usesBreathingExercises) usedTools.push('breathing exercises');
    if (context.appPreferences.usesJournaling) usedTools.push('journaling');
    if (context.appPreferences.usesMoodTracking) usedTools.push('mood tracking');
    
    if (usedTools.length > 0) {
      parts.push(`Tools They Use: ${usedTools.join(', ')}`);
      dataUsed.push('app-preferences');
    }

    // Privacy reminder
    parts.push('\n## USAGE RULES:');
    parts.push('1. **USE THE NAME** - Greet them personally, not generically');
    parts.push('2. **IF ASKED** - "What\'s my name?" → Tell them their name from above');
    parts.push('3. **REFERENCE MOOD** - Show continuity if mood data exists');
    parts.push('4. **PRIVACY** - Do NOT mention journals, counselor notes, or past conversations in detail');
    parts.push('---\n');

    const result = {
      contextText: parts.join('\n'),
      dataUsed,
    };
    
    // Debug: Log actual context being sent
    console.log('[StudentContext] Generated context prompt:', result.contextText);
    
    return result;
  }

  /**
   * Get recent mood summary (last 1-2 sessions only)
   * This is intentionally limited to prevent surveillance feeling
   */
  private static async getRecentMoodSummary(userId: string): Promise<StudentContextForAI['recentMood']> {
    try {
      // Get last 2 chat sessions
      const recentSessions = await prisma.chatSession.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          startedAt: 'desc', // Use startedAt instead of createdAt
        },
        take: 2,
        select: {
          id: true,
          mood: true,
          startedAt: true,
          summaries: {
            select: {
              mainTopic: true,
              conversationAbout: true,
              reflection: true,
            },
            take: 1,
          },
        },
      });

      if (recentSessions.length === 0) {
        return {
          lastSessionSummary: null,
          trend: 'unknown',
        };
      }

      // Use mood field or summary if available
      const lastSession = recentSessions[0];
      const lastMood = lastSession.mood || null;
      
      // Combine Summary fields to create a meaningful summary
      let lastSummary: string | null = null;
      if (lastSession.summaries[0]) {
        const summaryData = lastSession.summaries[0];
        lastSummary = `${summaryData.mainTopic}: ${summaryData.conversationAbout}`;
      } else if (lastMood) {
        lastSummary = lastMood;
      }

      // Very simple trend detection (not sophisticated)
      let trend: 'improving' | 'stable' | 'declining' | 'unknown' = 'unknown';
      
      if (recentSessions.length >= 2 && lastSummary) {
        const summaryLower = lastSummary.toLowerCase();
        if (summaryLower.includes('better') || summaryLower.includes('improving') || summaryLower.includes('calm')) {
          trend = 'improving';
        } else if (summaryLower.includes('worse') || summaryLower.includes('difficult') || summaryLower.includes('anxious') || summaryLower.includes('stressed')) {
          trend = 'declining';
        } else {
          trend = 'stable';
        }
      }

      // Return ONLY high-level summary, NOT detailed messages
      return {
        lastSessionSummary: lastSummary,
        trend,
      };
    } catch (error) {
      console.error('[StudentContext] Error fetching recent mood:', error);
      return {
        lastSessionSummary: null,
        trend: 'unknown',
      };
    }
  }

  /**
   * Get active goals (current only, NOT past)
   */
  private static async getActiveGoals(userId: string): Promise<StudentContextForAI['activeGoals']> {
    try {
      // TODO: Replace with actual goals/pathways table when implemented
      // For now, return placeholder
      
      // Example of what this should look like when implemented:
      // const activeGoal = await prisma.studentGoal.findFirst({
      //   where: {
      //     userId,
      //     status: 'ACTIVE', // NOT completed or abandoned
      //   },
      //   orderBy: {
      //     createdAt: 'desc',
      //   },
      // });

      return {
        currentPathway: null, // e.g., "Managing Anxiety"
        goalDescription: null, // e.g., "Learning to cope with exam stress"
      };
    } catch (error) {
      console.error('[StudentContext] Error fetching active goals:', error);
      return {
        currentPathway: null,
        goalDescription: null,
      };
    }
  }

  /**
   * Get app usage preferences
   */
  private static async getAppPreferences(userId: string): Promise<StudentContextForAI['appPreferences']> {
    try {
      // TODO: Find correct usage tracking tables
      // The Meditation, WritingJournal etc. are content tables, not usage logs
      // For now, return empty preferences
      
      // When you find the correct tables (e.g., MeditationLog, JournalLog),
      // update these queries to count user activity
      
      return {
        usesBreathingExercises: false,
        usesJournaling: false,
        usesMoodTracking: false,
        preferredTools: [],
      };
    } catch (error) {
      console.error('[StudentContext] Error fetching app preferences:', error);
      return {
        usesBreathingExercises: false,
        usesJournaling: false,
        usesMoodTracking: false,
        preferredTools: [],
      };
    }
  }

  /**
   * Parse interests into broad categories
   * Do NOT expose detailed information
   */
  private static parseInterests(interestsData: any): string[] {
    if (!interestsData) return [];
    
    try {
      // If interests is stored as JSON or comma-separated
      if (typeof interestsData === 'string') {
        try {
          const parsed = JSON.parse(interestsData);
          if (Array.isArray(parsed)) {
            return parsed.slice(0, 5); // Max 5 interests
          }
        } catch {
          // Try comma-separated
          return interestsData.split(',').map((i: string) => i.trim()).slice(0, 5);
        }
      }
      
      if (Array.isArray(interestsData)) {
        return interestsData.slice(0, 5);
      }
      
      return [];
    } catch (error) {
      console.error('[StudentContext] Error parsing interests:', error);
      return [];
    }
  }

  /**
   * Empty context (fallback)
   */
  private static getEmptyContext(): StudentContextForAI {
    return {
      personalInfo: {
        preferredName: null,
        age: null,
        class: null,
        preferredLanguage: 'en',
      },
      interests: {
        categories: [],
      },
      recentMood: {
        lastSessionSummary: null,
        trend: 'unknown',
      },
      activeGoals: {
        currentPathway: null,
        goalDescription: null,
      },
      appPreferences: {
        usesBreathingExercises: false,
        usesJournaling: false,
        usesMoodTracking: false,
        preferredTools: [],
      },
    };
  }

  /**
   * Check if student has given consent for enhanced personalization
   * (Future feature - for Tier 2 data access)
   */
  static async hasEnhancedPersonalizationConsent(studentId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { studentId },
        select: {
          // TODO: Add consent field when implemented
          // enhancedPersonalizationConsent: true,
        },
      });

      // For now, return false (only Tier 1 access)
      return false;
    } catch (error) {
      console.error('[StudentContext] Error checking consent:', error);
      return false;
    }
  }

  /**
   * Log context access for transparency
   * Students should be able to see what data AI has accessed
   */
  static async logContextAccess(
    studentId: string,
    dataUsed: string[],
    sessionId: string
  ): Promise<void> {
    try {
      // TODO: Implement context access logging
      // This allows students to see what data AI is using
      console.log('[StudentContext] Access logged:', {
        studentId,
        dataUsed,
        sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[StudentContext] Error logging access:', error);
    }
  }
}

export default StudentContextService;
