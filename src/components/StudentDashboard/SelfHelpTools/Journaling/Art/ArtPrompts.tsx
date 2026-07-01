'use client';

import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

interface JournalPrompt {
  id: string;
  text: string;
  type: "WRITING" | "ART";
  moodIds: string[];
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ArtPromptsProps {
  onPromptSelect?: (prompt: string) => void;
}

export default function ArtPrompts({ onPromptSelect }: ArtPromptsProps) {
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/admin/journaling/prompts');
        const data = await response.json();
        if (data.success && data.data) {
          // Filter only ART type prompts
          const artPrompts = data.data.filter((prompt: JournalPrompt) => 
            prompt.type === 'ART' && prompt.isEnabled
          );
          setPrompts(artPrompts);
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const handlePromptClick = (prompt: JournalPrompt) => {
    console.log('ArtPrompts - prompt clicked:', prompt.text);
    onPromptSelect?.(prompt.text);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 w-full shadow-sm flex flex-col">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-2 sm:p-2.5 bg-purple-50 rounded-xl">
            <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">Art Prompts</h3>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6 pl-8 sm:pl-12">
          Need inspiration? Try one of these:
        </p>
        <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[500px] pr-2 custom-scrollbar">
          {prompts.map((prompt, index) => (
            <div 
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="p-3 sm:p-4 rounded-2xl border border-slate-100 text-slate-600 text-xs sm:text-sm transition-all cursor-pointer hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            >
              {prompt.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] p-4 sm:p-6 border border-slate-100 w-full shadow-sm flex flex-col">
      <div className="flex items-center gap-2 sm:gap-3 mb-2">
        <div className="p-0.5 sm:-p-2 rounded-xl">
<img src="/selfhelptools/journaling/Prompt.svg" alt="Editor" className="w-[45px] h-[45px] sm:w-[63px] sm:h-[63px]" />        </div>
        <h3 className="font-bold text-slate-900 text-base sm:text-[24px]">Art Prompts</h3>
      </div>
      <p className="text-[#686D70] text-[12px] sm:text-[16px] mb-4 sm:mb-6 pl-8 sm:pl-3">
        Need inspiration? Try one of these:
      </p>
      <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[500px] pr-2 custom-scrollbar">
        {prompts.map((prompt, index) => (
          <div 
            key={index}
            onClick={() => handlePromptClick(prompt)}
            className="p-3 sm:p-4 rounded-[16px] border border-[#EFEFEF] text-slate-600 text-xs sm:text-sm transition-all cursor-pointer hover:border-slate-300 hover:bg-[#EEF5FF] hover:text-slate-700"
          >
            {prompt.text}
          </div>
        ))}
      </div>
    </div>
  );
}
