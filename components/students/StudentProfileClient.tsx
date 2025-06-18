"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Student, Lesson, SubTopic } from "@/types";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  GraduationCap,
  Loader2,
  Sparkles,
  User,
  BookOpen,
  Play,
  Target,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/components/main-layout";
import LessonMaterialDisplay from "@/components/lessons/LessonMaterialDisplay";
import SubTopicSelectionDialog from "@/components/students/SubTopicSelectionDialog";

interface StudentProfileClientProps {
  student: Student;
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [isGeneratingInteractive, setIsGeneratingInteractive] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [availableSubTopics, setAvailableSubTopics] = useState<SubTopic[]>([]);

  useEffect(() => {
    console.log("🔍 StudentProfileClient mounted with student:", student);
    fetchLessons();
  }, [student.id, user]);

  const fetchLessons = async () => {
    if (!user) return;

    try {
      console.log("📚 Fetching lessons for student:", student.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', student.id)
        .eq('tutor_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      console.log("✅ Lessons fetched successfully:", data);
      console.log("📊 Number of lessons:", data?.length || 0);
      
      // Log detailed information about each lesson
      data?.forEach((lesson, index) => {
        console.log(`📝 Lesson ${index + 1}:`, {
          id: lesson.id,
          date: lesson.date,
          status: lesson.status,
          hasInteractiveContent: !!lesson.interactive_lesson_content,
          interactiveContentType: typeof lesson.interactive_lesson_content,
          interactiveContentKeys: lesson.interactive_lesson_content ? Object.keys(lesson.interactive_lesson_content) : null,
          hasSubTopics: !!lesson.sub_topics,
          subTopicsCount: lesson.sub_topics ? lesson.sub_topics.length : 0
        });
      });

      const lessonsWithStudent = data?.map(lesson => ({
        ...lesson,
        student
      })) || [];

      setLessons(lessonsWithStudent);
    } catch (error: any) {
      console.error("❌ Error fetching lessons:", error);
      toast.error(error.message || 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const generateLessonPlans = async () => {
    if (!user) return;

    setIsGeneratingLessons(true);
    setGenerationProgress("Analyzing student profile...");

    try {
      console.log("🚀 Starting lesson plan generation for student:", student.id);
      
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
          student_id: student.id,
          tutor_id: user.id
        }),
      });

      console.log("📡 Lesson generation response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Lesson generation failed:", errorData);
        throw new Error(errorData.error || 'Failed to generate lesson plans');
      }

      const result = await response.json();
      console.log("✅ Lesson generation result:", result);

      if (result.success) {
        toast.success('Lesson plans generated successfully!');
        await fetchLessons(); // Refresh lessons
      } else {
        throw new Error(result.error || 'Failed to generate lesson plans');
      }
    } catch (error: any) {
      console.error("❌ Lesson generation error:", error);
      toast.error(error.message || 'Failed to generate lesson plans');
    } finally {
      setIsGeneratingLessons(false);
      setGenerationProgress("");
    }
  };

  const handleGenerateInteractiveMaterial = async (lesson: Lesson) => {
    console.log("🎯 Starting interactive material generation for lesson:", lesson.id);
    console.log("📋 Lesson data:", {
      id: lesson.id,
      hasSubTopics: !!lesson.sub_topics,
      subTopicsCount: lesson.sub_topics ? lesson.sub_topics.length : 0,
      subTopics: lesson.sub_topics
    });

    if (!lesson.sub_topics || lesson.sub_topics.length === 0) {
      console.log("⚠️ No sub-topics available, generating lesson plans first...");
      toast.error('No sub-topics available. Please generate lesson plans first.');
      return;
    }

    setAvailableSubTopics(lesson.sub_topics);
    setSelectedLesson(lesson);
    setIsSubTopicDialogOpen(true);
  };

