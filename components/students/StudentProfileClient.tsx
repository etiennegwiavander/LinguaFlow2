"use client";

import { useState } from "react";
import MainLayout from "@/components/main-layout";
import { Student } from "@/types";
import { languages } from "@/lib/sample-data";
import {
  Book,
  Calendar,
  Edit,
  GraduationCap,
  Languages as LanguagesIcon,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import StudentForm from "@/components/students/StudentForm";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface LessonPlan {
  title: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string[];
}

interface StudentProfileClientProps {
  student: Student;
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLessons, setGeneratedLessons] = useState<LessonPlan[]>([]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || { code, name: code, flag: '🌐' };
  };

  const handleGenerateLessons = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-lesson-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate lesson plans');
      }

      const result = await response.json();
      
      if (result.success && result.lessons) {
        setGeneratedLessons(result.lessons);
        toast.success('AI lesson plans generated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error generating lessons:', error);
      toast.error(error.message || 'Failed to generate lesson plans. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const languageInfo = getLanguageInfo(student.target_language);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <LanguagesIcon className="h-4 w-4" />
                <span>{languageInfo.name}</span>
                <span>•</span>
                <Badge variant="outline" className="capitalize">
                  {student.level}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Student Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="mr-2 h-5 w-5" />
                Learning Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">End Goals</h3>
                <p className="text-sm text-muted-foreground">
                  {student.end_goals || "No end goals specified"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Learning Styles</h3>
                <div className="flex flex-wrap gap-2">
                  {student.learning_styles?.map((style) => (
                    <Badge key={style} variant="secondary">
                      {style}
                    </Badge>
                  )) || <span className="text-sm text-muted-foreground">No learning styles specified</span>}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Areas for Improvement</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Grammar Weaknesses
                      </h4>
                      <p className="text-sm">
                        {student.grammar_weaknesses || "None specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Vocabulary Gaps
                      </h4>
                      <p className="text-sm">
                        {student.vocabulary_gaps || "None specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Pronunciation Challenges
                      </h4>
                      <p className="text-sm">
                        {student.pronunciation_challenges || "None specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Conversational Fluency Barriers
                      </h4>
                      <p className="text-sm">
                        {student.conversational_fluency_barriers || "None specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Additional Notes</h3>
                <p className="text-sm text-muted-foreground">
                  {student.notes || "No additional notes"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lesson History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="mr-2 h-5 w-5" />
                Lesson History
              </CardTitle>
              <CardDescription>Recent lessons and upcoming sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Next Lesson</h3>
                    <p className="text-sm text-muted-foreground">
                      No upcoming lessons scheduled
                    </p>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Last Lesson</h3>
                    <p className="text-sm text-muted-foreground">
                      No previous lessons
                    </p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Lesson Architect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              AI Lesson Architect
            </CardTitle>
            <CardDescription>
              Generate personalized lesson plans based on student profile and learning history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Generate new lesson ideas tailored to {student.name}&apos;s learning style and goals
              </p>
              <Button
                onClick={handleGenerateLessons}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate Lesson Ideas
                  </>
                )}
              </Button>
            </div>

            {generatedLessons.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                {generatedLessons.map((lesson, index) => (
                  <AccordionItem key={index} value={`lesson-${index}`}>
                    <AccordionTrigger className="text-left">
                      {lesson.title}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Lesson Objectives</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {lesson.objectives.map((objective: string, objIndex: number) => (
                            <li key={objIndex}>{objective}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Activities</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {lesson.activities.map((activity: string, actIndex: number) => (
                            <li key={actIndex}>{activity}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Materials Needed</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {lesson.materials.map((material: string, matIndex: number) => (
                            <li key={matIndex}>{material}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Assessment Ideas</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {lesson.assessment.map((item: string, assIndex: number) => (
                            <li key={assIndex}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <StudentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          student={student}
        />
      </div>
    </MainLayout>
  );
}