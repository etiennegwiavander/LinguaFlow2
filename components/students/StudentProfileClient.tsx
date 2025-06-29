"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/main-layout";
import { Student, SubTopic } from "@/types";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { 
  BookOpen, 
  Calendar, 
  Edit3, 
  Loader2, 
  Sparkles, 
  Target, 
  Trash2, 
  User, 
  Play,
  Plus,
  RefreshCw,
  FileText,
  GraduationCap,
  MessageSquare,
  Volume2,
  Eye,
  Globe,
  Brain,
  Zap,
  CheckCircle,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import StudentForm from "@/components/students/StudentForm";
import SubTopicSelectionDialog from "@/components/students/SubTopicSelectionDialog";
import { LessonMaterialDisplayWithProgress } from "@/components/lessons/LessonMaterialDisplay";
import LessonEditorDialog from "@/components/students/LessonEditorDialog";

interface StudentProfileClientProps {
  student: Student;
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [isLessonEditorDialogOpen, setIsLessonEditorDialogOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState<SubTopic | null>(null);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [isLoadingLessonContent, setIsLoadingLessonContent] = useState(false);
  const [isGeneratingInteractiveMaterial, setIsGeneratingInteractiveMaterial] = useState(false);
  const lessonContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (student?.id) {
      fetchSubTopics();
    }
  }, [student]);

  useEffect(() => {
    if (selectedSubTopic) {
      fetchLessonContent();
    }
  }, [selectedSubTopic]);

  const fetchSubTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('sub_topics')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].sub_topics) {
        setSubTopics(data[0].sub_topics);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch sub-topics');
    }
  };

  const fetchLessonContent = async () => {
    if (!selectedSubTopic) return;
    
    setIsLoadingLessonContent(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('interactive_lesson_content')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].interactive_lesson_content) {
        setLessonContent(data[0].interactive_lesson_content);
      } else {
        setLessonContent(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch lesson content');
    } finally {
      setIsLoadingLessonContent(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      toast.success('Student deleted successfully');
      router.push('/students');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const handleGenerateLessons = async () => {
    if (!user) return;
    
    setIsGeneratingLessons(true);
    setGenerationProgress("Initializing lesson generation...");
    
    try {
      // Get the current date and time
      const lessonDate = new Date().toISOString();
      
      // Create a new lesson record
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert([
          {
            student_id: student.id,
            tutor_id: user.id,
            date: lessonDate,
            status: 'upcoming',
            materials: [],
            notes: `Auto-generated lesson for ${student.name}`,
          }
        ])
        .select()
        .single();

      if (lessonError) throw lessonError;
      
      setGenerationProgress("Lesson record created. Generating content...");
      
      // Call the Edge Function to generate the lesson plan
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-lesson-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          lesson_id: lessonData.id,
          student_id: student.id,
          tutor_id: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate lesson plan');
      }

      const result = await response.json();
      
      setGenerationProgress("Lesson plan generated successfully!");
      
      // Fetch the updated sub-topics
      fetchSubTopics();
      
      toast.success('Lesson plan generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate lesson plan');
    } finally {
      setIsGeneratingLessons(false);
    }
  };

  const handleSelectSubTopic = async (subTopic: SubTopic) => {
    setSelectedSubTopic(subTopic);
    setIsSubTopicDialogOpen(false);
    setIsGeneratingInteractiveMaterial(true);
    
    try {
      // Call the Edge Function to generate interactive material
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-interactive-material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          student_id: student.id,
          sub_topic: subTopic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate interactive material');
      }

      await fetchLessonContent();
      
      // Scroll to the lesson content
      setTimeout(() => {
        if (lessonContentRef.current) {
          lessonContentRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate interactive material');
    } finally {
      setIsGeneratingInteractiveMaterial(false);
    }
  };

  const handleCompleteLessonMaterial = async () => {
    if (!selectedSubTopic) return;
    
    setIsCompletingLesson(true);
    try {
      // Here you would typically update the lesson status or track completion
      // For now, we'll just show a success message
      toast.success('Lesson material completed!');
      
      // Wait a moment for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete lesson');
    } finally {
      setIsCompletingLesson(false);
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

  const languageInfo = getLanguageInfo(student.target_language);
  const nativeLanguageInfo = student.native_language 
    ? getLanguageInfo(student.native_language) 
    : null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Grammar':
        return <GraduationCap className="h-4 w-4" />;
      case 'Conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'Business English':
        return <FileText className="h-4 w-4" />;
      case 'English for Kids':
        return <BookOpen className="h-4 w-4" />;
      case 'Vocabulary':
        return <BookOpen className="h-4 w-4" />;
      case 'Pronunciation':
        return <Volume2 className="h-4 w-4" />;
      case 'Picture Description':
        return <Eye className="h-4 w-4" />;
      case 'English for Travel':
        return <Globe className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Student Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 ring-4 ring-cyber-400/20">
              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
              <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 text-xl font-semibold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="gradient-text">{student.name}</span>
                </h1>
                <div className="flex items-center space-x-1">
                  <span className="text-2xl">{languageInfo.flag}</span>
                  {nativeLanguageInfo && (
                    <span className="text-2xl">{nativeLanguageInfo.flag}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <span>{languageInfo.name}</span>
                <span>•</span>
                <Badge variant="outline" className="capitalize border-cyber-400/30">
                  {student.level}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditFormOpen(true)}
              className="btn-ghost-cyber"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteStudent}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Student Details */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Student Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">End Goals</h3>
                  <p className="text-sm">{student.end_goals || "No end goals specified"}</p>
                </div>
                
                <Separator className="bg-cyber-400/20" />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Learning Styles</h3>
                  <div className="flex flex-wrap gap-2">
                    {student.learning_styles && student.learning_styles.length > 0 ? (
                      student.learning_styles.map((style) => (
                        <Badge key={style} className="badge-cyber">
                          {style}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm">No learning styles specified</span>
                    )}
                  </div>
                </div>
                
                <Separator className="bg-cyber-400/20" />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Areas for Improvement</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-medium">Grammar Weaknesses</h4>
                      <p className="text-sm">{student.grammar_weaknesses || "None specified"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium">Vocabulary Gaps</h4>
                      <p className="text-sm">{student.vocabulary_gaps || "None specified"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium">Pronunciation Challenges</h4>
                      <p className="text-sm">{student.pronunciation_challenges || "None specified"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium">Conversational Fluency Barriers</h4>
                      <p className="text-sm">{student.conversational_fluency_barriers || "None specified"}</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-cyber-400/20" />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Additional Notes</h3>
                  <p className="text-sm">{student.notes || "No additional notes"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Lesson Plans and Interactive Material */}
          <div className="space-y-6 lg:col-span-2">
            {/* Lesson Plans Section */}
            <Card className="cyber-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Lesson Plans
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-ghost-cyber"
                    onClick={() => setIsLessonEditorDialogOpen(true)}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Plan
                  </Button>
                  <Button 
                    onClick={handleGenerateLessons}
                    disabled={isGeneratingLessons}
                    className="btn-cyber"
                  >
                    {isGeneratingLessons ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Lessons
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isGeneratingLessons ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 animate-spin text-cyber-400" />
                      <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl"></div>
                    </div>
                    <p className="text-center text-muted-foreground">{generationProgress}</p>
                  </div>
                ) : subTopics.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Available Sub-Topics
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSubTopicDialogOpen(true)}
                        className="text-xs hover:bg-cyber-400/10 hover:text-cyber-400"
                      >
                        <Target className="h-3 w-3 mr-1" />
                        Select Topic
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {subTopics.map((subTopic, index) => (
                        <div 
                          key={subTopic.id} 
                          className="flex items-start space-x-3 p-3 border rounded-lg hover:border-cyber-400/50 transition-colors cursor-pointer hover-lift"
                          onClick={() => handleSelectSubTopic(subTopic)}
                        >
                          <div className="bg-cyber-400/10 p-2 rounded-lg">
                            {getCategoryIcon(subTopic.category)}
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{subTopic.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs capitalize border-cyber-400/30">
                                {subTopic.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize border-cyber-400/30">
                                {subTopic.level}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full hover:bg-cyber-400/10 hover:text-cyber-400"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-cyber-400/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
                      <Zap className="h-8 w-8 text-cyber-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Lesson Plans Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate personalized lesson plans for this student based on their profile.
                    </p>
                    <Button 
                      onClick={handleGenerateLessons}
                      className="btn-cyber"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Lessons
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactive Lesson Material */}
            {selectedSubTopic && (
              <div ref={lessonContentRef}>
                {isLoadingLessonContent || isGeneratingInteractiveMaterial ? (
                  <Card className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-cyber-400" />
                        <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl"></div>
                      </div>
                      <p className="text-center text-muted-foreground">
                        {isGeneratingInteractiveMaterial 
                          ? "Generating interactive material..." 
                          : "Loading lesson content..."}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <LessonMaterialDisplayWithProgress
                    subTopic={selectedSubTopic}
                    lessonContent={lessonContent}
                    onComplete={handleCompleteLessonMaterial}
                    isCompleting={isCompletingLesson}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Edit Form Dialog */}
      <StudentForm
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        student={student}
        onSuccess={() => {
          setIsEditFormOpen(false);
          // Refresh the page to show updated student data
          router.refresh();
        }}
      />

      {/* Sub-Topic Selection Dialog */}
      <SubTopicSelectionDialog
        open={isSubTopicDialogOpen}
        onOpenChange={setIsSubTopicDialogOpen}
        subTopics={subTopics}
        onSelectSubTopic={handleSelectSubTopic}
        isGenerating={isGeneratingInteractiveMaterial}
        generationProgress="Creating interactive material..."
      />

      {/* Lesson Editor Dialog */}
      <LessonEditorDialog
        open={isLessonEditorDialogOpen}
        onOpenChange={setIsLessonEditorDialogOpen}
        studentId={student.id}
        onLessonUpdated={() => {
          // Refresh lesson content if the current lesson was updated
          if (selectedSubTopic) {
            fetchLessonContent();
          }
        }}
      />
    </MainLayout>
  );
}