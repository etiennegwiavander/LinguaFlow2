"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Student } from "@/types";
import { languages } from "@/lib/sample-data";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  GraduationCap, 
  Languages, 
  Target, 
  MessageSquare, 
  Pencil,
  ArrowLeft,
  Sparkles,
  Brain,
  Lightbulb,
  CheckSquare
} from "lucide-react";
import AIArchitectSection from "./AIArchitectSection";

interface StudentProfileClientProps {
  student: Student;
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

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

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back button */}
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="btn-ghost-cyber"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Students
      </Button>

      {/* Student header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <Avatar className="h-24 w-24 border-4 border-cyber-400/30">
            <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge className="badge-cyber">
              <GraduationCap className="w-3 h-3 mr-1" />
              Student
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">{student.name}</span>
          </h1>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Languages className="h-4 w-4 text-cyber-400" />
              <span className="text-lg mr-1">{languageInfo.flag}</span>
              <span>{languageInfo.name}</span>
              <Badge variant="outline" className="ml-1 capitalize border-cyber-400/30">
                {student.level}
              </Badge>
            </div>
            {nativeLanguageInfo && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <MessageSquare className="h-4 w-4 text-neon-400" />
                <span className="text-lg mr-1">{nativeLanguageInfo.flag}</span>
                <span>Native: {nativeLanguageInfo.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow"></div>
        <div className="flex flex-col sm:flex-row gap-2 self-start">
          <Button 
            variant="outline"
            className="btn-ghost-cyber"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button className="btn-cyber">
            <BookOpen className="mr-2 h-4 w-4" />
            Create Lesson
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Lessons</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="ai-architect" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Architect</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-cyber-400" />
                  Learning Goals
                </CardTitle>
                <CardDescription>
                  Student's end goals and learning objectives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">End Goals</h3>
                  <p className="text-sm">{student.end_goals || "No end goals specified"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-neon-400" />
                  Learning Style
                </CardTitle>
                <CardDescription>
                  Preferred learning methods and approaches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.learning_styles && student.learning_styles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.learning_styles.map((style) => (
                        <Badge key={style} variant="outline" className="capitalize border-neon-400/30">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No learning styles specified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>
                  Specific challenges and focus areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Grammar Weaknesses</h3>
                    <p className="text-sm">{student.grammar_weaknesses || "No grammar weaknesses specified"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Vocabulary Gaps</h3>
                    <p className="text-sm">{student.vocabulary_gaps || "No vocabulary gaps specified"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Pronunciation Challenges</h3>
                    <p className="text-sm">{student.pronunciation_challenges || "No pronunciation challenges specified"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Conversational Fluency Barriers</h3>
                    <p className="text-sm">{student.conversational_fluency_barriers || "No conversational fluency barriers specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-purple-500" />
                  Additional Notes
                </CardTitle>
                <CardDescription>
                  Other important information about this student
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{student.notes || "No additional notes"}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Lessons tab */}
        <TabsContent value="lessons" className="space-y-6">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Upcoming Lessons</CardTitle>
              <CardDescription>
                Scheduled lessons with this student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming lessons</h3>
                <p className="text-muted-foreground mb-4">Schedule a lesson with this student to see it here</p>
                <Button className="btn-cyber">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Progress tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>
                Track student's progress over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No progress data yet</h3>
                <p className="text-muted-foreground mb-4">Complete lessons with this student to track progress</p>
                <Button className="btn-cyber">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Architect tab */}
        <TabsContent value="ai-architect" className="space-y-6">
          <AIArchitectSection student={student} />
        </TabsContent>
      </Tabs>
    </div>
  );
}