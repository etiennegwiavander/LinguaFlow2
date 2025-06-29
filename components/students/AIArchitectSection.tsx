"use client";

import { useState } from "react";
import { Pencil, Sparkles, Target, BookOpen, Lightbulb, CheckSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import SubTopicSelectionDialog from "./SubTopicSelectionDialog";
import EditablePlanSection from "./EditablePlanSection";

interface AIArchitectSectionProps {
  student: Student;
}

interface LessonPlan {
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string[];
}

export default function AIArchitectSection({ student }: AIArchitectSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [lessonPlan, setLessonPlan] = useState<LessonPlan>({
    objectives: [
      "Introduce basic greetings and introductions",
      "Practice asking and answering simple personal questions",
      "Learn vocabulary related to personal information",
      "Develop confidence in speaking with proper pronunciation"
    ],
    activities: [
      "Warm-up: Greeting circle practice",
      "Guided dialogue: Personal information exchange",
      "Role-play: Meeting new people at an international event",
      "Listening exercise: Identifying personal details in conversations"
    ],
    materials: [
      "Flashcards with greeting expressions",
      "Handout with conversation templates",
      "Audio recordings of native speakers",
      "Visual aids showing different social contexts"
    ],
    assessment: [
      "Student can introduce themselves using appropriate expressions",
      "Student can ask and answer basic personal questions",
      "Student can recognize and use target vocabulary correctly",
      "Student demonstrates improved pronunciation of target sounds"
    ]
  });

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setGenerationProgress("Analyzing student profile...");
    
    try {
      // Simulate API call with progress updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress("Identifying learning objectives based on student level...");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGenerationProgress("Creating personalized activities...");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGenerationProgress("Finalizing lesson plan...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would call your API here
      // const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
      //   body: { studentId: student.id }
      // });
      
      // if (error) throw error;
      
      // Update with the generated plan
      // setLessonPlan(data.lessonPlan);
      
      toast.success("Lesson plan generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate lesson plan");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleOpenSubTopicDialog = () => {
    setIsDialogOpen(true);
  };

  const handleSavePlanSection = async (section: keyof LessonPlan, newContent: string[]) => {
    try {
      // In a real implementation, you would save to your database
      // const { error } = await supabase
      //   .from('lesson_plans')
      //   .update({ [section]: newContent })
      //   .eq('student_id', student.id);
      
      // if (error) throw error;
      
      // Update local state
      setLessonPlan(prev => ({
        ...prev,
        [section]: newContent
      }));
      
      return Promise.resolve();
    } catch (error: any) {
      toast.error(error.message || `Failed to save ${section}`);
      return Promise.reject(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge className="badge-cyber">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Architect
          </Badge>
          <h2 className="text-xl font-bold">Lesson Planning Assistant</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSubTopicDialog}
            className="btn-ghost-cyber"
          >
            <Target className="w-4 h-4 mr-2" />
            Choose Sub-topic
          </Button>
          <Button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            size="sm"
            className="btn-cyber"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </div>

      {isGenerating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Generating Personalized Lesson Plan
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {generationProgress || 'This may take a moment...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="cyber-card overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditablePlanSection
              title="Lesson Objectives"
              content={lessonPlan.objectives}
              onSave={(_, newContent) => handleSavePlanSection('objectives', newContent)}
              className="relative"
            />
            
            <EditablePlanSection
              title="Activities"
              content={lessonPlan.activities}
              onSave={(_, newContent) => handleSavePlanSection('activities', newContent)}
              className="relative"
            />
            
            <EditablePlanSection
              title="Materials Needed"
              content={lessonPlan.materials}
              onSave={(_, newContent) => handleSavePlanSection('materials', newContent)}
              className="relative"
            />
            
            <EditablePlanSection
              title="Assessment Ideas"
              content={lessonPlan.assessment}
              onSave={(_, newContent) => handleSavePlanSection('assessment', newContent)}
              className="relative"
            />
          </div>
        </CardContent>
      </Card>

      <SubTopicSelectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        subTopics={[
          {
            id: "1",
            title: "Grammar: Present Simple 'Be' (I am, You are, etc.)",
            category: "Grammar",
            level: "a1",
            description: "Learn to form and use the present simple tense of the verb 'be' to describe oneself and others. Focus on positive, negative, and question forms."
          },
          {
            id: "2",
            title: "Vocabulary: Personal Information (Name, Age, Nationality)",
            category: "Vocabulary",
            level: "a1",
            description: "Learn and practice vocabulary related to personal information including names, ages, countries, and nationalities."
          },
          {
            id: "3",
            title: "Conversation: Introducing Yourself",
            category: "Conversation",
            level: "a1",
            description: "Practice introducing yourself and asking others about their personal information in a conversational context."
          }
        ]}
        onSelectSubTopic={() => {}}
        isGenerating={false}
        generationProgress=""
      />
    </div>
  );
}