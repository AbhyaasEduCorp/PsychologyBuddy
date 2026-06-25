import { useState, useEffect } from "react";
import { Trophy, Users, CheckCircle2, UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChallengeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge?: {
    id: string;
    title: string;
    category: string;
  };
}

export function ChallengeDetailsDialog({
  open,
  onOpenChange,
  challenge,
}: ChallengeDetailsDialogProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && challenge?.id) {
      fetchChallengeStats();
    }
  }, [open, challenge?.id]);

  const fetchChallengeStats = async () => {
    setLoading(true);
    try {
      // Try to fetch full challenge details from the [id] endpoint
      const response = await fetch(`/api/challenges/${challenge?.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Transform the data to match expected format
          const challengeData = result.data;
          const participants = challengeData.participants || [];
          
          console.log('[ChallengeDetails] Total participants:', participants.length);
          console.log('[ChallengeDetails] Participants:', participants);
          
          // Calculate stats from participants
          // Assigned = total number of students (regardless of status)
          // In Progress = students currently working on it
          // Completed = students who finished it
          const stats = {
            assigned: participants.length, // Total students assigned
            inProgress: participants.filter((p: any) => p.status === 'IN_PROGRESS').length,
            completed: participants.filter((p: any) => p.status === 'COMPLETED').length,
          };
          
          console.log('[ChallengeDetails] Calculated stats:', stats);
          
          setData({
            title: challengeData.name,
            category: challengeData.category,
            description: challengeData.description,
            instructions: challengeData.instructions,
            startDate: new Date(challengeData.startsAt).toLocaleDateString(),
            endDate: new Date(challengeData.endsAt).toLocaleDateString(),
            createdBy: challengeData.createdBy,
            stats: stats,
            students: participants.map((p: any) => ({
              name: p.userName,
              className: p.userClass,
              status: p.status === 'COMPLETED' ? 'Completed' : p.status === 'IN_PROGRESS' ? 'In Progress' : 'Assigned',
            })),
          });
        }
      } else {
        console.error('Failed to fetch challenge details:', response.status);
        // Set error state
        setData(null);
      }
    } catch (error) {
      console.error("Error fetching challenge stats:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const platformData = data
  ? [
      {
        name: "Assigned",
        value: data.stats.assigned || 0,
        max: 25,
      },
      {
        name: "Completed",
        value: data.stats.completed || 0,
        max: 25,
      },
      {
        name: "In progress",
        value: data.stats.inProgress || 0,
        max: 25,
      },
    ]
  : [];

  console.log('[ChallengeDetails] Platform data for chart:', platformData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-thin sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6]/10">
              <Trophy className="h-6 w-6 text-[#3B82F6]" />
            </div>
            <div>
              <DialogTitle className="text-xl text-[#1E293B]">{data?.title || challenge?.title || "Challenge Details"}</DialogTitle>
              <div className="text-sm text-[#64748B]">
                {data?.category || challenge?.category || "Loading..."}
              </div>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4">
                <div>
                  <div className="text-xs text-[#64748B]">Start Date</div>
                  <div className="font-medium text-[#1E293B]">{data.startDate}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B]">End Date</div>
                  <div className="font-medium text-[#1E293B]">{data.endDate}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B]">Created By</div>
                  <div className="font-medium line-clamp-1 text-[#1E293B]">{data.createdBy}</div>
                </div>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-[#1E293B]">Description</h3>
                <p className="text-sm text-[#64748B]">{data.description}</p>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-[#1E293B]">Instructions</h3>
                <p className="text-sm text-[#64748B]">{data.instructions}</p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-[#1E293B]">Challenge activity</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-4">
                    <div className="flex items-center justify-between text-sm text-[#64748B]">
                      Assigned
                      <Users className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-[#1E293B]">
                      {data.stats.assigned}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-4">
                    <div className="flex items-center justify-between text-sm text-[#64748B]">
                      In Progress
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F59E0B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-[#1E293B]">
                      {data.stats.inProgress}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/5 p-4">
                    <div className="flex items-center justify-between text-sm text-[#64748B]">
                      Completed
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-[#1E293B]">
                      {data.stats.completed}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                <h3 className="mb-4 font-semibold text-[#475569]">Platform Activity</h3>
                <div className="relative h-[320px] w-full">
                  {/* Y-axis */}
                  <div className="absolute left-0 top-0 flex h-[280px] w-12 flex-col justify-between text-right">
                    {[25, 20, 15, 10, 5, 0].map((value) => (
                      <div key={value} className="relative flex items-center justify-end pr-2">
                        <span className="text-xs text-[#6B7280]">{value}</span>
                        <div className="absolute -right-0 h-px w-2 bg-[#9CA3AF]" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Vertical axis line */}
                  <div className="absolute left-12 top-0 h-[280px] w-px bg-[#D1D5DB]" />
                  
                  {/* Chart area */}
                  <div className="absolute left-12 top-0 right-0 h-[280px]">
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-px w-full border-t border-dashed border-[#D1D5DB]" />
                      ))}
                    </div>
                    
                    {/* Bars container */}
                    <div className="absolute inset-0 flex items-end justify-around px-8">
                      {platformData.map((item, index) => {
                        const heightPercent = (item.value / 25) * 100;
                        return (
                          <div key={index} className="flex flex-col items-center" style={{ width: '22%' }}>
                            <div className="relative w-full" style={{ height: '280px' }}>
                              <div 
                                className="absolute bottom-0 w-full rounded-t bg-[#3B82F6] transition-all"
                                style={{ height: `${heightPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* X-axis line */}
                  <div className="absolute bottom-10 left-12 right-0 h-px bg-[#D1D5DB]" />
                  
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-12 right-0 flex items-center justify-around px-8">
                    {platformData.map((item, index) => (
                      <div key={index} className="text-center text-xs text-[#6B7280]" style={{ width: '22%' }}>
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-[#1E293B]">
                  Assigned Students ({data.students.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.students.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9] text-xs font-bold text-[#64748B]">
                          {s.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#1E293B] truncate">{s.name}</div>
                          <div className="text-xs text-[#64748B] truncate">
                            {s.className}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium shrink-0 ${
                          s.status === "Completed"
                            ? "bg-[#10B981]/10 text-[#10B981]"
                            : "bg-[#3B82F6]/10 text-[#3B82F6]"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                ))}
              </div>
            </div>

            <Button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white" size="lg">
              <UserPlus className="mr-2 h-4 w-4" />
              Assign More Student
            </Button>
          </div>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-[#64748B]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#CBD5E1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="text-center">
              <p className="font-medium">Challenge not found</p>
              <p className="text-sm">This challenge may have been deleted or you don't have access to it.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

