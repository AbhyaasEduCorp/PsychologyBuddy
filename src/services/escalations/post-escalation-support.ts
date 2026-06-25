/**
 * Post-Escalation Support Service
 * 
 * Provides smooth acknowledgment and continued support after an escalation alert
 * has been created, maintaining conversation continuity and providing hope.
 */

import prisma from '@/src/prisma';

export interface PostEscalationContext {
  hasRecentEscalation: boolean;
  escalationLevel?: string;
  escalationCategory?: string;
  alertId?: string;
  createdAt?: Date;
  minutesSinceAlert?: number;
  shouldAcknowledge: boolean;
  acknowledgmentMessage?: string;
}

/**
 * Check if there's a recent escalation for this session that needs acknowledgment
 */
export async function getPostEscalationContext(
  sessionId: string,
  studentId: string
): Promise<PostEscalationContext> {
  try {
    // Look for escalation alerts created in the last 2 hours for this session
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const recentAlert = await prisma.escalationAlert.findFirst({
      where: {
        sessionId,
        studentId,
        createdAt: {
          gte: twoHoursAgo,
        },
        // Only acknowledge if alert is still open (not resolved yet)
        status: {
          in: ['open', 'reviewed', 'UNDER_REVIEW'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        level: true,
        category: true,
        createdAt: true,
        status: true,
      },
    });

    if (!recentAlert) {
      return {
        hasRecentEscalation: false,
        shouldAcknowledge: false,
      };
    }

    const minutesSinceAlert = Math.floor(
      (Date.now() - recentAlert.createdAt.getTime()) / (1000 * 60)
    );

    // Check if this is the first message after the alert
    // (we want to acknowledge on the NEXT message after alert was created)
    const messagesAfterAlert = await prisma.chatMessage.count({
      where: {
        sessionId,
        senderType: 'STUDENT',
        createdAt: {
          gt: recentAlert.createdAt,
        },
      },
    });

    // Acknowledge on the first 1-2 messages after alert
    const shouldAcknowledge = messagesAfterAlert <= 2 && minutesSinceAlert <= 30;

    return {
      hasRecentEscalation: true,
      escalationLevel: recentAlert.level,
      escalationCategory: recentAlert.category,
      alertId: recentAlert.id,
      createdAt: recentAlert.createdAt,
      minutesSinceAlert,
      shouldAcknowledge,
      acknowledgmentMessage: shouldAcknowledge
        ? generateAcknowledgmentMessage(recentAlert.level, recentAlert.category)
        : undefined,
    };
  } catch (error) {
    console.error('[PostEscalation] Error checking for recent escalations:', error);
    return {
      hasRecentEscalation: false,
      shouldAcknowledge: false,
    };
  }
}

/**
 * Generate appropriate acknowledgment message based on escalation level
 */
function generateAcknowledgmentMessage(level: string, category: string): string {
  const levelLower = level.toLowerCase();
  
  // High priority escalations
  if (levelLower.includes('high') || levelLower.includes('critical') || levelLower.includes('severe')) {
    return `
**POST-ESCALATION ACKNOWLEDGMENT (Required):**

The student has a recent HIGH-PRIORITY escalation alert. Start your response with:

"I'm really glad you're still here talking with me. I want you to know that your counselor has been notified and they'll be reaching out to you soon to provide support.

In the meantime, I'm here with you. [Then respond to their message naturally]"

**Key Points:**
- Acknowledge the alert was sent
- Reassure help is coming
- Maintain warm, present tone
- Don't make them feel "in trouble"
- Keep conversation flowing naturally
`;
  }
  
  // Moderate escalations
  if (levelLower.includes('moderate') || levelLower.includes('medium')) {
    return `
**POST-ESCALATION ACKNOWLEDGMENT (Required):**

The student has a recent escalation alert. Smoothly acknowledge:

"I want you to know that your support team has been notified about what we discussed earlier, and they'll be checking in with you to make sure you have the help you need.

I'm here with you right now. [Then respond to their message naturally]"

**Key Points:**
- Brief, warm acknowledgment
- Focus on support, not alarm
- Continue conversation naturally
`;
  }
  
  // All other escalations
  return `
**POST-ESCALATION ACKNOWLEDGMENT:**

A support alert was sent. Brief acknowledgment:

"Your counselor has been notified and will follow up with you. [Then respond naturally]"

Keep it light and continue the conversation.
`;
}

/**
 * Format post-escalation context for prompt injection
 */
export function formatPostEscalationContextForPrompt(context: PostEscalationContext): string {
  if (!context.shouldAcknowledge) {
    return '';
  }
  
  return `
---
## 🟢 POST-ESCALATION SUPPORT ACTIVE

${context.acknowledgmentMessage}

**Remember:**
- Student is NOT in trouble
- This is supportive, not punitive
- Maintain warmth and presence
- Let them lead conversation direction
- Reference the crisis module for detailed post-escalation guidelines
---
`;
}

/**
 * Log that post-escalation acknowledgment was provided
 */
export async function logPostEscalationAcknowledgment(
  alertId: string,
  sessionId: string
): Promise<void> {
  try {
    // You could add a field to track this, or just log it
    console.log(`[PostEscalation] Acknowledgment provided for alert ${alertId} in session ${sessionId}`);
    
    // Optional: Update alert notes or metadata to track acknowledgment
    // await prisma.escalationAlert.update({
    //   where: { id: alertId },
    //   data: {
    //     notes: `Student acknowledged and continuing chat at ${new Date().toISOString()}`,
    //   },
    // });
  } catch (error) {
    console.error('[PostEscalation] Error logging acknowledgment:', error);
  }
}

export default {
  getPostEscalationContext,
  formatPostEscalationContextForPrompt,
  logPostEscalationAcknowledgment,
};
