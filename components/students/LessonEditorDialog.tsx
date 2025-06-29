"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lesson } from "@/types";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Edit3, 
  Save, 
  Loader2, 
  Calendar, 
  Clock, 
  AlertTriangle,
  FileJson,
  RefreshCw
} from "lucide-react";

interface LessonEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onLessonUpdated?: () => void;
}

export default function LessonEditorDialog({
  open,
  onOpenChange,
  studentId,
  onLessonUpdated
}: LessonEditorDialogProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [lessonContent, setLessonContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasJsonError, setHasJsonError] = useState(false);

  // Fetch lessons when dialog opens
  useEffect(() => {
    if (open && studentId) {
      fetchLessons();
    } else {
      // Reset state when dialog closes
      setSelectedLessonId("");
      setLessonContent("");
      setHasJsonError(false);
    }
  }, [open, studentId]);

  // Fetch lessons for the student
  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          student:students(*)
        `)
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setLessons(data || []);
      
      // Auto-select the first lesson if available
      if (data && data.length > 0) {
        setSelectedLessonId(data[0].id);
        loadLessonContent(data[0].id, data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Load lesson content when a lesson is selected
  const loadLessonContent = async (lessonId: string, lessonsList?: Lesson[]) => {
    const lessonsToUse = lessonsList || lessons;
    const selectedLesson = lessonsToUse.find(lesson => lesson.id === lessonId);
    
    if (!selectedLesson) {
      toast.error('Lesson not found');
      return;
    }

    try {
      // Format the JSON content for better readability
      const content = selectedLesson.interactive_lesson_content 
        ? JSON.stringify(selectedLesson.interactive_lesson_content, null, 2) 
        : "";
      
      setLessonContent(content);
      setHasJsonError(false);
    } catch (error: any) {
      toast.error('Failed to load lesson content');
      setLessonContent("");
    }
  };

  // Handle lesson selection change
  const handleLessonChange = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    loadLessonContent(lessonId);
  };

  // Validate JSON before saving
  const validateJson = (jsonString: string): boolean => {
    try {
      if (!jsonString.trim()) return true; // Empty string is valid (will clear the content)
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Save updated lesson content
  const handleSave = async () => {
    if (!selectedLessonId) {
      toast.error('No lesson selected');
      return;
    }

    // Validate JSON
    if (!validateJson(lessonContent)) {
      setHasJsonError(true);
      toast.error('Invalid JSON format. Please check your syntax.');
      return;
    }

    setIsSaving(true);
    try {
      const contentToSave = lessonContent.trim() 
        ? JSON.parse(lessonContent) 
        : null;

      const { error } = await supabase
        .from('lessons')
        .update({
          interactive_lesson_content: contentToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLessonId);

      if (error) throw error;
      
      toast.success('Lesson content updated successfully');
      setHasJsonError(false);
      
      if (onLessonUpdated) {
        onLessonUpdated();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update lesson content');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatLessonDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-cyber-400/30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/5 to-neon-400/5 rounded-lg pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-400/30 via-neon-400/30 to-cyber-400/30"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-neon-400/30 via-cyber-400/30 to-neon-400/30"></div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center text-xl">
            <Edit3 className="mr-2 h-6 w-6 text-cyber-400" />
            <span className="gradient-text">Edit Lesson Plan</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Select a lesson and edit its interactive content in JSON format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4 relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-cyber-400 mr-2" />
              <span>Loading lessons...</span>
            </div>
          ) : (
            <>
              {lessons.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Lessons Found</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no lessons available for this student.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="btn-ghost-cyber"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-select">Select a Lesson</Label>
                    <Select
                      value={selectedLessonId}
                      onValueChange={handleLessonChange}
                    >
                      <SelectTrigger className="input-cyber focus-cyber">
                        <SelectValue placeholder="Choose a lesson" />
                      </SelectTrigger>
                      <SelectContent className="glass-effect border-cyber-400/30">
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            <div className="flex items-center">
                              <span className="truncate">
                                {formatLessonDate(lesson.date)}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({lesson.status})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedLessonId && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-cyber-400" />
                            <span>
                              {formatLessonDate(
                                lessons.find(l => l.id === selectedLessonId)?.date || ''
                              )}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-neon-400" />
                            <span className="capitalize">
                              {lessons.find(l => l.id === selectedLessonId)?.status}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadLessonContent(selectedLessonId)}
                          className="text-xs hover:bg-cyber-400/10 hover:text-cyber-400"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reload
                        </Button>
                      </div>

                      <Separator className="my-4 bg-cyber-400/20" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label 
                            htmlFor="lesson-content" 
                            className="flex items-center"
                          >
                            <FileJson className="h-4 w-4 mr-2 text-cyber-400" />
                            Interactive Lesson Content (JSON)
                          </Label>
                          {hasJsonError && (
                            <span className="text-xs text-red-500 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Invalid JSON format
                            </span>
                          )}
                        </div>
                        <Textarea
                          id="lesson-content"
                          value={lessonContent}
                          onChange={(e) => {
                            setLessonContent(e.target.value);
                            setHasJsonError(!validateJson(e.target.value));
                          }}
                          className="font-mono text-sm min-h-[400px] border-cyber-400/30 focus:border-cyber-400"
                          placeholder="No interactive content available for this lesson."
                        />
                        <p className="text-xs text-muted-foreground">
                          Edit the JSON content carefully. Invalid JSON will prevent saving.
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="relative z-10">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="btn-ghost-cyber"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedLessonId || isSaving || hasJsonError}
            className="btn-cyber"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}