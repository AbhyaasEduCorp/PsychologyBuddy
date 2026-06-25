import { DatabaseService } from '@/src/lib/database/database-service'
import { AIService } from '@/src/lib/ai/ai-service'
import { ValidationError } from '@/src/lib/errors/custom-errors';
import prisma from '@/src/prisma';

export interface SummaryGenerationData {
  sessionId: string
  conversation: any[]
  studentId: string
}

export interface StructuredSummaryResponse {
  id: string
  mainTopic: string
  conversationStart: string
  conversationAbout: string
  reflection: string
  createdAt: Date
  sessionId: string
}

export class SummaryService {
  /**
   * Generate a structured summary for a chat session
   */
  static async generateSummary(summaryData: SummaryGenerationData): Promise<StructuredSummaryResponse> {
    try {
      console.log('[SummaryService] Starting summary generation for session:', summaryData.sessionId);
      
      // Verify session exists and belongs to student
      const session = await DatabaseService.getChatSession(summaryData.sessionId, summaryData.studentId)
      
      if (!session) {
        console.error('[SummaryService] Session not found:', summaryData.sessionId);
        throw new ValidationError('Session not found')
      }
      
      // Check if summary already exists for this session
      const existingSummary = await DatabaseService.getStructuredSummaryBySession(summaryData.sessionId)
      if (existingSummary) {
        console.log('[SummaryService] Summary already exists for session:', summaryData.sessionId);
        return {
          id: existingSummary.id,
          mainTopic: existingSummary.mainTopic || 'No Topic',
          conversationStart: existingSummary.conversationStart || '',
          conversationAbout: existingSummary.conversationAbout || '',
          reflection: existingSummary.reflection || '',
          createdAt: existingSummary.createdAt,
          sessionId: existingSummary.sessionId
        }
      }
      
      console.log('[SummaryService] Session verified, generating AI summary...');
      
      // Generate AI structured summary
      const aiSummary = await AIService.generateStructuredSummary(summaryData.conversation)
      
      console.log('[SummaryService] AI summary generated:', aiSummary);
      
      console.log('[SummaryService] Creating database record...');
      // Create summary in database
      const summary = await DatabaseService.createStructuredSummary({
        sessionId: summaryData.sessionId,
        studentId: summaryData.studentId,
        mainTopic: aiSummary.mainTopic,
        conversationStart: aiSummary.conversationStart,
        conversationAbout: aiSummary.conversationAbout,
        reflection: aiSummary.reflection,
      })
      
      console.log('[SummaryService] Database record created:', summary);
      
      return {
        id: summary.id,
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection,
        createdAt: summary.createdAt,
        sessionId: summary.sessionId
      }
    } catch (error) {
      console.error('[SummaryService] Error in generateSummary:', error);
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate summary for a session using messages stored in the database.
   * Used for server-side generation when the client timer fires but the student
   * is no longer on the page (abandoned sessions / auto-termination fallback).
   */
  static async generateSummaryFromDB(sessionId: string): Promise<StructuredSummaryResponse | null> {
    try {
      console.log('[SummaryService] generateSummaryFromDB called for session:', sessionId);

      // Skip if summary already exists
      const existingSummary = await DatabaseService.getStructuredSummaryBySession(sessionId);
      if (existingSummary) {
        console.log('[SummaryService] Summary already exists for session:', sessionId);
        return {
          id: existingSummary.id,
          mainTopic: existingSummary.mainTopic || 'No Topic',
          conversationStart: existingSummary.conversationStart || '',
          conversationAbout: existingSummary.conversationAbout || '',
          reflection: existingSummary.reflection || '',
          createdAt: existingSummary.createdAt,
          sessionId: existingSummary.sessionId
        };
      }

      // Look up the session to get studentId (userId)
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { userId: true }
      });

      if (!chatSession) {
        console.warn('[SummaryService] Session not found for generateSummaryFromDB:', sessionId);
        return null;
      }

      // Fetch stored messages from database
      const dbMessages = await DatabaseService.getChatMessages(sessionId);

      if (dbMessages.length < 2) {
        console.log('[SummaryService] Not enough messages to generate summary for session:', sessionId);
        return null;
      }

      // Convert to AI conversation format
      const conversation = dbMessages.map((msg: any) => ({
        role: msg.senderType === 'STUDENT' ? 'user' : 'assistant',
        content: msg.content
      }));

      console.log('[SummaryService] Generating AI summary from', conversation.length, 'messages for session:', sessionId);

      const aiSummary = await AIService.generateStructuredSummary(conversation);

      const summary = await DatabaseService.createStructuredSummary({
        sessionId,
        studentId: chatSession.userId,
        mainTopic: aiSummary.mainTopic,
        conversationStart: aiSummary.conversationStart,
        conversationAbout: aiSummary.conversationAbout,
        reflection: aiSummary.reflection,
      });

      console.log('[SummaryService] Summary generated from DB messages, id:', summary.id);

      return {
        id: summary.id,
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection,
        createdAt: summary.createdAt,
        sessionId: summary.sessionId
      };
    } catch (error) {
      console.error('[SummaryService] Error in generateSummaryFromDB:', error);
      return null;
    }
  }

