/**
 * Conversation State Store
 * 
 * In-memory storage for conversation state per session
 * Prevents redirect bypass and tracks topic locks
 */

import { ConversationState, ConversationStateTracker } from './conversation-state-tracker';

class ConversationStateStore {
  private store: Map<string, ConversationState> = new Map();
  
  /**
   * Get state for session (or create empty)
   */
  get(sessionId: string): ConversationState {
    if (!this.store.has(sessionId)) {
      this.store.set(sessionId, ConversationStateTracker.createEmpty());
    }
    return this.store.get(sessionId)!;
  }
  
  /**
   * Update state for session
   */
  set(sessionId: string, state: ConversationState): void {
    this.store.set(sessionId, state);
  }
  
  /**
   * Clear state for session
   */
  clear(sessionId: string): void {
    this.store.delete(sessionId);
  }
  
  /**
   * Clear old states (cleanup)
   */
  cleanup(maxAgeMinutes: number = 60): void {
    const now = new Date();
    for (const [sessionId, state] of this.store.entries()) {
      if (state.topicLockedAt) {
        const ageMinutes = (now.getTime() - state.topicLockedAt.getTime()) / 1000 / 60;
        if (ageMinutes > maxAgeMinutes) {
          this.store.delete(sessionId);
        }
      }
    }
  }
}

// Singleton instance
export const conversationStateStore = new ConversationStateStore();

// Cleanup every 30 minutes
setInterval(() => {
  conversationStateStore.cleanup(60);
}, 30 * 60 * 1000);
