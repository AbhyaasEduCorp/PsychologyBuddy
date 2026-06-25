"use client";
import { X, Sparkles, Lightbulb, Shield, ArrowUpRight } from "lucide-react";

import React, { useState, useRef, useCallback, useMemo, memo } from "react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useChat, useChatSummary, useServerAuth, useChatAccess } from "@/src/hooks";
import { useExerciseRecommendations } from "@/src/hooks/use-exercise-recommendations";
import { Message } from '@/src/hooks/use-chat';
import { NavigationUtils } from "@/src/utils";
import { FullPageLoading } from "@/components/ui/LoadingSpinner";
import { AuthError } from "@/components/ui/ErrorMessage";
import BackToDashboard from "../Layout/BackToDashboard";
import dynamic from 'next/dynamic';

// Lazy load ReactMarkdown for better performance
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

// Format timestamp to show only hours and minutes
const formatTime = (timestamp: string) => {
  try {
    // Handle different timestamp formats
    let date: Date;
    
    if (timestamp.includes('T')) {
      // ISO format: 2024-03-07T18:30:00.000Z
      date = new Date(timestamp);
    } else if (timestamp.includes(':')) {
      // Time format: 18:30:00
      const today = new Date();
      const [hours, minutes, seconds] = timestamp.split(':');
      date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                    parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
    } else {
      // Fallback - treat as ISO or try direct parsing
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return 'Invalid Date';
    }
    
    // Get hours and minutes
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    // Format with leading zeros
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${hoursStr}:${minutesStr} ${ampm}`;
  } catch (error) {
    console.warn('Timestamp parsing error:', error, 'for:', timestamp);
    return 'Invalid Date';
  }
};

// Types
interface ChatMessageData {
  id: string;
  sender: "student" | "bot";
  content: string;
  timestamp: string;
  type?: 'opening' | 'closing' | 'normal';
  importSuggestion?: {
    show: boolean;
    lastTopic?: string;
    lastDate?: string;
  };
}

interface ChatInterfaceProps {
  studentId?: string;
  moodCheckinId?: string;
  triggerId?: string;
  mood?: string;
  triggers?: string[];
  notes?: string;
}


// Chat Message Component - memoized to prevent unnecessary re-renders
const ChatMessage = memo(function ChatMessage({ 
  message, 
  onImportLastConversation,
  lastSession,
  showSummaryImport,
  isImportingFromReflections,
  onDismissSummary
}: { 
  message: ChatMessageData; 
  onImportLastConversation?: (topic?: string) => void;
  lastSession?: { mainTopic: string; id: string };
  showSummaryImport?: boolean;
  isImportingFromReflections?: boolean;
  onDismissSummary?: () => void;
}) {
  const isBot = message.sender === 'bot';
  const isStudent = message.sender === 'student';
  const [handleImportClick] = useState(() => () => {
    if (message.importSuggestion?.lastTopic) {
      onImportLastConversation?.(message.importSuggestion.lastTopic);
    }
  });

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 sm:mb-6 md:mb-8`}>
      {isBot && (
        <div className={`max-w-[85%] sm:max-w-[70%] md:max-w-[68%] lg:max-w-[65%]`}>
          {/* Logo and Label - Mobile Only */}
          <div className="mb-1 sm:hidden">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={16}
                height={16}
                className="w-4 h-4"
              />
            </span>
            <span className="inline-block align-middle text-[11px] font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-1">
              Psychology Buddy
            </span>
          </div>
          
          {/* Logo and Label on Same Line - Desktop and Tablet */}
          <div className="mb-1 hidden sm:block">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain"
              />
            </span>
            <span className="inline-block align-middle text-[13px] md:text-sm font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-2">
              Psychology Buddy
            </span>
          </div>
          
          {/* Message Bubble */}
          <div
            className={`px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 rounded-[24px] bg-[#F2F8FD] text-gray-800 rounded-tl-sm relative shadow-sm`}
          >
            <div className="text-gray-800 ml-2">
              <ReactMarkdown
                components={{
                  // Custom paragraph styling without typography plugin
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-sm sm:text-base md:text-[13px] lg:text-[16px]">{children}</p>,
                  br: () => <br className="block h-4" />, // Add space between paragraphs
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          
          {/* Legacy Import Suggestion UI (for backward compatibility) */}
          {message.importSuggestion?.show && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-2">
                I see we talked about {message.importSuggestion.lastTopic} in our last session on {new Date(message.importSuggestion.lastDate || '').toLocaleDateString()}. Would you like to continue that conversation?
              </p>
              <button
                onClick={handleImportClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Continue Previous Conversation
              </button>
            </div>
          )}
          
          {/* Timestamp */}
          <span className="text-[10px] sm:text-[11px] text-gray-400 mt-1 px-1 block">
            {formatTime(message.timestamp)}
          </span>
          
          {/* Import Suggestion UI for opening messages - Outside bubble */}
          {message.type === 'opening' && lastSession && showSummaryImport && !isImportingFromReflections && (
            <div className="mt-2">
              <LastSummaryImport
                mainTopic={lastSession.mainTopic}
                onImport={() => onImportLastConversation?.()}
                onDismiss={onDismissSummary || (() => {})}
              />
            </div>
          )}
        </div>
      )}
      
      {isStudent && (
        <div className={`max-w-[85%] sm:max-w-[70%] md:max-w-[68%] lg:max-w-[65%] text-right`}>
          {/* Message Bubble */}
          <div
            className={`px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 rounded-2xl bg-gradient-to-r from-[#0A77C2] to-[#65B7F0] text-white rounded-tr-sm shadow-sm`}
          >
            <p className="text-sm sm:text-base md:text-[13px] lg:text-[16px] leading-relaxed break-words">{message.content}</p>
          </div>
          
          {/* Timestamp */}
          <span className="text-[10px] sm:text-[11px] md:text-xs text-gray-400 mt-1 px-1 block">
            {formatTime(message.timestamp)}
          </span>
        </div>
      )}
    </div>
  );
});

