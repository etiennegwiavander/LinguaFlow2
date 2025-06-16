"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Student, SubTopic } from "@/types";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import MainLayout from "@/components/main-layout";
import { 
  ArrowLeft, 
  BarChart3,
  Calendar, 
  Clock, 
  Edit, 
  GraduationCap, 
  Languages as LanguagesIcon, 
  MapPin, 
  Plus, 
  Target, 
  User,
  BookOpen,
  Sparkles,
  Play,
  Loader2,
  CheckCircle2,
  Globe
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import StudentForm from "@/components/students/StudentForm";
import SubTopicSelectionDialog from "@/components/students/SubTopicSelectionDialog";
import LessonMaterialDisplay from "@/components/lessons/LessonMaterialDisplay";
import TranslationPopup from "@/components/ui/translation-popup";
import { useTranslationPopup } from "@/hooks/use-translation-popup";

interface StudentProfileClientProps {
  student: Student;
}

interface Lesson {
  id: string;
  date: string;
  status: string;
  materials: string[];
  notes: string | null;
  generated_lessons: string[] | null;
  sub_topics: SubTopic[] | null;
  lesson_template_id: string | null;
  interactive_lesson_content: any | null;
}

export default function StudentProfileClient({ student: initialStudent }: StudentProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student>(initialStudent);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [selectedLessonSubTopics, setSelectedLessonSubTopics] = useState<SubTopic[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isGeneratingInteractive, setIsGeneratingInteractive] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [selectedLessonForViewing, setSelectedLessonForViewing] = useState<string | null>(null);

  // Use the translation popup hook
  const { translationState, handleDoubleClick, hideTranslation } = useTranslationPopup(student.native_language);

  useEffect(() => {
    if (!user) return;
    
    const fetchLessons = async () => {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('student_id', student.id)
          .eq('tutor_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;
        setLessons(data || []);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch lessons');
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, [user, student.id]);

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

  const handleGenerateLessons = async () => {
    if (!user) return;

    setIsGeneratingLessons(true);
    try {
      // Create a new lesson first
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert([{
          student_id: student.id,
          tutor_id: user.id,
          date: new Date().toISOString(),
          status: 'upcoming',
          materials: ['AI Generated Lesson Plans'],
          notes: `AI-generated lesson plans created on ${new Date().toLocaleDateString()}`
        }])
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Generate lesson plans for the new lesson
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
          lesson_id: lessonData.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate lesson plans');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Lesson plans generated successfully!');
        
        // Refresh lessons list
        const { data: updatedLessons, error: fetchError } = await supabase
          .from('lessons')
          .select('*')
          .eq('student_id', student.id)
          .eq('tutor_id', user.id)
          .order('date', { ascending: false });

        if (!fetchError && updatedLessons) {
          setLessons(updatedLessons);
        }
      } else {
        throw new Error(result.error || 'Failed to generate lesson plans');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate lesson plans');
    } finally {
      setIsGeneratingLessons(false);
    }
  };

  const handleCreateInteractiveMaterial = (lesson: Lesson) => {
    if (!lesson.sub_topics || lesson.sub_topics.length === 0) {
      toast.error('No sub-topics available for this lesson. Generate lesson plans first.');
      return;
    }

    setSelectedLessonSubTopics(lesson.sub_topics);
    setSelectedLessonId(lesson.id);
    setIsSubTopicDialogOpen(true);
  };

  const handleSubTopicSelection = async (subTopic: SubTopic) => {
    if (!selectedLessonId) return;

    setIsGeneratingInteractive(true);
    setGenerationProgress("Analyzing student profile and sub-topic...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      setGenerationProgress("Creating personalized interactive material...");

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-interactive-material`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: selectedLessonId,
          selected_sub_topic: subTopic
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate interactive material');
      }

      const result = await response.json();
      
      if (result.success) {
        setGenerationProgress("Interactive material created successfully!");
        toast.success('Interactive lesson material created successfully!');
        
        // Refresh lessons list
        const { data: updatedLessons, error: fetchError } = await supabase
          .from('lessons')
          .select('*')
          .eq('student_id', student.id)
          .eq('tutor_id', user.id)
          .order('date', { ascending: false });

        if (!fetchError && updatedLessons) {
          setLessons(updatedLessons);
        }

        // Close dialog and show the lesson material
        setIsSubTopicDialogOpen(false);
        setSelectedLessonForViewing(selectedLessonId);
      } else {
        throw new Error(result.error || 'Failed to generate interactive material');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate interactive material');
    } finally {
      setIsGeneratingInteractive(false);
      setGenerationProgress("");
    }
  };

  const handleViewLessonMaterial = (lessonId: string) => {
    setSelectedLessonForViewing(lessonId);
  };

  const handleBackToProfile = () => {
    setSelectedLessonForViewing(null);
  };

  // If viewing lesson material, show that component
  if (selectedLessonForViewing) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={handleBackToProfile}
              className="border-cyber-400/30 hover:bg-cyber-400/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Lesson Material for <span className="gradient-text">{student.name}</span>
              </h1>
              <p className="text-muted-foreground">
                Interactive lesson content
              </p>
            </div>
          </div>
          
          <LessonMaterialDisplay 
            lessonId={selectedLessonForViewing} 
            studentNativeLanguage={student.native_language}
          />
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
            <div>
              <h1 className="text-3xl font-bold">
                <span className="gradient-text">{student.name}</span>'s Profile
              </h1>
              <p className="text-muted-foreground">
                Language learning journey and progress
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setIsEditFormOpen(true)}
            className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Info Card */}
          <div className="lg:col-span-1">
            <Card className="floating-card glass-effect border-cyber-400/20 sticky top-6">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-cyber-400/20">
                  <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
                  <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 text-xl">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle 
                  className="text-xl cursor-pointer select-text"
                  onDoubleClick={handleDoubleClick}
                >
                  {student.name}
                </CardTitle>
                <CardDescription className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">{targetLanguageInfo.flag}</span>
                  <span 
                    className="cursor-pointer select-text"
                    onDoubleClick={handleDoubleClick}
                  >
                    Learning {targetLanguageInfo.name}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-muted-foreground">Level</p>
                    <Badge variant="outline" className="capitalize border-cyber-400/30">
                      {student.level}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-muted-foreground">Lessons</p>
                    <p className="font-bold text-lg">{lessons.length}</p>
                  </div>
                </div>

                <Separator className="bg-cyber-400/20" />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <LanguagesIcon className="w-4 h-4 text-cyber-400" />
                    <span className="text-sm font-medium">Target Language</span>
                  </div>
                  <div className="flex items-center space-x-2 ml-6">
                    <span className="text-lg">{targetLanguageInfo.flag}</span>
                    <span 
                      className="cursor-pointer select-text"
                      onDoubleClick={handleDoubleClick}
                    >
                      {targetLanguageInfo.name}
                    </span>
                  </div>
                </div>

                {nativeLanguageInfo && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-neon-400" />
                      <span className="text-sm font-medium">Native Language</span>
                    </div>
                    <div className="flex items-center space-x-2 ml-6">
                      <span className="text-lg">{nativeLanguageInfo.flag}</span>
                      <span 
                        className="cursor-pointer select-text"
                        onDoubleClick={handleDoubleClick}
                      >
                        {nativeLanguageInfo.name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Proficiency Level</span>
                  </div>
                  <div className="ml-6">
                    <Badge variant="outline" className="capitalize border-purple-400/30">
                      {student.level}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">Learning Styles</span>
                  </div>
                  <div className="ml-6 flex flex-wrap gap-1">
                    {student.learning_styles && student.learning_styles.length > 0 ? (
                      student.learning_styles.map((style, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {style}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Not specified</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="lessons">Lessons</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Goals */}
                <Card className="floating-card glass-effect border-cyber-400/20">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-cyber-400" />
                      Learning Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p 
                      className="text-muted-foreground cursor-pointer select-text"
                      onDoubleClick={handleDoubleClick}
                    >
                      {student.end_goals || "No specific goals set yet."}
                    </p>
                  </CardContent>
                </Card>

                {/* Challenges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="floating-card glass-effect border-cyber-400/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Grammar Challenges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="text-sm text-muted-foreground cursor-pointer select-text"
                        onDoubleClick={handleDoubleClick}
                      >
                        {student.grammar_weaknesses || "No specific challenges noted."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="floating-card glass-effect border-cyber-400/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Vocabulary Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="text-sm text-muted-foreground cursor-pointer select-text"
                        onDoubleClick={handleDoubleClick}
                      >
                        {student.vocabulary_gaps || "No specific gaps identified."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="floating-card glass-effect border-cyber-400/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Pronunciation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="text-sm text-muted-foreground cursor-pointer select-text"
                        onDoubleClick={handleDoubleClick}
                      >
                        {student.pronunciation_challenges || "No specific challenges noted."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="floating-card glass-effect border-cyber-400/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Conversation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="text-sm text-muted-foreground cursor-pointer select-text"
                        onDoubleClick={handleDoubleClick}
                      >
                        {student.conversational_fluency_barriers || "No specific barriers noted."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {student.notes && (
                  <Card className="floating-card glass-effect border-cyber-400/20">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2 text-cyber-400" />
                        Additional Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="text-muted-foreground whitespace-pre-wrap cursor-pointer select-text"
                        onDoubleClick={handleDoubleClick}
                      >
                        {student.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="lessons" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Lesson History</h3>
                  <Button 
                    onClick={handleGenerateLessons}
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
                        Generate AI Lessons
                      </>
                    )}
                  </Button>
                </div>

                {loadingLessons ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyber-400" />
                  </div>
                ) : lessons.length === 0 ? (
                  <Card className="floating-card glass-effect border-cyber-400/20">
                    <CardContent className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Generate AI-powered lesson plans to get started
                      </p>
                      <Button 
                        onClick={handleGenerateLessons}
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
                            Generate First Lesson
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {lessons.map((lesson) => (
                      <Card key={lesson.id} className="floating-card glass-effect border-cyber-400/20">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-cyber-400/20 to-neon-400/20 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-cyber-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  Lesson - {new Date(lesson.date).toLocaleDateString()}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(lesson.date).toLocaleDateString()}
                                  </span>
                                  <Badge variant="outline" className="capitalize">
                                    {lesson.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {lesson.interactive_lesson_content ? (
                                <Button 
                                  onClick={() => handleViewLessonMaterial(lesson.id)}
                                  className="bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white border-0"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  View Material
                                </Button>
                              ) : lesson.sub_topics && lesson.sub_topics.length > 0 ? (
                                <Button 
                                  onClick={() => handleCreateInteractiveMaterial(lesson)}
                                  variant="outline"
                                  className="border-cyber-400/30 hover:bg-cyber-400/10"
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Create Interactive
                                </Button>
                              ) : lesson.generated_lessons && lesson.generated_lessons.length > 0 ? (
                                <Badge variant="secondary" className="flex items-center">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Plans Ready
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  No Content
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {lesson.notes && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                              <p 
                                className="text-sm text-muted-foreground cursor-pointer select-text"
                                onDoubleClick={handleDoubleClick}
                              >
                                {lesson.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <Card className="floating-card glass-effect border-cyber-400/20">
                  <CardHeader>
                    <CardTitle>Learning Progress</CardTitle>
                    <CardDescription>
                      Track {student.name}'s language learning journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyber-400/20 to-neon-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-cyber-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Progress Tracking Coming Soon</h3>
                      <p className="text-muted-foreground">
                        Detailed progress analytics and insights will be available here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Edit Student Form */}
        <StudentForm 
          open={isEditFormOpen} 
          onOpenChange={setIsEditFormOpen}
          student={student}
          onSuccess={() => {
            setIsEditFormOpen(false);
            // Refresh student data
            window.location.reload();
          }}
        />

        {/* Sub-topic Selection Dialog */}
        <SubTopicSelectionDialog
          open={isSubTopicDialogOpen}
          onOpenChange={setIsSubTopicDialogOpen}
          subTopics={selectedLessonSubTopics}
          onSelectSubTopic={handleSubTopicSelection}
          isGenerating={isGeneratingInteractive}
          generationProgress={generationProgress}
        />

        {/* Translation Popup */}
        <TranslationPopup
          isVisible={translationState.isVisible}
          position={translationState.position}
          originalText={translationState.originalText}
          translatedText={translationState.translatedText}
          isLoading={translationState.isLoading}
          onClose={hideTranslation}
        />
      </div>
    </MainLayout>
  );
}