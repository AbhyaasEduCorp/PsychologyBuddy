"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Search, X } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignChallengeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  challengeName?: string;
  challengeId?: string;
  startsAt?: string;
  endsAt?: string;
}

export function AssignChallengeDialog({
  open,
  onOpenChange,
  trigger,
  challengeName = "Breathing Exercises",
  challengeId,
  startsAt,
  endsAt,
}: AssignChallengeDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [targetType, setTargetType] = useState("individual");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleClose = () => onOpenChange?.(false);

  // Search students from API
  const searchStudents = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setStudents([]);
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      console.log('Making API call to search students...', query);
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query.trim())}`);
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      setStudents(data);
      setSearchError("");
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
      setSearchError(`Search failed: ${(error as any).message}`);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fetch class ID when grade and section are selected
  useEffect(() => {
    const fetchClassId = async () => {
      if (!selectedClass || !selectedSection || targetType !== 'class') return;

      try {
        const response = await fetch(`/api/classes?grade=${selectedClass}&section=${selectedSection}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setSelectedClassId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching class ID:', error);
      }
    };

    fetchClassId();
  }, [selectedClass, selectedSection, targetType]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStudents(studentSearch);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [studentSearch, searchStudents]);

  // Reset form when target type changes
  const handleTargetTypeChange = (type: string) => {
    setTargetType(type);
    setSelectedStudent(null);
    setStudentSearch("");
    setStudents([]);
    setSelectedClass("");
    setSelectedSection("");
    setIsSearching(false);
    setSearchError("");
  };

  // Auto-populate class and section when student is selected
  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setSelectedClass(student.class);
    setSelectedSection(student.section);
    setStudentSearch(student.name); // Show student name in search
    setStudents([]); // Clear search results
  };

  // Clear student search
  const handleClearSearch = () => {
    setStudentSearch("");
    setSelectedStudent(null);
    setStudents([]);
    setSearchError("");
    setSelectedClass("");
    setSelectedSection("");
  };

  const handleAssign = async () => {
    console.log('[ASSIGN] Starting assignment process...');
    console.log('[ASSIGN] Challenge ID:', challengeId);
    console.log('[ASSIGN] Challenge Dates from props:', { startsAt, endsAt });
    console.log('[ASSIGN] Target Type:', targetType);
    console.log('[ASSIGN] Selected Student:', selectedStudent);
    console.log('[ASSIGN] User:', user);
    
    if (!challengeId) {
      setSearchError("Challenge ID is required");
      return;
    }

    if (!startsAt || !endsAt) {
      setSearchError("Challenge dates are required");
      return;
    }

    setIsAssigning(true);
    setSearchError("");

    try {
      // Prepare assignment data
      const assignmentData: any = {
        challengeId,
        assignmentType: targetType === 'platform' ? 'SCHOOL' : targetType.toUpperCase(),
        startDate: startsAt,
        endDate: endsAt,
      };

      console.log('[ASSIGN] Base assignment data:', assignmentData);

      // Add target based on assignment type
      if (targetType === "individual") {
        if (!selectedStudent?.id) {
          console.error('[ASSIGN] No student selected for individual assignment');
          setSearchError("Please select a student");
          setIsAssigning(false);
          return;
        }
        assignmentData.targetUserId = selectedStudent.id;
        console.log('[ASSIGN] Added targetUserId:', selectedStudent.id);
      } else if (targetType === "class") {
        if (!selectedClassId) {
          console.error('[ASSIGN] No class selected for class assignment');
          setSearchError("Please select a valid class");
          setIsAssigning(false);
          return;
        }
        assignmentData.targetClassId = selectedClassId;
        console.log('[ASSIGN] Added targetClassId:', selectedClassId);
      } else if (targetType === "platform") {
        // For platform-wide assignment, use the user's school ID
        if (!user?.school?.id) {
          console.error('[ASSIGN] No school ID found for platform assignment');
          setSearchError("User school ID not found. Please ensure you are properly assigned to a school.");
          setIsAssigning(false);
          return;
        }
        assignmentData.targetSchoolId = user.school!.id;
        console.log('[ASSIGN] Added targetSchoolId:', user.school!.id);
      }

      console.log("[ASSIGN] Final assignment data:", assignmentData);

      const response = await fetch("/api/challenges/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Assignment validation error:', errorData);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${JSON.stringify(errorData.details)}` 
          : (errorData.error || errorData.message || `Assignment failed (${response.status})`);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Assignment successful:", result);

      // Invalidate challenges query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["counselor-challenges"] });

      // Show success toast
      toast({
        title: "Challenge assigned successfully",
        description: `Assigned to ${result.userChallenges} student(s)`,
      });
      
      handleClose();
    } catch (error) {
      console.error("Assignment error:", error);
      setSearchError(`Assignment failed: ${(error as any).message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Challenge</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenge:</label>
            <Input value={challengeName} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Type <span className="text-destructive">*</span>
            </label>
            <Select value={targetType} onValueChange={handleTargetTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual Student</SelectItem>
                <SelectItem value="class">Entire Class</SelectItem>
                <SelectItem value="platform">Entire Platform</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === "individual" && (
            <div className="space-y-2">
              <Label>
                Search Student <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter Student Name"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isSearching}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {!isSearching && studentSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Hint for minimum characters */}
              {studentSearch.trim().length > 0 && studentSearch.trim().length < 2 && (
                <p className="text-xs text-muted-foreground mt-1">Type at least 2 characters to search</p>
              )}
              
              {/* Show selected student */}
              {selectedStudent && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">{selectedStudent.name}</p>
                      <p className="text-xs text-blue-700">
                        ID: {selectedStudent.studentId} • Class {selectedStudent.class}-{selectedStudent.section}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      aria-label="Change student"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Error Display */}
              {searchError && (
                <p className="text-xs text-red-500 mt-1">{searchError}</p>
              )}
              
              {/* Search Results Dropdown */}
              {students.length > 0 && !isSearching && !selectedStudent && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-thin animate-in fade-in-0 zoom-in-95">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      className="w-full px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-left border-b border-gray-100 last:border-b-0"
                      onClick={() => handleStudentSelect(student)}
                    >
                      <div className="font-medium text-sm text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID: {student.studentId}
                        {student.class && ` • Class ${student.class}-${student.section}`}
                        {student.schoolName && ` • ${student.schoolName}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {targetType !== "platform" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Class <span className="text-destructive">*</span>
                </label>
                <Select 
                  value={selectedClass} 
                  onValueChange={setSelectedClass}
                  disabled={targetType === "individual" && selectedStudent !== null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {g}th Class
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {targetType === "individual" && selectedStudent && (
                  <p className="text-xs text-gray-500"></p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section <span className="text-destructive">*</span>
                </label>
                <Select 
                  value={selectedSection} 
                  onValueChange={setSelectedSection}
                  disabled={targetType === "individual" && selectedStudent !== null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D"].map((s) => (
                      <SelectItem key={s} value={s}>
                        Section - {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {targetType === "individual" && selectedStudent && (
                  <p className="text-xs text-gray-500"></p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1" 
              onClick={handleAssign}
              disabled={isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleClose}
              disabled={isAssigning}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