// Typing Indicator Component - memoized
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-4 sm:mb-6">
      <div className=" text-gray-600 rounded-2xl rounded-tl-sm flex items-center">
        <Image 
          src="/Logo.png" 
          alt="Buddy Logo" 
          width={20} 
          height={20} 
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain animate-bounce"
        />
      </div>
    </div>
  );
});

// Chat Input Component - memoized with forwardRef
const ChatInput = memo(React.forwardRef<HTMLInputElement, {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}>(function ChatInput({ 
  input, 
  onInputChange, 
  onSend, 
  disabled = false,
  placeholder = "Type your message…" 
}, ref) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  return (
    <div className="px-3 sm:px-4 md:px-10 lg:px-15 py-3 sm:py-4 md:py-6 bg-white border-t border-[#f8f8f8]">
      <div className="flex gap-2 sm:gap-3 md:gap-4 items-center">
        <input
          ref={ref}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus
          className="flex-1 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 border-[1px] border-[#d4d4d4] rounded-full bg-[#fbfbfb] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#1B9EE0] focus:ring-1 focus:ring-[#1B9EE0] disabled:opacity-50 text-sm sm:text-[16px] md:text-[16px] min-w-0"
        />
        <Button
          onClick={onSend}
          disabled={disabled || !input.trim()}
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-gradient-to-r from-[#206894] to-[#36AFFA] hover:bg-[#1688bf] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
          size="icon"
        >
          <Image src="/Icons/Vector.png" alt="Send" width={16} height={16} className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7"></Image>
        </Button>
      </div>
    </div>
  );
}));