  const generateInteractiveMaterial = async (subTopic: SubTopic) => {
    if (!user || !selectedLesson) return;

    setIsGeneratingInteractive(true);
    setGenerationProgress("Creating interactive lesson material...");
    setIsSubTopicDialogOpen(false);

    try {
      console.log("🎨 Generating interactive material for sub-topic:", subTopic);
      console.log("📚 Selected lesson:", selectedLesson.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-interactive-material`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: selectedLesson.id,
          student_id: student.id,
          tutor_id: user.id,
          sub_topic: subTopic
        }),
      });

      console.log("📡 Interactive material generation response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Interactive material generation failed:", errorData);
        throw new Error(errorData.error || 'Failed to generate interactive material');
      }

      const result = await response.json();
      console.log("✅ Interactive material generation result:", result);

      if (result.success) {
        console.log("🎉 Interactive material generated successfully!");
        toast.success('Interactive lesson material created successfully!');
        await fetchLessons(); // Refresh lessons to get updated content
        
        // Find the updated lesson and display it
        const updatedLessons = await supabase
          .from('lessons')
          .select('*')
          .eq('id', selectedLesson.id)
          .single();
          
        if (updatedLessons.data) {
          console.log("📖 Updated lesson with interactive content:", updatedLessons.data);
          const updatedLesson = { ...updatedLessons.data, student };
          setSelectedLesson(updatedLesson);
        }
      } else {
        throw new Error(result.error || 'Failed to generate interactive material');
      }
    } catch (error: any) {
      console.error("❌ Interactive material generation error:", error);
      toast.error(error.message || 'Failed to generate interactive material');
    } finally {
      setIsGeneratingInteractive(false);
      setGenerationProgress("");
    }
  };

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

  const targetLanguageInfo = getLanguageInfo(student.target_language);
  const nativeLanguageInfo = student.native_language ? getLanguageInfo(student.native_language) : null;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyber-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading student profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-cyber-400/30 hover:bg-cyber-400/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 ring-2 ring-cyber-400/20">
                <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
                <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 text-lg">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  <span className="gradient-text">{student.name}</span>
                </h1>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{targetLanguageInfo.flag}</span>
                    <span>{targetLanguageInfo.name}</span>
                  </div>
                  <Badge variant="outline" className="capitalize border-cyber-400/30">
                    {student.level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="interactive" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Interactive</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-cyber-400" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Target Language</p>
                      <div className="flex items-center mt-1">
                        <span className="mr-2 text-lg">{targetLanguageInfo.flag}</span>
                        <span className="font-medium">{targetLanguageInfo.name}</span>
                      </div>
                    </div>
                    {nativeLanguageInfo && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Native Language</p>
                        <div className="flex items-center mt-1">
                          <span className="mr-2 text-lg">{nativeLanguageInfo.flag}</span>
                          <span className="font-medium">{nativeLanguageInfo.name}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Level</p>
                      <Badge variant="outline" className="mt-1 capitalize border-cyber-400/30">
                        {student.level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Joined</p>
                      <p className="mt-1 font-medium">
                        {format(new Date(student.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Goals */}
              {student.end_goals && (
                <Card className="floating-card glass-effect border-cyber-400/20">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="mr-2 h-5 w-5 text-neon-400" />
                      Learning Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{student.end_goals}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Learning Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.grammar_weaknesses && (
                <Card className="floating-card glass-effect border-cyber-400/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Grammar Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{student.grammar_weaknesses}</p>
                  </CardContent>
                </Card>
              )}

              {student.vocabulary_gaps && (
                <Card className="floating-card glass-effect border-cyber-400/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Vocabulary Gaps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{student.vocabulary_gaps}</p>
                  </CardContent>
                </Card>
              )}

              {student.pronunciation_challenges && (
                <Card className="floating-card glass-effect border-cyber-400/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Pronunciation Challenges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{student.pronunciation_challenges}</p>
                  </CardContent>
                </Card>
              )}

              {student.conversational_fluency_barriers && (
                <Card className="floating-card glass-effect border-cyber-400/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Conversational Barriers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{student.conversational_fluency_barriers}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Learning Styles */}
            {student.learning_styles && student.learning_styles.length > 0 && (
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5 text-purple-400" />
                    Learning Styles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {student.learning_styles.map((style, index) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {style.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {student.notes && (
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{student.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Lesson Plans</h2>
                <p className="text-muted-foreground">AI-generated lesson plans for {student.name}</p>
              </div>
              <Button
                onClick={generateLessonPlans}
                disabled={isGeneratingLessons}
                className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0"
              >
                {isGeneratingLessons ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Lesson Plans
                  </>
                )}
              </Button>
            </div>

            {isGeneratingLessons && (
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-cyber-400" />
                    <div>
                      <p className="font-medium">Generating Lesson Plans...</p>
                      <p className="text-sm text-muted-foreground">{generationProgress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {lessons.length === 0 ? (
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No lesson plans yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate AI-powered lesson plans tailored to {student.name}'s learning needs.
                  </p>
                  <Button
                    onClick={generateLessonPlans}
                    disabled={isGeneratingLessons}
                    className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate First Lesson Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lessons.map((lesson, index) => (
                  <Card key={lesson.id} className="floating-card glass-effect border-cyber-400/20 hover:border-cyber-400/50 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-cyber-400" />
                          <div>
                            <CardTitle className="text-lg">
                              Lesson {index + 1}
                            </CardTitle>
                            <CardDescription>
                              {format(new Date(lesson.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize border-cyber-400/30">
                          {lesson.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {lesson.notes && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                            <p className="text-sm">{lesson.notes}</p>
                          </div>
                        )}
                        
                        {lesson.materials && lesson.materials.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Materials</p>
                            <div className="flex flex-wrap gap-2">
                              {lesson.materials.map((material, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {material}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {lesson.sub_topics && lesson.sub_topics.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Available Sub-topics</p>
                            <div className="flex flex-wrap gap-2">
                              {lesson.sub_topics.slice(0, 3).map((subTopic, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-cyber-400/30">
                                  {subTopic.title}
                                </Badge>
                              ))}
                              {lesson.sub_topics.length > 3 && (
                                <Badge variant="outline" className="text-xs border-cyber-400/30">
                                  +{lesson.sub_topics.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleGenerateInteractiveMaterial(lesson)}
                            disabled={!lesson.sub_topics || lesson.sub_topics.length === 0}
                            variant="outline"
                            className="border-cyber-400/30 hover:bg-cyber-400/10"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Create Interactive Material
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Interactive Tab */}
          <TabsContent value="interactive" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Interactive Lesson Material</h2>
                <p className="text-muted-foreground">
                  Personalized lesson content for {student.name} with interactive exercises
                </p>
              </div>
            </div>

            {isGeneratingInteractive && (
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-cyber-400" />
                    <div>
                      <p className="font-medium">Creating Interactive Material...</p>
                      <p className="text-sm text-muted-foreground">{generationProgress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedLesson?.interactive_lesson_content ? (
              <div>
                <Card className="floating-card glass-effect border-cyber-400/20 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-neon-400" />
                      Interactive Lesson Material
                    </CardTitle>
                    <CardDescription>
                      Generated on {format(new Date(selectedLesson.date), "MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <div className="space-y-6">
                  <LessonMaterialDisplay 
                    content={selectedLesson.interactive_lesson_content}
                    studentNativeLanguage={student.native_language}
                  />
                </div>
              </div>
            ) : (
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No interactive content yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate lesson plans first, then create interactive material for specific topics.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={generateLessonPlans}
                      disabled={isGeneratingLessons}
                      variant="outline"
                      className="border-cyber-400/30 hover:bg-cyber-400/10"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Generate Lesson Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Sub-topic Selection Dialog */}
        <SubTopicSelectionDialog
          open={isSubTopicDialogOpen}
          onOpenChange={setIsSubTopicDialogOpen}
          subTopics={availableSubTopics}
          onSelectSubTopic={generateInteractiveMaterial}
          isGenerating={isGeneratingInteractive}
          generationProgress={generationProgress}
        />
      </div>
    </MainLayout>
  );
}