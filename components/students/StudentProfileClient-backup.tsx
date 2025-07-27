"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { Student, SubTopic } from "@/types";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { format } from "date-fns";
import MainLayout from "@/components/main-layout";
import StudentForm from "@/components/students/StudentForm";
import SubTopicSelectionDialog from "@/components/students/SubTopicSelectionDialog";
import LessonMaterialDisplay from "@/components/lessons/LessonMaterialDisplay";
import { ProgressContext } from "@/lib/progress-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, Edit, Brain, BookOpen, Target, Play, 
  Loader2, CheckCircle, Clock, Lightbulb, X, History, User 
} from "lucide-react";

interface StudentProfileClientProps {
  student: Student;
}

interface LessonData {
  id: string;
  date: string;
  status: string;
  generated_lessons: string[] | null;
  sub_topics: SubTopic[] | null;
  interactive_lesson_content: any | null;
}

export default function StudentProfileClient({ student: initialStudent }: StudentProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student>(initialStudent);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingInteractive, setIsGeneratingInteractive] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [upcomingLesson, setUpcomingLesson] = useState<LessonData | null>(null);
  const [generatedLessons, setGeneratedLessons] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("ai-architect");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { initializeFromLessonData, markSubTopicComplete } = useContext(ProgressContext);

  const getInitials = (name: string) => {
    return name.split(" ").map((part) => part[0]).join("").toUpperCase();
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || { code, name: code, flag: '🌐' };
  };

  const targetLanguageInfo = getLanguageInfo(student.target_language);
  const availableSubTopics = upcomingLesson?.sub_topics || [];

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 ring-4 ring-cyber-400/20">
              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
              <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 text-lg">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="gradient-text">{student.name}</span>
              </h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <span>{targetLanguageInfo.name}</span>
                <span>•</span>
                <Badge variant="outline" className="capitalize border-cyber-400/30">
                  {student.level}
                </Badge>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-effect border-cyber-400/20">
            <TabsTrigger value="ai-architect" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Lesson Architect</span>
            </TabsTrigger>
            <TabsTrigger value="lesson-material" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson Material</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Lesson Architect Tab */}
          <TabsContent value="ai-architect" className="space-y-6 animate-scale-in">
            <Card className="floating-card glass-effect border-cyber-400/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-cyber-400" />
                  AI Lesson Architect
                </CardTitle>
                <CardDescription>
                  Generate personalized lesson plans with focused sub-topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-cyber-400/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Generate Lesson Ideas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-gradient-to-r from-cyber-400 to-neon-400">
                        Generate Lessons
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-400/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800">Interactive Material</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500"
                        onClick={() => setIsSubTopicDialogOpen(true)}
                      >
                        Choose Sub-topic
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs */}
          <TabsContent value="lesson-material">
            <Card>
              <CardContent className="p-6">
                <p>Lesson material content goes here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-6">
                <p>Lesson history content goes here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardContent className="p-6">
                <p>Student profile content goes here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {isFormOpen && (
          <StudentForm
            student={student}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSuccess={() => {
              setIsFormOpen(false);
              toast.success('Student updated successfully');
            }}
          />
        )}

        <SubTopicSelectionDialog
          open={isSubTopicDialogOpen}
          onOpenChange={setIsSubTopicDialogOpen}
          subTopics={availableSubTopics}
          onSelectSubTopic={(subTopic) => {
            markSubTopicComplete(subTopic.id);
            setIsSubTopicDialogOpen(false);
            toast.success('Interactive material created!');
          }}
          isGenerating={isGeneratingInteractive}
          generationProgress={generationProgress}
        />
      </div>
    </MainLayout>
  );
}