// Exercise Suggestions Component (as bot message) - memoized
const ExerciseSuggestions = memo(function ExerciseSuggestions({ 
  suggestions, 
  introText,
  onSuggestionClick, 
  onDismiss 
}: { 
  suggestions: any[];
  introText?: string;
  onSuggestionClick: (suggestion: any) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-2 max-w-[85%] sm:max-w-[75%]">
        {/* <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B9EE0] to-[#4FC3F7] flex items-center justify-center flex-shrink-0">
          <Image
            src="/Logo.png"
            alt="Psychology Buddy"
            width={20}
            height={20}
            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
          />
        </div> */}
        
        <div className="flex-1">
          <div className="mb-1 sm:hidden">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={16}
                height={16}
                className="w-4 h-4"
              />
            </span>
            <span className="inline-block align-middle text-[11px] font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-1">
              Psychology Buddy
            </span>
          </div>
          
          {/* Logo and Label on Same Line - Desktop Only */}
          <div className="mb-1 hidden sm:block">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            </span>
            <span className="inline-block align-middle text-[13px] font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-2">
              Psychology Buddy
            </span>
          </div>
          
          <div className="px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 rounded-[24px] bg-[#F2F8FD] text-gray-800 rounded-tl-sm shadow-sm">
            <div className="text-sm sm:text-base md:text-[17px] lg:text-[18px] leading-relaxed break-words">
              {/* Natural introduction text */}
              {introText && (
                <div className="mb-4 text-gray-700">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    }}
                  >
                    {introText}
                  </ReactMarkdown>
                </div>
              )}
              
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-[#2F3D43] px-2 bg-[#D5E4EF] w-[25px] h-[25px] rounded-full font-medium">{index + 1}</span>
                    <button
                      onClick={() => onSuggestionClick(suggestion)}
                      className="text-[16px] text-[#1B9EE0] hover:text-blue-800 underline font-medium flex items-center gap-1"
                    >
                      {suggestion.title}
                      {/* <span>→</span> */}
                      <ArrowUpRight className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Quick Replies Component - memoized
const QuickReplies = memo(function QuickReplies({ 
  replies, 
  onReplyClick, 
  className = "" 
}: {
  replies: string[];
  onReplyClick: (reply: string) => void;
  className?: string;
}) {
  if (!replies.length) return null;

  return (
    <div className={`px-3 sm:px-4 md:px-10 lg:px-15 py-2 sm:py-3 md:py-4 bg-white ${className}`}>
      <div className="text-xs md:text-[10px] font-medium text-gray-500 mb-1 sm:mb-2 md:mb-3">Quick replies:</div>
      <div className="flex gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
        {replies.map((reply) => (
          <button
            key={reply}
            onClick={() => onReplyClick(reply)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-1.5 bg-white border border-gray-200 rounded-full text-[11px] sm:text-[13px] md:text-[13px] text-gray-700 hover:bg-gray-50 hover:border-gray-300 whitespace-nowrap transition-colors flex-shrink-0"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
});

// Last Summary Import Component - memoized
const LastSummaryImport = memo(function LastSummaryImport({ 
  mainTopic, 
  onImport, 
  onDismiss 
}: { 
  mainTopic: string; 
  onImport: () => void; 
  onDismiss: () => void;
}) {
  return (
    <div className="w-[250px] h-[87px] sm:w-[289px] sm:h-[87px] md:w-[320px] md:h-[100px] mx-1 sm:mx-1 lg:mx-1 my-3 sm:my-4 md:my-5 p-3 sm:p-3 md:p-4 bg-[#F2F8FD] rounded-[12px] shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] sm:text-[14px] md:text-[16px] font-medium text-[#767676] -mb-1 sm:-mb-1">Related context available:</p>
    
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onImport}
            className="w-[160px] h-[29px] sm:w-[180px] sm:h-[29px] md:w-[200px] md:h-[34px] text-[#F38414] rounded-full border-[1px] border-[#FFE1C3] text-[10px] sm:text-[12px] md:text-[14px] font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#FF8E1C]" />
            Import from Last Session
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-[#767676] hover:text-gray-800 text-[11px] sm:text-[12px] md:text-sm font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
});

// Chat Header Component - memoized
const ChatHeader = memo(function ChatHeader({ onSummariesClick, onMoodCheckinClick }: {
  onSummariesClick: () => void;
  onMoodCheckinClick: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-[#1F85CD] to-[#6EC3FC] text-white px-3 sm:px-4 md:px-6 lg:px-6 py-3 sm:py-4 md:py-5 lg:py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
          <div className="w-6 h-6 sm:w-8 sm:h-10 md:w-10 md:h-12 rounded-full flex items-center justify-center">
           <Image 
                       src="/Logo.png" 
                       alt="Psychology Buddy Logo" 
                       width={46}
                       height={46}
                       className="w-[20px] h-[20px] sm:w-[30px] sm:h-[30px] md:w-[40px] md:h-[40px]"
                     />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg md:text-xl lg:text-[24px] font-semibold">Psychology Buddy</h2>
            <p className="text-xs sm:text-xs md:text-sm lg:text-[14px] text-[#F5F5F5] opacity-90 hidden sm:block">Your Emotional Support Companion</p>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 md:gap-3">
          <button
            onClick={onSummariesClick}
            className="flex items-center gap-1 sm:gap-2 md:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 sm:w-[146px] sm:h-[45px] md:w-[160px] md:h-[50px] bg-[#76C5FB] hover:bg-[#93cff8] rounded-[8px] sm:rounded-[12px] text-white text-[12px] sm:text-[16px] font-medium transition-colors shadow-sm"
          >
            <Image src="/Icons/ion_book-outline.png" alt="Book icon" width={14} height={14} className="filter brightness-0 invert w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"/>
            <span className="hidden sm:inline">Summaries</span>
          </button>
        </div>
      </div>
    </div>
  );
});

// Disclaimer Component - memoized
const Disclaimer = memo(function Disclaimer() {
  return (
    <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3  ">
      <div className="flex items-center justify-center gap-2">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-yellow-500 "
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 11.5V16h-4v-2.5c-1.68-.73-2.5-2.51-2.5-4.5 0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.99-.82 3.77-2.5 4.5z"/>
            <path d="M9 21h6v1c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-1z"/>
          </svg>
        </div>
        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 text-center">
          <span className="font-semibold">Remember:</span> Psychology Buddy provides supportive guidance, but if you're experiencing a crisis, please reach out to your school counselor or a trusted adult and this chat data appears to you only.
        </p>
      </div>
    </div>
  );
});

// Main Chat Interface Component
export default function ChatInterface({
  studentId,
  moodCheckinId,
  triggerId,
  mood,
  triggers,
  notes,
}: ChatInterfaceProps) {
  const router = useRouter();
  
  // Reusable authentication hook
  const { user, loading: authLoading, error: authError } = useServerAuth();
  
  // Reusable chat access hook - allows chat without mood if already checked in today
  const { canAccessChat, requiresMoodCheckin, params, loading: accessLoading, hasCheckedInToday } = useChatAccess();
  
  // Extract parameters for readability
  const { mood: accessMood, triggers: accessTriggers, notes: accessNotes, moodCheckinId: accessMoodCheckinId, triggerId: accessTriggerId } = params;

  // Combined loading state
  const loading = authLoading || accessLoading;
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummaryImport, setShowSummaryImport] = useState(true);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  
  // Input ref for auto-focus after sending message
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is importing from reflections page
  const [isImportingFromReflections, setIsImportingFromReflections] = useState(false);

  // Prevent duplicate quick reply API calls
  const isFetchingQuickRepliesRef = React.useRef(false);
  const hasInitializedQuickRepliesRef = React.useRef(false);

  // Fetch dynamic quick replies based on AI response
  const fetchQuickReplies = useCallback(async (botMessage: string, currentMessages: any[]) => {
    const currentMood = mood || accessMood;
    const currentTriggers = triggers || accessTriggers;
    const currentNotes = notes || accessNotes;
    
    console.log('fetchQuickReplies called:', { currentMood, currentTriggers, botMessage });
    
    // Prevent multiple simultaneous calls
    if (isFetchingQuickRepliesRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    isFetchingQuickRepliesRef.current = true;
    console.log('Fetching quick replies from API...');

    try {
      const response = await fetch('/api/students/chat/quick-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: currentMood,
          triggers: currentTriggers,
          notes: currentNotes,
          botMessage,
          lastMessages: currentMessages.slice(-8), // Extended for concern/crisis detection
          messageCount: currentMessages.length,
        }),
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        if (data.success && data.quickReplies) {
          console.log('Setting quick replies:', data.quickReplies);
          setQuickReplies(data.quickReplies);
        } else {
          console.log('API response missing quickReplies or success');
        }
      } else {
        console.log('API response not OK:', response.status);
      }
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      // Use fallback replies on error
      setQuickReplies(["I'm feeling anxious", "I need help with stress", "I'm feeling sad"]);
    } finally {
      isFetchingQuickRepliesRef.current = false;
    }
  }, [mood, accessMood, triggers, accessTriggers, notes, accessNotes]);

  // Set initial quick replies based on mood when chat loads
  React.useEffect(() => {
    // Only fetch once on mount
    if (!hasInitializedQuickRepliesRef.current) {
      hasInitializedQuickRepliesRef.current = true;
      const currentMood = mood || accessMood;
      const currentTriggers = triggers || accessTriggers;
      
      console.log('Initial quick replies effect:', { currentMood, currentTriggers });
      
      // Always fetch dynamic replies, regardless of mood/triggers
      fetchQuickReplies("", []);
    }
  }, []);
  
  // Check URL parameters for import on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const importedText = urlParams.get('import');
      const hasImportParam = !!importedText && importedText.trim() !== '';
      
      console.log('ChatInterface - Import check:', {
        importedText,
        hasImportParam,
        fullUrl: window.location.href
      });
      
      setIsImportingFromReflections(hasImportParam);
      
      // Hide the old summary import if coming from reflections
      if (hasImportParam) {
        setShowSummaryImport(false);
      }
    }
  }, []);

  // Memoize error handler to prevent infinite re-renders
  const handleError = useCallback((err: Error) => {
    console.error("Chat error:", err);
    setError(err.message);
  }, []);

  // Only call chat hooks when user is available - this prevents the "Student ID is required" error
  const chatHookResult = useChat({
    studentId: user?.studentId || user?.id || "",
    mood: mood || accessMood,
    triggers: triggers || accessTriggers,
    notes: notes || accessNotes,
    onError: user ? handleError : undefined, // Only pass error handler when user exists
  });

  const {
    messages,
    input: hookInput,
    isLoading: hookIsLoading,
    sessionId: hookSessionId,
    chatRef: hookChatRef,
    sendMessage,
    setInput,
    initializeChat,
    endChat,
    importConversation,
  } = chatHookResult;

  // Track last bot message to prevent duplicate quick reply calls
  const lastBotMessageIdRef = React.useRef<string | null>(null);

  // Watch for new bot messages and fetch quick replies
  React.useEffect(() => {
    console.log('Bot message watcher effect:', { messagesLength: messages.length, lastBotMessageId: lastBotMessageIdRef.current });
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('Last message:', { sender: lastMessage?.sender, id: lastMessage?.id, content: lastMessage?.content?.substring(0, 50) });
      
      if (lastMessage && lastMessage.sender === 'bot' && lastMessage.id !== lastBotMessageIdRef.current) {
        console.log('New bot message detected, fetching quick replies');
        lastBotMessageIdRef.current = lastMessage.id;
        fetchQuickReplies(lastMessage.content, messages);
      } else {
        console.log('Not a new bot message or already processed');
      }
    }
  }, [messages]);

  // Only call summary hook when user is available
  const summaryHookResult = useChatSummary({ studentId: user?.studentId || user?.id || "" });
  const { lastSession, importLastSession, getLastSessionMessages } = summaryHookResult;

  // Event handlers
  const handleQuickReply = useCallback((reply: string) => {
    if (reply.trim() && user) {
      // Hide summary import when student sends a message
      setShowSummaryImport(false);
      // Send the message directly instead of populating the input box
      sendMessage(reply);
      // Focus the input field after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [sendMessage, user]);

  const handleImportLastConversation = useCallback((topic?: string) => {
    console.log('Import clicked - lastSession:', lastSession)
    console.log('Import clicked - messages available:', lastSession?.messages?.length || 0)
    
    if (lastSession?.messages && lastSession.messages.length > 0) {
      // Import the full conversation history
      const previousMessages = getLastSessionMessages()
      console.log('Previous messages to import:', previousMessages)
      
      // Load previous conversation using the new importConversation method
      if (previousMessages.length > 0) {
        const sessionStartTime = new Date(lastSession.sessionStartedAt).getTime()
        importConversation(previousMessages, lastSession.sessionId, sessionStartTime)
        console.log('Imported conversation with session ID:', lastSession.sessionId, 'start time:', lastSession.sessionStartedAt)
        
        // Hide the import suggestion
        setShowSummaryImport(false)
        
        // Set a continuation message in the input
        const continuationText = topic 
          ? `I'd like to continue our conversation about ${topic} from our last session.`
          : `I'd like to continue our conversation from where we left off.`
        setInput(continuationText)
        console.log('Set continuation text:', continuationText)
      }
    } else {
      // Fallback to text-only import if no messages are available
      console.log('No messages found, falling back to text import')
      const importedText = topic 
        ? `I'd like to continue our conversation about ${topic} from our last session.`
        : importLastSession() || ''
      setInput(importedText)
    }
  }, [lastSession, getLastSessionMessages, importLastSession, setInput, importConversation])

  const handleDismissSummary = useCallback(() => {
    setShowSummaryImport(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (hookInput.trim() && user) { // Only send message if user exists
      // Hide summary import when student sends their first message
      setShowSummaryImport(false);
      sendMessage(hookInput);
      setInput("");
      // Focus the input field after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [hookInput, sendMessage, user, setInput]);

  const handleSummariesClick = useCallback(() => {
    router.push('/students/reflections');
  }, [router]);

  const handleMoodCheckinClick = useCallback(() => {
    router.push('/students/mood-checkin');
  }, [router]);

  // Update local state from hooks
  React.useEffect(() => {
    setIsLoading(hookIsLoading);
  }, [hookIsLoading]);

  // Auto-focus input field after bot responds (when loading finishes)
  React.useEffect(() => {
    if (!hookIsLoading && inputRef.current) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [hookIsLoading]);

  // Auto-focus input field on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500); // Longer delay for initial mount
    return () => clearTimeout(timer);
  }, []);

  // Debug logging only - use-chat.ts handles all chat initialization
  React.useEffect(() => {
    console.log('ChatInterface Debug:', {
      user: user?.id,
      mood: mood || accessMood,
      triggers: triggers || accessTriggers,
      notes: notes || accessNotes,
      messages: messages.length,
      hookSessionId,
      hookIsLoading
    });
  }, [user?.id, messages.length, hookSessionId, hookIsLoading]);

  // ==========================================
  // NEW: Intelligent Exercise Recommendations
  // Based on conversation state, not message count
  // ==========================================
  const {
    shouldShowRecommendations,
    recommendations,
    introductionText,
    conversationState,
    dismiss: dismissRecommendations,
    markShown: markRecommendationsShown
  } = useExerciseRecommendations({
    messages: messages,
    enabled: !!user // Only enable when user is authenticated
  });

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: any) => {
    markRecommendationsShown(); // Mark as shown when user clicks
    dismissRecommendations(); // Dismiss the component
    router.push(suggestion.url);
  }, [markRecommendationsShown, dismissRecommendations, router]);

  // Log conversation state for debugging (optional)
  React.useEffect(() => {
    if (conversationState) {
      console.log('[ChatInterface] Conversation State:', {
        stage: conversationState.stage,
        emotion: conversationState.emotion,
        readinessScore: conversationState.readinessScore,
        shouldShow: shouldShowRecommendations
      });
    }
  }, [conversationState, shouldShowRecommendations]);

  // Auto-import summary text into input when coming from summaries page
  // REMOVED: We don't want to automatically set the input when importing from reflections
  // The user should manually send the message after seeing the context-aware opening message

  // Handle authentication error
  // if (authError || !user) {
  //   return (
  //     <div className="min-h-screen bg-[#F8F9FA]">
  //       <div className="max-w-7xl mx-auto pt-3 sm:pt-4 px-3 sm:px-4 lg:px-6">
  //         <BackToDashboard />
  //       </div>
  //       <div className="min-h-screen flex items-center justify-center">
  //         <AuthError onRetry={() => NavigationUtils.navigateToLogin(router)} />
  //       </div>
  //     </div>
  //   );
  // }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto pt-3 sm:pt-4 px-3 sm:px-4 lg:px-6">
          <BackToDashboard />
        </div>
        <FullPageLoading message="Loading chat..." />
      </div>
    );
  }

  // Redirect if mood checkin is required (handled by hook, but double-check)
  if (requiresMoodCheckin) {
    NavigationUtils.navigateToMoodCheckin(router);
    return null;
  }

  return (
    <div className="max-h-screen bg-[#F8F9FA]">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto pt-6 sm:pt-7 px-3 sm:px-4 lg:px-4">
        <BackToDashboard />
      </div>

      {/* Chat Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-9 py-3 sm:py-1 lg:py-1">
        <div className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] lg:h-[calc(100vh-150px)] bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          {/* Chat Header */}
          <ChatHeader onSummariesClick={handleSummariesClick} onMoodCheckinClick={handleMoodCheckinClick} />

          {/* Last Summary Import - Hide when importing from reflections */}
        

          {/* Error Display */}
          {error && (
            <div className="mx-3 sm:mx-4 lg:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-xs sm:text-sm text-center">{error}</p>
          </div>
          )}

          {/* Chat Area */}
          <div ref={hookChatRef} className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 lg:px-15 py-3 sm:py-4 md:py-6 lg:py-6 bg-white">
           
              

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 md:px-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#1B9EE0] to-[#4FC3F7] flex items-center justify-center mb-3 sm:mb-4 md:mb-6 shadow-md">
                  <svg width="28" height="28" className="sm:w-8 sm:h-8 md:w-10 md:h-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-1 sm:mb-2 md:mb-3">Hi there! 👋</h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-sm sm:max-w-md md:max-w-lg leading-relaxed">
                  I&apos;m here to listen and support you. Feel free to share what&apos;s on your mind.
                </p>
              </div>
            )}

            {messages.map((message: Message) => (
              <ChatMessage 
                key={message.id} 
                message={{
                  id: message.id,
                  sender: message.sender,
                  content: message.content,
                  timestamp: message.timestamp,
                  type: message.type,
                  importSuggestion: message.importSuggestion,
                }} 
                onImportLastConversation={handleImportLastConversation}
                lastSession={lastSession || undefined}
                showSummaryImport={showSummaryImport}
                isImportingFromReflections={isImportingFromReflections}
                onDismissSummary={handleDismissSummary}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Exercise Suggestions - NEW: State-based recommendations */}
            {shouldShowRecommendations && recommendations.length > 0 && (
              <ExerciseSuggestions
                suggestions={recommendations}
                introText={introductionText}
                onSuggestionClick={handleSuggestionClick}
                onDismiss={dismissRecommendations}
              />
            )}

          </div>

          {/* Quick Replies */}
          <QuickReplies
            replies={quickReplies}
            onReplyClick={handleQuickReply}
          />

          {/* Chat Input */}
          <ChatInput
            ref={inputRef}
            input={hookInput}
            onInputChange={setInput}
            onSend={handleSendMessage}
            disabled={isLoading}
          />

          {/* Disclaimer */}
        </div>
      </div>
          <Disclaimer />
    </div>
  );
}

