"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/main-layout";
import { Student, SubTopic } from "@/types";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  Target, 
  MessageSquare, 
  Brain,
  Sparkles,
  Play,
  Loader2,
  ArrowLeft,
  Globe,
  Languages as LanguagesIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import SubTopicSelectionDialog from "./SubTopicSelectionDialog";

interface StudentProfileClientProps {
  student: Student;
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [upcomingLesson, setUpcomingLesson] = useState<any>(null);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [isGeneratingInteractive, setIsGeneratingInteractive] = useState(false);

  useEffect(() => {
    fetchUpcomingLesson();
  }, [student.id, user]);

  const fetchUpcomingLesson = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', student.id)
        .eq('tutor_id', user.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setUpcomingLesson(data);

      // Extract sub-topics if available
      if (data?.sub_topics) {
        console.log('📋 Found sub-topics in lesson:', data.sub_topics);
        setSubTopics(data.sub_topics);
      }
    } catch (error: any) {
      console.error('Error fetching upcoming lesson:', error);
    }
  };

  const handleGenerateLessons = async () => {
    if (!user || !upcomingLesson) return;

    setIsGenerating(true);
    setGenerationProgress("Analyzing student profile...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      setGenerationProgress("Generating personalized lesson plans...");

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-lesson-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: upcomingLesson.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate lessons');
      }

      const result = await response.json();
      
      if (result.success) {
        setGenerationProgress("Lessons generated successfully!");
        
        // Update the sub-topics state
        if (result.sub_topics) {
          console.log('🎯 Setting sub-topics from generation result:', result.sub_topics);
          setSubTopics(result.sub_topics);
        }
        
        toast.success(`Generated ${result.lessons?.length || 0} lesson plans successfully!`);
        
        // Refresh the lesson data
        await fetchUpcomingLesson();
      } else {
        throw new Error(result.error || 'Failed to generate lessons');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate lesson plans');
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleSelectSubTopic = async (subTopic: SubTopic) => {
    if (!user || !upcomingLesson) return;

    setIsGeneratingInteractive(true);
    setGenerationProgress("Creating interactive material...");

    try {
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
          lesson_id: upcomingLesson.id,
          selected_sub_topic: subTopic
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate interactive material');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Interactive lesson material created successfully!');
        setIsSubTopicDialogOpen(false);
        
        // Navigate to the lesson material view
        router.push(`/lessons/${upcomingLesson.id}/material`);
      } else {
        throw new Error(result.error || 'Failed to generate interactive material');
      }
    } catch (error: any) {
      console.error('Interactive generation error:', error);
      toast.error(error.message || 'Failed to generate interactive material');
    } finally {
      setIsGeneratingInteractive(false);
      setGenerationProgress("");
    }
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || { code, name: code, flag: '🌐' };
  };

  const targetLanguageInfo = getLanguageInfo(student.target_language);
  const nativeLanguageInfo = student.native_language ? getLanguageInfo(student.native_language) : null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Back button and header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="border-cyber-400/30 hover:bg-cyber-400/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <div className="flex items-center space-x-2">
            <Badge className="bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
              <Users className="w-3 h-3 mr-1" />
              Student Profile
            </Badge>
          </div>
        </div>

        {/* Student Profile Header */}
        <Card className="floating-card glass-effect border-cyber-400/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyber-400/20 to-neon-400/20 rounded-full flex items-center justify-center text-2xl font-bold text-cyber-600 dark:text-cyber-400">
                  {getInitials(student.name)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text">{student.name}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{targetLanguageInfo.flag}</span>
                      <span className="font-medium">{targetLanguageInfo.name}</span>
                      <Badge variant="outline" className="capitalize border-cyber-400/30">
                        {student.level}
                      </Badge>
                    </div>
                    {nativeLanguageInfo && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <span className="text-lg">{nativeLanguageInfo.flag}</span>
                        <span className="text-sm">Native: {nativeLanguageInfo.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="ai-architect" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">AI Architect</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Learning Goals */}
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-cyber-400" />
                    Learning Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {student.end_goals || "No specific goals defined yet."}
                  </p>
                </CardContent>
              </Card>

              {/* Learning Styles */}
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-neon-400" />
                    Learning Styles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.learning_styles && student.learning_styles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.learning_styles.map((style, index) => (
                        <Badge key={index} variant="outline" className="capitalize border-neon-400/30">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No learning styles specified.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Areas for Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="text-lg">Grammar Weaknesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {student.grammar_weaknesses || "No specific weaknesses noted."}
                  </p>
                </CardContent>
              </Card>

              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="text-lg">Vocabulary Gaps</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {student.vocabulary_gaps || "No specific gaps noted."}
                  </p>
                </CardContent>
              </Card>

              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="text-lg">Pronunciation Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {student.pronunciation_challenges || "No specific challenges noted."}
                  </p>
                </CardContent>
              </Card>

              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle className="text-lg">Conversation Barriers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {student.conversational_fluency_barriers || "No specific barriers noted."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Notes */}
            {student.notes && (
              <Card className="floating-card glass-effect border-cyber-400/20">
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {student.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <Card className="floating-card glass-effect border-cyber-400/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-cyber-400" />
                  Upcoming Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingLesson ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-cyber-400/20">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-cyber-400" />
                          <span className="font-medium">
                            {format(new Date(upcomingLesson.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <Badge variant="outline" className="capitalize border-cyber-400/30">
                          {upcomingLesson.status}
                        </Badge>
                      </div>
                      {upcomingLesson.interactive_lesson_content ? (
                        <Button 
                          onClick={() => router.push(`/lessons/${upcomingLesson.id}/material`)}
                          className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          View Lesson Material
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">No interactive material yet</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No upcoming lessons scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Architect Tab */}
          <TabsContent value="ai-architect" className="space-y-6">
            <Card className="floating-card glass-effect border-cyber-400/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gradient-text">
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI Lesson Architect
                </CardTitle>
                <CardDescription>
                  Generate personalized lesson plans and interactive materials using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {upcomingLesson ? (
                  <>
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-cyber-400/20">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          Generate lesson ideas with focused sub-topics for {student.name}'s upcoming lesson
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <span>Scheduled for {format(new Date(upcomingLesson.date), "EEEE, MMM d, h:mm a")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Generate 3 personalized lesson plans with focused sub-topics based on {student.name}'s profile
                        </p>
                        
                        {/* Translation Button */}
                        {student.native_language && (
                          <div className="flex items-center space-x-2 mb-4">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">
                              Translation available: Double-click any text to translate to {getLanguageInfo(student.native_language).name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-3">
                        <Button
                          onClick={handleGenerateLessons}
                          disabled={isGenerating}
                          className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Generate Ideas for Next Lesson
                            </>
                          )}
                        </Button>

                        {subTopics.length > 0 && (
                          <Button
                            onClick={() => setIsSubTopicDialogOpen(true)}
                            disabled={isGeneratingInteractive}
                            variant="outline"
                            className="border-cyber-400/30 hover:bg-cyber-400/10 hover:border-cyber-400 transition-all duration-300"
                          >
                            {isGeneratingInteractive ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Create Interactive Material
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {isGenerating && generationProgress && (
                      <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-blue-800 dark:text-blue-200">{generationProgress}</span>
                      </div>
                    )}

                    {subTopics.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center">
                          <Target className="w-4 h-4 mr-2 text-cyber-400" />
                          Available Sub-Topics ({subTopics.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subTopics.slice(0, 6).map((subTopic, index) => (
                            <Card key={subTopic.id} className="floating-card glass-effect border-cyber-400/20 hover:border-cyber-400/50 transition-all duration-300">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <Badge variant="outline" className="text-xs border-cyber-400/30">
                                    {subTopic.category}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {subTopic.level.toUpperCase()}
                                  </Badge>
                                </div>
                                <h5 className="font-medium text-sm mb-2 line-clamp-2">
                                  {subTopic.title}
                                </h5>
                                {subTopic.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {subTopic.description}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        {subTopics.length > 6 && (
                          <p className="text-sm text-muted-foreground text-center">
                            And {subTopics.length - 6} more sub-topics available...
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Upcoming Lesson</h3>
                    <p className="text-muted-foreground">
                      Schedule a lesson for {student.name} to use the AI Lesson Architect
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sub-Topic Selection Dialog */}
        <SubTopicSelectionDialog
          open={isSubTopicDialogOpen}
          onOpenChange={setIsSubTopicDialogOpen}
          subTopics={subTopics}
          onSelectSubTopic={handleSelectSubTopic}
          isGenerating={isGeneratingInteractive}
          generationProgress={generationProgress}
        />
      </div>
    </MainLayout>
  );
}