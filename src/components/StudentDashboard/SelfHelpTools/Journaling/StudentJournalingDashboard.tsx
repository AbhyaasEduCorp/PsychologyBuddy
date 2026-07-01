'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import JournalTabs from './JournalTabs';
import WritingJournalEditor from './Writing/JournalEditor';
import WritingPrompts from './Writing/WritingPrompts';
import PastEntries from './Writing/PastEntries';
import AudioRecorder from './Audio/AudioRecorder';
import AudioJournalList from './Audio/AudioJournalList';
import { RingSpinner } from '@/components/ui/Spinners';
import DrawingCanvas from './Art/DrawingCanvas';
import ArtPrompts from './Art/ArtPrompts';
import JournalHistory from './Art/JournalHistory';
import MoodSelector from './MoodSelector';
import Header from './Header';

interface JournalingConfig {
  writingEnabled: boolean;
  audioEnabled: boolean;
  artEnabled: boolean;
  maxAudioDuration?: number;
  enableUndo?: boolean;
  enableRedo?: boolean;
  enableClearCanvas?: boolean;
  enableColorPalette?: boolean;
}

export default function StudentJournalingDashboard() {
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'writing' | 'audio' | 'art'>('writing');
  const [config, setConfig] = useState<JournalingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const moodRef = useRef<string | null>(null);

  // Writing journal state
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  // Art journal state
  const [artPrompt, setArtPrompt] = useState<string | null>(null);
  const [artPrompts, setArtPrompts] = useState<Array<{ id: string; text: string; type: string; isEnabled: boolean }>>([]);
  const [isSavingArt, setIsSavingArt] = useState(false);
  const [artJournals, setArtJournals] = useState<Array<{ id: string; imageUrl: string; createdAt: string }>>([]);
  const [isDeletingArt, setIsDeletingArt] = useState(false);
  
  // Fetch journaling configuration for student's school
  const fetchJournalingConfig = async () => {
    console.log('=== STUDENT CONFIG FETCH START ===');
    console.log('Student user:', user);
    
    try {
      const response = await fetch('/api/student/journaling/config', {
        headers: {
          "x-user-id": user?.id || "",
        },
      });
      
      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success && data.data) {
        const newConfig = {
          writingEnabled: data.data.enableWriting || false,
          audioEnabled: data.data.enableAudio || false,
          artEnabled: data.data.enableArt || false,
          maxAudioDuration: data.data.maxAudioDuration,
          enableUndo: data.data.enableUndo,
          enableRedo: data.data.enableRedo,
          enableClearCanvas: data.data.enableClearCanvas,
          enableColorPalette: data.data.enableColorPalette,
        };
        
        console.log('Setting config to:', newConfig);
        setConfig(newConfig);
        
        // Set default tab to first enabled type
        if (data.data.enableWriting) {
          setActiveTab('writing');
        } else if (data.data.enableAudio) {
          setActiveTab('audio');
        } else if (data.data.enableArt) {
          setActiveTab('art');
        }
      } else {
        console.error('Failed to load journaling configuration:', data);
      }
    } catch (error) {
      console.error('Failed to fetch journaling config:', error);
    } finally {
      setLoading(false);
      console.log('=== STUDENT CONFIG FETCH END ===');
    }
  };
  
  // Handle prompt selection
  const handlePromptSelect = (prompt: string) => {
    console.log('Dashboard - handlePromptSelect called with:', prompt);
    setSelectedPrompt(prompt);
    // Auto-generate title from prompt if no title exists
    if (!journalTitle.trim()) {
      // Create a shorter title from the prompt (first 50 characters)
      const titleFromPrompt = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
      setJournalTitle(titleFromPrompt);
    }
  };

  // Save writing journal
  const saveWritingJournal = async () => {
    console.log('=== SAVE DEBUG ===');
    console.log('selectedMood state:', selectedMood);
    console.log('moodRef.current:', moodRef.current);

    if (!journalContent.trim()) {
      return;
    }

    setIsSavingJournal(true);
    try {
      const payload = {
        title: journalTitle || 'Untitled Entry',
        content: selectedPrompt ? `Prompt: ${selectedPrompt}\n\n${journalContent}` : journalContent,
        mood: moodRef.current,
      };
      console.log('Sending payload:', payload);

      const response = await fetch('/api/student/journals/writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Clear form
        setJournalTitle('');
        setJournalContent('');
        setSelectedPrompt(null);
        setSelectedMood(null);
        moodRef.current = null;
      }
    } catch (error) {
      console.error('Failed to save journal:', error);
    } finally {
      setIsSavingJournal(false);
    }
  };

  // Handle mood selection - update both state and ref
  const handleMoodSelect = (mood: string | null) => {
    setSelectedMood(mood);
    moodRef.current = mood;
  };

  // Fetch a random art prompt
  const handleNewArtPrompt = () => {
    if (artPrompts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * artPrompts.length);
    setArtPrompt(artPrompts[randomIndex].text);
  };

  // Handle art prompt selection from list
  const handleArtPromptSelect = (prompt: string) => {
    setArtPrompt(prompt);
  };

  // Fetch art journals
  const fetchArtJournals = async () => {
    try {
      const response = await fetch('/api/student/journals/art', {
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setArtJournals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch art journals:', error);
    }
  };

  // Delete art journal
  const deleteArtJournal = async (id: string) => {
    setIsDeletingArt(true);
    try {
      const response = await fetch(`/api/student/journals/art?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setArtJournals(prev => prev.filter(j => j.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete art journal:', error);
    } finally {
      setIsDeletingArt(false);
    }
  };

  // Save art journal
  const saveArtJournal = async (imageDataUrl: string) => {
    setIsSavingArt(true);
    try {
      const response = await fetch('/api/student/journals/art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          imageUrl: imageDataUrl,
          prompt: artPrompt || undefined,
          mood: moodRef.current,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setArtPrompt(null);
        fetchArtJournals();
      }
    } catch (error) {
      console.error('Failed to save art journal:', error);
    } finally {
      setIsSavingArt(false);
    }
  };
  
  // Load configuration on mount
  useEffect(() => {
    fetchJournalingConfig();
  }, [user?.id]);

  // Fetch art journals on mount
  useEffect(() => {
    if (user?.id) {
      fetchArtJournals();
    }
  }, [user?.id]);

  // Fetch art prompts for the "New Prompt" button
  useEffect(() => {
    const fetchArtPrompts = async () => {
      try {
        const response = await fetch('/api/admin/journaling/prompts');
        const data = await response.json();
        if (data.success && data.data) {
          const artOnly = data.data.filter((p: any) => p.type === 'ART' && p.isEnabled);
          setArtPrompts(artOnly);
        }
      } catch (error) {
        console.error('Failed to fetch art prompts:', error);
      }
    };
    fetchArtPrompts();
  }, [user?.id]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RingSpinner size="lg" color="blue" className="mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Loading journaling tools...</p>
        </div>
      </div>
    );
  }
  
  // If no journaling types are enabled
  if (!config?.writingEnabled && !config?.audioEnabled && !config?.artEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center">
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm max-w-sm sm:max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">📝</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Journaling Not Available</h3>
              <p className="text-sm sm:text-base text-gray-600">Journaling tools are not currently enabled for your school. Please contact your administrator for more information.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
   
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Journal Space</h1>
          <p className="text-sm sm:text-base text-gray-600">Express yourself through writing, audio, or art</p>
        </div>
        
        {/* Journal Tabs */}
        <JournalTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          config={config || undefined}
        />
        
        {/* Mood Selector */}
        <div className="mb-6">
          <MoodSelector
            selectedMood={selectedMood}
            onMoodSelect={handleMoodSelect}
          />
        </div>
        
        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'writing' && config?.writingEnabled && (
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
              <div id="writing-prompts" className="w-full md:w-[260px] lg:w-[340px] flex-shrink-0">
                <WritingPrompts onPromptSelect={handlePromptSelect} />
              </div>
              <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
                <WritingJournalEditor
                  title={journalTitle}
                  content={journalContent}
                  prompt={selectedPrompt || undefined}
                  onTitleChange={setJournalTitle}
                  onContentChange={setJournalContent}
                  onSave={saveWritingJournal}
                  onClear={() => {
                    setJournalTitle('');
                    setJournalContent('');
                    setSelectedPrompt(null);
                  }}
                  loading={isSavingJournal}
                />
                {/* PastEntries will be implemented with proper props later */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Past Entries</h3>
                  <p className="text-sm sm:text-base text-gray-500">Your past journal entries will appear here.</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'audio' && config?.audioEnabled && (
            <div className="space-y-4 sm:space-y-6">
              {/* AudioRecorder will be implemented with proper props later */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Audio Recorder</h3>
                <p className="text-sm sm:text-base text-gray-500">Audio recording will be available here.</p>
              </div>
              {/* AudioJournalList will be implemented with proper props later */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Audio Journal History</h3>
                <p className="text-sm sm:text-base text-gray-500">Your audio journal entries will appear here.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'art' && config?.artEnabled && (
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
              <div id="art-prompts" className="w-full md:w-[260px] lg:w-[340px] flex-shrink-0">
                <ArtPrompts onPromptSelect={handleArtPromptSelect} />
              </div>
              <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
                <DrawingCanvas
                  onSave={saveArtJournal}
                  loading={isSavingArt}
                  prompt={artPrompt || undefined}
                  onNewPrompt={handleNewArtPrompt}
                  config={{
                    enableUndo: config?.enableUndo,
                    enableRedo: config?.enableRedo,
                    enableClearCanvas: config?.enableClearCanvas,
                    enableColorPalette: config?.enableColorPalette,
                  }}
                />
                <JournalHistory
                  journals={artJournals}
                  onDelete={deleteArtJournal}
                  loading={isDeletingArt}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

