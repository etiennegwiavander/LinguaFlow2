"use client";

import { useEffect, useState, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Student, SubTopic } from "@/types";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { format } from "date-fns";
import MainLayout from "@/components/main-layout";
import StudentForm from "@/components/students/StudentForm";
import EditImprovementAreasDialog from "@/components/students/EditImprovementAreasDialog";
import SubTopicSelectionDialog from "@/components/students/SubTopicSelectionDialog";
import LessonMaterialDisplay from "@/components/lessons/LessonMaterialDisplay";
import { ProgressContext } from "@/lib/progress-context";
import { exportToPdf, exportToWord, showExportDialog } from "@/lib/export-utils";
import {
  ArrowLeft,
  Edit,
  GraduationCap,
  Languages as LanguagesIcon,
  MapPin,
  Calendar,
  BookOpen,
  Target,
  MessageSquare,
  Volume2,
  Eye,
  Globe,
  Users,
  Sparkles,
  FileText,
  Download,
  Loader2,
  RefreshCw,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Brain,
  PlusCircle,
  ChevronRight,
  Star,
  TrendingUp,
  Award,
  BarChart3,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudentProfileClientProps {
  student: Student;
}

interface LessonData {
  id: string;
  date: string;
  status: string;
  materials: string[];
  notes: string | null;
  previous_challenges: string[] | null;
  generated_lessons: string[] | null;
  sub_topics: SubTopic[] | null;
  lesson_template_id: string | null;
  interactive_lesson_content: any | null;
}

const categoryIcons = {
  'Grammar': GraduationCap,
  'Conversation': MessageSquare,
  'Business English': Users,
  'English for Kids': Users,
  'Vocabulary': BookOpen,
  'Pronunciation': Volume2,
  'Picture Description': Eye,
  'English for Travel': Globe,
};

const categoryColors = {
  'Grammar': 'bg-green-100 text-green-800 border-green-200',
  'Conversation': 'bg-blue-100 text-blue-800 border-blue-200',
  'Business English': 'bg-purple-100 text-purple-800 border-purple-200',
  'English for Kids': 'bg-pink-100 text-pink-800 border-pink-200',
  'Vocabulary': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Pronunciation': 'bg-orange-100 text-orange-800 border-orange-200',
  'Picture Description': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'English for Travel': 'bg-teal-100 text-teal-800 border-teal-200',
};

export default function StudentProfileClient({ student: initialStudent }: StudentProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student>(initialStudent);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isImprovementAreasDialogOpen, setIsImprovementAreasDialogOpen] = useState(false);
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [isGeneratingInteractive, setIsGeneratingInteractive] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [upcomingLesson, setUpcomingLesson] = useState<LessonData | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { initializeFromLessonData } = useContext(ProgressContext);

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

  // Load upcoming lesson and any existing generated lessons
  const loadUpcomingLesson = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      setLoadingLesson(true);
      
      // Get the most recent lesson for this student
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', student.id)
        .eq('tutor_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        return;
      }

      if (lessonData) {
        setUpcomingLesson(lessonData);
        
        // Initialize progress context with lesson data
        if (lessonData.interactive_lesson_content) {
          initializeFromLessonData(lessonData);
        }
      }
    } catch (error) {
      console.error('Error in loadUpcomingLesson:', error);
    } finally {
      setLoadingLesson(false);
    }
  }, [student.id, initializeFromLessonData]);

  useEffect(() => {
    loadUpcomingLesson();
  }, [loadUpcomingLesson]);

  const handleStudentUpdate = async () => {
    // Refresh student data
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .single();

      if (error) throw error;
      setStudent(data);
      toast.success('Student profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh student data');
    }
  };

  const handleGenerateLessons = async () => {
    if (!user) return;

    setIsGeneratingLessons(true);
    setGenerationProgress("Analyzing student profile...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-lesson-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          tutor_id: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate lesson plans');
      }

      const result = await response.json();
      
      if (result.success) {
        setGenerationProgress("Lesson plans generated successfully!");
        toast.success('Lesson plans generated successfully!');
        
        // Reload the lesson data
        await loadUpcomingLesson();
      } else {
        throw new Error(result.error || 'Failed to generate lesson plans');
      }
    } catch (error: any) {
      console.error('Error generating lessons:', error);
      toast.error(error.message || 'Failed to generate lesson plans');
    } finally {
      setIsGeneratingLessons(false);
      setGenerationProgress("");
    }
  };

  const handleSelectSubTopic = async (subTopic: SubTopic) => {
    if (!user || !upcomingLesson) return;

    setIsGeneratingInteractive(true);
    setGenerationProgress("Creating interactive lesson material...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-interactive-material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          lesson_id: upcomingLesson.id,
          student_id: student.id,
          sub_topic: subTopic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate interactive material');
      }

      const result = await response.json();
      
      if (result.success) {
        setGenerationProgress("Interactive material created successfully!");
        toast.success('Interactive lesson material created successfully!');
        
        // Reload the lesson data to get the new interactive content
        await loadUpcomingLesson();
        
        // Close the dialog and switch to the interactive tab
        setIsSubTopicDialogOpen(false);
        setActiveTab("interactive");
      } else {
        throw new Error(result.error || 'Failed to generate interactive material');
      }
    } catch (error: any) {
      console.error('Error generating interactive material:', error);
      toast.error(error.message || 'Failed to generate interactive material');
    } finally {
      setIsGeneratingInteractive(false);
      setGenerationProgress("");
    }
  };

  const handleExportLesson = () => {
    if (upcomingLesson?.interactive_lesson_content) {
      showExportDialog('lesson-material-display', `${student.name}-lesson-${format(new Date(), 'yyyy-MM-dd')}`);
    } else {
      toast.error('No interactive lesson content to export');
    }
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || BookOpen;
    return IconComponent;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getImprovementAreas = () => {
    const areas = [];
    if (student.grammar_weaknesses) areas.push({ type: 'Grammar', content: student.grammar_weaknesses, color: 'bg-red-50 text-red-700 border-red-200' });
    if (student.vocabulary_gaps) areas.push({ type: 'Vocabulary', content: student.vocabulary_gaps, color: 'bg-orange-50 text-orange-700 border-orange-200' });
    if (student.pronunciation_challenges) areas.push({ type: 'Pronunciation', content: student.pronunciation_challenges, color: 'bg-blue-50 text-blue-700 border-blue-200' });
    if (student.conversational_fluency_barriers) areas.push({ type: 'Conversation', content: student.conversational_fluency_barriers, color: 'bg-purple-50 text-purple-700 border-purple-200' });
    return areas;
  };

  const improvementAreas = getImprovementAreas();

  return (
    <MainLayout>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-cyber-400/10 hover:text-cyber-400 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-cyber-400/20">
                <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
                <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 font-semibold">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold gradient-text">{student.name}</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span className="text-lg">{targetLanguageInfo.flag}</span>
                  <span>{targetLanguageInfo.name}</span>
                  <Badge variant="outline" className="capitalize">
                    {student.level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditFormOpen(true)}
              className="btn-ghost-cyber"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full md:w-auto glass-effect border-cyber-400/30">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyber-400/20 data-[state=active]:to-neon-400/20 data-[state=active]:text-cyber-400"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="lessons" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyber-400/20 data-[state=active]:to-neon-400/20 data-[state=active]:text-cyber-400"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Lesson Plans
            </TabsTrigger>
            <TabsTrigger 
              value="interactive" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyber-400/20 data-[state=active]:to-neon-400/20 data-[state=active]:text-cyber-400"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Interactive Material
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Student Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LanguagesIcon className="mr-2 h-5 w-5 text-cyber-400" />
                    Language Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Language</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-lg">{targetLanguageInfo.flag}</span>
                      <span className="font-medium">{targetLanguageInfo.name}</span>
                    </div>
                  </div>
                  {nativeLanguageInfo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Native Language</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg">{nativeLanguageInfo.flag}</span>
                        <span className="font-medium">{nativeLanguageInfo.name}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Proficiency Level</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {student.level}
                    </Badge>
<<<<<<< HEAD
                  )}
                </CardTitle>
                <CardDescription>
                  Generate personalized lesson plans with focused sub-topics based on {student.name}'s profile and learning history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Onboarding Alert for First-Time Users */}
                {showOnboarding && !hasGeneratedBefore && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong>Welcome to AI Lesson Architect!</strong>
                          <p className="mt-1 text-sm">
                            Instantly create tailored lesson plans with focused sub-topics for {student.name}! Our AI analyzes their profile to suggest objectives, activities, materials, and specific sub-topics you can turn into interactive lessons.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOnboarding(false)}
                          className="ml-2 h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Responsive Card Layout - Row on large screens, Column on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Generate Lesson Ideas Card */}
                  <Card className="floating-card glass-effect border-cyber-400/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center">
                        <Brain className="mr-2 h-5 w-5 text-cyber-400" />
                        Generate Lesson Ideas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">
                          {upcomingLesson ?
                            `Generate lesson ideas with focused sub-topics for ${student.name}'s upcoming lesson` :
                            `Generate new lesson ideas with sub-topics tailored to ${student.name}'s learning style and goals`
                          }
                        </p>
                        {upcomingLesson && (
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Scheduled for {new Date(upcomingLesson.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Generate 5 personalized lesson plans with focused sub-topics based on {student.name}&apos;s profile
                        </p>
                        {isGenerating && (
                          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>{getProgressMessage()}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={handleGenerateLessons}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                              >
                                {getButtonIcon()}
                                {getButtonText()}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {upcomingLesson?.generated_lessons ?
                                  'Create new lesson ideas with sub-topics for this student' :
                                  'Generate AI-powered lesson plans with focused sub-topics tailored to this student'
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Create Interactive Material Card */}
                  {availableSubTopics.length > 0 && (
                    <Card className="floating-card glass-effect border-green-400/30 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center text-green-800 dark:text-green-200">
                          <Target className="mr-2 h-5 w-5 text-green-600" />
                          Ready to Create Interactive Material!
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Choose from {availableSubTopics.length} available sub-topics to create focused interactive lesson material for {student.name}.
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Each sub-topic is designed for 15-20 minutes of focused learning with interactive exercises.
                          </p>
                          {isGeneratingInteractive && (
                            <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span>{interactiveGenerationProgress || "Creating interactive material..."}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <Button
                            onClick={() => setIsSubTopicDialogOpen(true)}
                            disabled={!upcomingLesson || isGeneratingInteractive}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {isGeneratingInteractive ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating Material...
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Choose Sub-topic & Create Material
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Placeholder Card when no sub-topics available */}
                  {availableSubTopics.length === 0 && generatedLessons.length === 0 && (
                    <Card className="floating-card glass-effect border-gray-300/30 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/20 dark:to-gray-900/20">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center text-gray-600 dark:text-gray-400">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Interactive Material
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Generate lesson plans first to unlock interactive material creation.
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Once you have lesson plans, you&apos;ll be able to create focused interactive content.
                          </p>
                        </div>
                        <div className="pt-2">
                          <Button
                            disabled
                            className="w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          >
                            <BookOpen className="w-5 h-5 mr-2" />
                            Generate Lessons First
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {generatedLessons.length > 0 && (
                  <div className="space-y-4">


                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        {generatedLessons.length} Lesson Plans Ready!
                      </h3>
                      <div className="flex items-center space-x-2">
                        {upcomingLesson?.generated_lessons && (
                          <Badge variant="outline" className="text-xs border-cyber-400/30">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      {generatedLessons.map((lesson, index) => {
                        const isEditing = editingLessonIndex === index;

                        return (
                          <AccordionItem key={index} value={`lesson-${index}`}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-cyber-400/20 to-neon-400/20 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-cyber-600 dark:text-cyber-400">{index + 1}</span>
                                </div>
                                <span className="font-medium">{lesson.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-4">
                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 rounded-lg border border-cyber-400/20">
                                {isEditing ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 min-w-[120px] border-cyber-400/30 hover:bg-cyber-400/10"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 min-w-[120px] border-green-400/30 bg-green-50/50 hover:bg-green-100/50 text-green-700"
                                      onClick={handleSaveLessonPlan}
                                      disabled={isSavingLessonPlan}
                                    >
                                      {isSavingLessonPlan ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                      )}
                                      Save Changes
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 min-w-[120px] border-cyber-400/30 hover:bg-cyber-400/10"
                                      onClick={() => handleEditLessonPlan(index)}
                                      disabled={isEditing}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Plan
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => copyLessonPlan(lesson)}
                                      className="flex-1 min-w-[120px] border-cyber-400/30 hover:bg-cyber-400/10"
                                      disabled={isEditing}
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy to Clipboard
                                    </Button>

                                  </>
                                )}
                              </div>

                              {/* Interactive Generation Progress */}
                              {isGeneratingInteractive && (
                                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span>{interactiveGenerationProgress}</span>
                                </div>
                              )}

                              {isEditing && editedLessonPlan ? (
                                <div className="grid gap-6 md:grid-cols-2">
                                  <div className="space-y-4 p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20">
                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-title" className="font-medium">Lesson Title</Label>
                                      <Input
                                        id="lesson-title"
                                        value={editedLessonPlan.title}
                                        onChange={(e) => setEditedLessonPlan({
                                          ...editedLessonPlan,
                                          title: e.target.value
                                        })}
                                        className="border-cyber-400/30 focus:border-cyber-400"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-objectives" className="font-medium flex items-center">
                                        <Target className="w-4 h-4 mr-2 text-blue-600" />
                                        Lesson Objectives
                                      </Label>
                                      <Textarea
                                        id="lesson-objectives"
                                        value={editedLessonPlan.objectives.join('\n')}
                                        onChange={(e) => setEditedLessonPlan({
                                          ...editedLessonPlan,
                                          objectives: e.target.value.split('\n').filter(line => line.trim() !== '')
                                        })}
                                        className="min-h-[150px] border-cyber-400/30 focus:border-cyber-400"
                                        placeholder="Enter one objective per line"
                                      />
                                      <p className="text-xs text-muted-foreground">Enter one objective per line</p>
                                    </div>
                                  </div>

                                  <div className="space-y-4 p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20">
                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-activities" className="font-medium flex items-center">
                                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                                        Activities
                                      </Label>
                                      <Textarea
                                        id="lesson-activities"
                                        value={editedLessonPlan.activities.join('\n')}
                                        onChange={(e) => setEditedLessonPlan({
                                          ...editedLessonPlan,
                                          activities: e.target.value.split('\n').filter(line => line.trim() !== '')
                                        })}
                                        className="min-h-[150px] border-cyber-400/30 focus:border-cyber-400"
                                        placeholder="Enter one activity per line"
                                      />
                                      <p className="text-xs text-muted-foreground">Enter one activity per line</p>
                                    </div>
                                  </div>

                                  <div className="space-y-4 p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20">
                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-materials" className="font-medium flex items-center">
                                        <Book className="w-4 h-4 mr-2 text-green-600" />
                                        Materials Needed
                                      </Label>
                                      <Textarea
                                        id="lesson-materials"
                                        value={editedLessonPlan.materials.join('\n')}
                                        onChange={(e) => setEditedLessonPlan({
                                          ...editedLessonPlan,
                                          materials: e.target.value.split('\n').filter(line => line.trim() !== '')
                                        })}
                                        className="min-h-[150px] border-cyber-400/30 focus:border-cyber-400"
                                        placeholder="Enter one material per line"
                                      />
                                      <p className="text-xs text-muted-foreground">Enter one material per line</p>
                                    </div>
                                  </div>

                                  <div className="space-y-4 p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20">
                                    <div className="space-y-2">
                                      <Label htmlFor="lesson-assessment" className="font-medium flex items-center">
                                        <GraduationCap className="w-4 h-4 mr-2 text-orange-600" />
                                        Assessment Ideas
                                      </Label>
                                      <Textarea
                                        id="lesson-assessment"
                                        value={editedLessonPlan.assessment.join('\n')}
                                        onChange={(e) => setEditedLessonPlan({
                                          ...editedLessonPlan,
                                          assessment: e.target.value.split('\n').filter(line => line.trim() !== '')
                                        })}
                                        className="min-h-[150px] border-cyber-400/30 focus:border-cyber-400"
                                        placeholder="Enter one assessment idea per line"
                                      />
                                      <p className="text-xs text-muted-foreground">Enter one assessment idea per line</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid gap-6 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-medium mb-3 flex items-center">
                                      <Target className="w-4 h-4 mr-2 text-blue-600" />
                                      Lesson Objectives
                                    </h4>
                                    <ul className="space-y-2">
                                      {lesson.objectives.map((objective: string, objIndex: number) => (
                                        <li key={objIndex} className="text-sm flex items-start">
                                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                          {objective}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-3 flex items-center">
                                      <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                                      Activities
                                    </h4>
                                    <ul className="space-y-2">
                                      {lesson.activities.map((activity: string, actIndex: number) => (
                                        <li key={actIndex} className="text-sm flex items-start">
                                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                          {activity}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-3 flex items-center">
                                      <Book className="w-4 h-4 mr-2 text-green-600" />
                                      Materials Needed
                                    </h4>
                                    <ul className="space-y-2">
                                      {lesson.materials.map((material: string, matIndex: number) => (
                                        <li key={matIndex} className="text-sm flex items-start">
                                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                          {material}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-3 flex items-center">
                                      <GraduationCap className="w-4 h-4 mr-2 text-orange-600" />
                                      Assessment Ideas
                                    </h4>
                                    <ul className="space-y-2">
                                      {lesson.assessment.map((item: string, assIndex: number) => (
                                        <li key={assIndex} className="text-sm flex items-start">
                                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
=======
>>>>>>> 6c5f9d6a85faafca21f66db6894f42eac8151e46
                  </div>
                </CardContent>
              </Card>

              {/* Learning Styles */}
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-neon-400" />
                    Learning Styles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.learning_styles && student.learning_styles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.learning_styles.map((style, index) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {style.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No learning styles specified</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-purple-400" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="font-medium">{format(new Date(student.created_at), 'MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lessons Generated</span>
                    <span className="font-medium">{upcomingLesson?.generated_lessons?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Interactive Materials</span>
                    <span className="font-medium">{upcomingLesson?.interactive_lesson_content ? 1 : 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals and Improvement Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* End Goals */}
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5 text-emerald-400" />
                    Learning Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.end_goals ? (
                    <p className="text-muted-foreground leading-relaxed">{student.end_goals}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No learning goals specified</p>
                  )}
                </CardContent>
              </Card>

              {/* Improvement Areas */}
              <Card className="cyber-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-orange-400" />
                    Areas for Improvement
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImprovementAreasDialogOpen(true)}
                    className="btn-ghost-cyber"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  {improvementAreas.length > 0 ? (
                    <div className="space-y-3">
                      {improvementAreas.map((area, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${area.color}`}>
                          <p className="font-medium text-sm mb-1">{area.type}</p>
                          <p className="text-xs leading-relaxed">{area.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No improvement areas specified</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {student.notes && (
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-400" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{student.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lesson Plans Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-cyber-400" />
                    AI-Generated Lesson Plans
                  </CardTitle>
                  <CardDescription>
                    Personalized lesson plans created specifically for {student.name}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {upcomingLesson?.generated_lessons && upcomingLesson.generated_lessons.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setIsSubTopicDialogOpen(true)}
                      className="btn-ghost-cyber"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Interactive Material
                    </Button>
                  )}
                  <Button
                    onClick={handleGenerateLessons}
                    disabled={isGeneratingLessons || loadingLesson}
                    className="btn-cyber"
                  >
                    {isGeneratingLessons ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Lesson Plans
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLesson ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyber-400 mr-2" />
                    <span>Loading lesson data...</span>
                  </div>
                ) : isGeneratingLessons ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Generating Personalized Lessons</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">{generationProgress}</p>
                      </div>
                    </div>
                    <Progress value={33} className="h-2" />
                  </div>
                ) : upcomingLesson?.generated_lessons && upcomingLesson.generated_lessons.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {upcomingLesson.generated_lessons.length} lesson plan{upcomingLesson.generated_lessons.length === 1 ? '' : 's'} generated
                      </p>
                      <Badge className="badge-success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    </div>
                    <div className="grid gap-4">
                      {upcomingLesson.generated_lessons.map((lesson, index) => (
                        <Card key={index} className="border border-cyber-400/20 hover:border-cyber-400/40 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium mb-2">Lesson Plan {index + 1}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{lesson}</p>
                              </div>
                              <Badge variant="outline" className="ml-4">
                                Plan {index + 1}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Sub-topics */}
                    {upcomingLesson.sub_topics && upcomingLesson.sub_topics.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-4 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-cyber-400" />
                          Available Sub-Topics for Interactive Material
                        </h4>
                        <div className="grid gap-3">
                          {upcomingLesson.sub_topics.map((subTopic, index) => {
                            const IconComponent = getCategoryIcon(subTopic.category);
                            const categoryColor = getCategoryColor(subTopic.category);
                            
                            return (
                              <Card key={subTopic.id} className="border border-gray-200 hover:border-cyber-400/40 transition-colors">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className={`p-2 rounded-lg ${categoryColor}`}>
                                        <IconComponent className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h5 className="font-medium">{subTopic.title}</h5>
                                        <div className="flex items-center space-x-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            {subTopic.category}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {subTopic.level}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-cyber-400 mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No Lesson Plans Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate AI-powered lesson plans tailored specifically for {student.name}'s learning needs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactive Material Tab */}
          <TabsContent value="interactive" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-neon-400" />
                    Interactive Lesson Material
                  </CardTitle>
                  <CardDescription>
                    Engaging, interactive content for hands-on learning
                  </CardDescription>
                </div>
                {upcomingLesson?.interactive_lesson_content && (
                  <Button
                    variant="outline"
                    onClick={handleExportLesson}
                    className="btn-ghost-cyber"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {upcomingLesson?.interactive_lesson_content ? (
                  <div id="lesson-material-display">
                    <LessonMaterialDisplay 
                      lessonContent={upcomingLesson.interactive_lesson_content}
                      studentName={student.name}
                      nativeLanguage={student.native_language}
                    />
                  </div>
                ) : upcomingLesson?.sub_topics && upcomingLesson.sub_topics.length > 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-neon-400 mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">Ready to Create Interactive Material</h3>
                    <p className="text-muted-foreground mb-4">
                      Choose a sub-topic to create engaging, interactive lesson material for {student.name}.
                    </p>
                    <Button
                      onClick={() => setIsSubTopicDialogOpen(true)}
                      className="btn-cyber"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Create Interactive Material
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">Generate Lesson Plans First</h3>
                    <p className="text-muted-foreground mb-4">
                      You need to generate lesson plans before creating interactive material.
                    </p>
                    <Button
                      onClick={() => setActiveTab("lessons")}
                      variant="outline"
                      className="btn-ghost-cyber"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Go to Lesson Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <StudentForm
          open={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
          student={student}
          onSuccess={handleStudentUpdate}
        />

        <EditImprovementAreasDialog
          open={isImprovementAreasDialogOpen}
          onOpenChange={setIsImprovementAreasDialogOpen}
          student={student}
          onSuccess={handleStudentUpdate}
        />

        {upcomingLesson?.sub_topics && (
          <SubTopicSelectionDialog
            open={isSubTopicDialogOpen}
            onOpenChange={setIsSubTopicDialogOpen}
            subTopics={upcomingLesson.sub_topics}
            onSelectSubTopic={handleSelectSubTopic}
            isGenerating={isGeneratingInteractive}
            generationProgress={generationProgress}
          />
        )}
      </div>
    </MainLayout>
  );
}