import { NextRequest, NextResponse } from 'next/server'
import { SummaryService } from '@/src/services/chats/summaryService'
import { DatabaseService } from '@/src/lib/database/database-service'
import { z } from 'zod'
import prisma from '@/src/prisma'

// Validation schema
const GenerateSummarySchema = z.object({
  sessionId: z.string(),
  conversation: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  }))
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let sessionId: string | undefined;
  
  try {
    let requestBody;
    try {
      requestBody = await request.json()
    } catch (jsonError) {
      console.error('[SummaryGenerate] Failed to parse request JSON:', jsonError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { sessionId: reqSessionId, conversation } = requestBody
    sessionId = reqSessionId

    console.log('[SummaryGenerate] Summary generate request:', { sessionId, conversationLength: conversation?.length })

    if (!sessionId) {
      console.error('[SummaryGenerate] Missing sessionId in request')
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Validate input
    const validation = GenerateSummarySchema.safeParse({ sessionId, conversation })
    if (!validation.success) {
      console.error('[SummaryGenerate] Validation failed:', validation.error.issues)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }

    // Get studentId from the session - we need to extract this from the chat session
    
    try {
      console.log('[SummaryGenerate] Looking up chat session:', sessionId);
      
      // First get the chat session to find the studentId
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { userId: true }
      });
      
      if (!chatSession) {
        console.error('[SummaryGenerate] Chat session not found:', sessionId);
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }
      
      const studentId = chatSession.userId;
      console.log('[SummaryGenerate] Found student ID:', studentId);

      // Verify session belongs to the student (additional security check)
      console.log('[SummaryGenerate] Verifying session ownership...');
      const sessionVerification = await DatabaseService.getChatSession(sessionId, studentId);
      if (!sessionVerification) {
        console.error('[SummaryGenerate] Session verification failed');
        return NextResponse.json(
          { success: false, error: 'Session access denied' },
          { status: 403 }
        );
      }

      console.log('[SummaryGenerate] Calling SummaryService.generateSummary...');
      // Generate summary
      const summary = await SummaryService.generateSummary({
        sessionId,
        conversation,
        studentId
      })

      console.log('[SummaryGenerate] Summary generated successfully:', summary.id);
      return NextResponse.json({
        success: true,
        data: {
          id: summary.id,
          title: summary.mainTopic,
          content: summary.reflection,
          mood: 'Neutral',
          createdAt: summary.createdAt.toISOString(),
          topics: [summary.mainTopic],
          messageCount: conversation.length,
          sessionId: sessionId
        }
      })

    } catch (sessionError) {
      console.error('[SummaryGenerate] Error in session lookup or summary generation:', {
        error: sessionError instanceof Error ? sessionError.message : String(sessionError),
        stack: sessionError instanceof Error ? sessionError.stack : undefined,
        sessionId,
        errorName: sessionError?.constructor?.name
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to get session information',
          details: sessionError instanceof Error ? sessionError.message : String(sessionError)
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[SummaryGenerate] Error generating summary:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