  /**
   * Find all expired sessions for a student that have no summary and generate
   * summaries for them server-side. Called during chat/start to handle sessions
   * that expired while the student was away.
   */
  static async generateExpiredSessionSummaries(userId: string): Promise<void> {
    try {
      const maxDurationMs = Number(process.env.CHAT_SESSION_DURATION_MINUTES || 360) * 60 * 1000;
      const cutoff = new Date(Date.now() - maxDurationMs);

      // Find sessions that are still active (never properly terminated) but started before the cutoff
      const expiredSessions = await prisma.chatSession.findMany({
        where: {
          userId,
          isActive: true,
          startedAt: { lt: cutoff }
        },
        select: { id: true }
      });

      if (expiredSessions.length === 0) return;

      console.log(`[SummaryService] Found ${expiredSessions.length} expired session(s) for user ${userId}, generating summaries...`);

      for (const session of expiredSessions) {
        // Generate summary from DB messages (no-op if summary already exists)
        await SummaryService.generateSummaryFromDB(session.id);

        // Mark session as inactive
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { isActive: false, endedAt: new Date() }
        });

        console.log(`[SummaryService] Processed expired session: ${session.id}`);
      }
    } catch (error) {
      console.error('[SummaryService] Error in generateExpiredSessionSummaries:', error);
    }
  }

  /**
   * Get summary for a specific session
   */
  static async getSessionSummary(sessionId: string, studentId?: string): Promise<StructuredSummaryResponse | null> {
    try {
      const summary = await DatabaseService.getStructuredSummaryBySession(sessionId)
      
      if (!summary) {
        return null
      }
      
      // If studentId is provided, verify ownership
      if (studentId) {
        const session = await DatabaseService.getChatSession(sessionId, studentId)
        if (!session) {
          throw new ValidationError('Session not found or access denied')
        }
      }
      
      return {
        id: summary.id,
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection,
        createdAt: summary.createdAt,
        sessionId: summary.sessionId
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to get session summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all summaries for a student
   */
  static async getStudentSummaries(studentId: string, limit: number = 20): Promise<StructuredSummaryResponse[]> {
    try {
      const summaries = await DatabaseService.getStudentStructuredSummaries(studentId, limit)
      
      return summaries.map(summary => ({
        id: summary.id,
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection,
        createdAt: summary.createdAt,
        sessionId: summary.sessionId
      }))
    } catch (error) {
      throw new Error(`Failed to get student summaries: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get recent summary for a student
   */
  static async getRecentSummary(studentId: string): Promise<StructuredSummaryResponse | null> {
    try {
      const summaries = await this.getStudentSummaries(studentId, 1)
      return summaries.length > 0 ? summaries[0] : null
    } catch (error) {
      throw new Error(`Failed to get recent summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a summary
   */
  static async deleteSummary(summaryId: string, studentId: string): Promise<void> {
    try {
      // Get summary to verify ownership
      const summary = await DatabaseService.getStructuredSummaryById(summaryId)
      
      if (!summary) {
        throw new ValidationError('Summary not found')
      }
      
      // Verify the summary belongs to the student
      const session = await DatabaseService.getChatSession(summary.sessionId, studentId)
      if (!session) {
        throw new ValidationError('Access denied')
      }
      
      // Note: We would need to implement deleteStructuredSummary in DatabaseService
      // For now, this is a placeholder
      throw new Error('Delete functionality not yet implemented for new summary format')
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to delete summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

