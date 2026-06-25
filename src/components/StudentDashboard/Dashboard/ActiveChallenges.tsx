"use client";

import { useState, useEffect } from "react";
import { Trophy, X, User, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  instructions?: string;
  createdBy?: string;
}

function CategoryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#3B82F61A] text-[#3B82F6]">
      {label}
    </span>
  );
}

export default function ActiveChallenges() {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/challenges');
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data: any = await response.json();
      
      if (data.data?.journaling) {
        const allActive = [
          ...(data.data.journaling.active || []),
          ...(data.data.meditation.active || []),
          ...(data.data.music.active || []),
          ...(data.data.article.active || [])
        ];
        
        const transformed = allActive.map((uc: any) => ({
          id: uc.challenge.id,
          title: uc.challenge.name,
          progress: uc.progressPercentage || 0,
          description: uc.challenge.description,
          instructions: uc.challenge.instructions || '',
          category: uc.challenge.category || 'General',
          startDate: uc.assignedAt,
          endDate: uc.challenge.endsAt,
          createdBy: uc.challenge.creator ? `${uc.challenge.creator.firstName} ${uc.challenge.creator.lastName}` : 'Admin'
        }));
        
        const unique = Array.from(new Map(transformed.map((i: Challenge) => [i.id, i])).values());
        setActiveChallenges(unique);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-8">
        <div className="flex h-14 w-14 rounded-xl bg-[#8B5CF6] items-center justify-center mb-4">
          <Trophy className="h-7 w-7 text-white animate-pulse" />
        </div>
        <p className="text-sm text-[#64748B]">Loading challenges...</p>
      </div>
    );
  }

  if (activeChallenges.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-8">
        <div className="flex h-14 w-14 rounded-xl bg-[#8B5CF6] items-center justify-center mb-4">
          <Trophy className="h-7 w-7 text-white" />
        </div>
        <h3 className="font-bold text-[#1E293B] mb-1">Active Challenges</h3>
        <p className="text-sm text-[#64748B]">No active challenges yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br 
                 from-[#C2B8F9]/20 via-[#E8E4FF]/53 to-[#C2B8F9]/20  rounded-[24px] border-2 border-white p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#C6BCFE] to-[#8C7CE7] flex items-center justify-center flex-shrink-0">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-[#1E293B]">Active Challenges</h2>
            <p className="text-[14px] text-[#64748B]">Tasks assigned by your counselor</p>
          </div>
        </div>

        <div className="space-y-4">
          {activeChallenges.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => {
                setSelectedChallenge(challenge);
                setIsModalOpen(true);
              }}
              className="w-full text-left"
            >
              <div className="">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1E293B] text-[16px] mb-2 truncate">
                      {challenge.title}
                    </h3>
                    <div className="w-full h-2 bg-[#ffffff] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8B5CF6] rounded-full transition-all duration-300"
                        style={{ width: `${challenge.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[#8B5CF6] font-bold text-[18px] ml-4">
                    {challenge.progress}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden rounded-[24px] border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedChallenge?.title || "Challenge Details"}</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-2">
                <CategoryPill label={selectedChallenge?.category || ""} />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedChallenge && selectedChallenge.endDate && selectedChallenge.startDate
                    ? Math.ceil((new Date(selectedChallenge.endDate).getTime() - new Date(selectedChallenge.startDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 0} Days
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B] mb-3">{selectedChallenge?.title}</h2>
                <p className="text-[#64748B] text-[15px] leading-relaxed">
                  {selectedChallenge?.description}
                </p>
              </div>

              <div>
                <h3 className="text-[16px] font-semibold text-[#1E293B] mb-4">Instructions</h3>
                <div className="space-y-4">
                  {(selectedChallenge?.instructions || "").split('\n').map((step, index) => {
                    const cleanStep = step.replace(/^\d+[\.\)]\s*/, '').trim();
                    if (!cleanStep) return null;
                    return (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#3B82F61A] text-[#3B82F6] text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-[#64748B] text-[15px] leading-snug pt-0.5">
                          {cleanStep}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#F8FAFC] rounded-[20px] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[#64748B]">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Assigned by</span>
                  </div>
                  <span className="text-sm font-medium text-[#1E293B]">{selectedChallenge?.createdBy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[#64748B]">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Assigned</span>
                  </div>
                  <span className="text-sm font-medium text-[#1E293B]">
                    {selectedChallenge?.startDate ? new Date(selectedChallenge.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
