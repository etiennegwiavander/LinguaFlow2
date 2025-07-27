"use client";

import { useState, useEffect, useContext } from "react";
import { SubTopic } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  Edit3, 
  Play, 
  Loader2,
  Target,
  MessageSquare,
  GraduationCap,
  Users,
  Volume2,
  Eye,
  Globe,
  CheckCircle
} from "lucide-react";
import { ProgressContext, ProgressProvider } from "@/lib/progress-context";

interface SubTopicSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subTopics: SubTopic[];
  onSelectSubTopic: (subTopic: SubTopic) => void;
  isGenerating: boolean;
  generationProgress: string;
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

function SubTopicSelectionDialogContent({
  open,
  onOpenChange,
  subTopics,
  onSelectSubTopic,
  isGenerating,
  generationProgress
}: SubTopicSelectionDialogProps) {
  const [editedSubTopics, setEditedSubTopics] = useState<SubTopic[]>([]);
  const [progressValue, setProgressValue] = useState(0);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const { completedSubTopics, isSubTopicCompleted, markSubTopicComplete } = useContext(ProgressContext);

  // Track completed sub-topics (debug logs removed to prevent console spam)

  // Update edited sub-topics when props change
  useEffect(() => {
    setEditedSubTopics(subTopics);
  }, [subTopics]);

  // Progress bar animation effect
  useEffect(() => {
    if (isGenerating && isCompletingLesson) {
      const interval = setInterval(() => {
        setProgressValue((prev) => {
          // Gradually increase to 90%, then wait for completion
          if (prev < 90) {
            return prev + 5;
          }
          return prev;
        });
      }, 300);

      return () => clearInterval(interval);
    } else if (!isGenerating && isCompletingLesson) {
      // When generation is complete, fill to 100%
      setProgressValue(100);
      
      // Reset after a delay
      const timeout = setTimeout(() => {
        setIsCompletingLesson(false);
        setProgressValue(0);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isGenerating, isCompletingLesson]);

  const handleSubTopicEdit = (index: number, field: keyof SubTopic, value: string) => {
    const updated = [...editedSubTopics];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSubTopics(updated);
  };

  const handleSelectSubTopic = (subTopic: SubTopic) => {
    setIsCompletingLesson(true);
    onSelectSubTopic(subTopic);
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || BookOpen;
    return IconComponent;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-cyber-400/30 backdrop-blur-md bg-background/80">
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/5 to-neon-400/5 rounded-lg pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-400/30 via-neon-400/30 to-cyber-400/30"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-neon-400/30 via-cyber-400/30 to-neon-400/30"></div>
      
      <DialogHeader className="relative z-10">
        <DialogTitle className="flex items-center text-xl">
          <Target className="mr-2 h-6 w-6 text-cyber-400" />
          <span className="gradient-text">Choose a Sub-Topic</span> for Interactive Material
        </DialogTitle>
        <DialogDescription className="text-base">
          Select and optionally edit a specific sub-topic to create focused interactive lesson material. 
          Each sub-topic is designed for 15-20 minutes of focused learning.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-4 relative z-10">
        {(isGenerating || isCompletingLesson) && (
          <div className="space-y-3">
            {isCompletingLesson && (
              <div className="w-full">
                <Progress value={progressValue} className="h-2 w-full bg-gradient-to-r from-cyber-200 to-neon-200" />
              </div>
            )}
            
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {progressValue === 100 ? (
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Lesson Completed Successfully
                    </span>
                  ) : (
                    "Creating Interactive Material..."
                  )}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {generationProgress || 'This may take a moment...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {editedSubTopics.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-cyber-400 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No Sub-Topics Available</h3>
            <p className="text-muted-foreground">
              Generate lesson plans first to see available sub-topics.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {editedSubTopics.map((subTopic, index) => {
              const IconComponent = getCategoryIcon(subTopic.category);
              const categoryColor = getCategoryColor(subTopic.category);
              const isCompleted = isSubTopicCompleted(subTopic.id);
              
              // Only log completed sub-topics for debugging (reduced noise)
              // if (isCompleted) console.log('✅ Completed:', subTopic.title);
              
              return (
                <Card 
                  key={subTopic.id} 
                  className={`p-6 transition-all duration-300 ${
                    isCompleted 
                      ? 'border-green-400 bg-green-50/50 dark:bg-green-900/20 shadow-green-100' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-cyber-400/50 hover:shadow-lg'
                  }`}
                >
                  {/* Icon and Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${categoryColor}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Material Created
                      </Badge>
                    )}
                  </div>

                  {/* Title Section */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                      Title
                    </Label>
                    <Input
                      value={subTopic.title}
                      onChange={(e) => handleSubTopicEdit(index, 'title', e.target.value)}
                      className="font-medium text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      disabled={isGenerating || isCompletingLesson}
                    />
                  </div>

                  {/* Category and Level Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                        Category
                      </Label>
                      <Select
                        value={subTopic.category}
                        onValueChange={(value) => handleSubTopicEdit(index, 'category', value)}
                        disabled={isGenerating || isCompletingLesson}
                      >
                        <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-cyan-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grammar">Grammar</SelectItem>
                          <SelectItem value="Conversation">Conversation</SelectItem>
                          <SelectItem value="Business English">Business English</SelectItem>
                          <SelectItem value="English for Kids">English for Kids</SelectItem>
                          <SelectItem value="Vocabulary">Vocabulary</SelectItem>
                          <SelectItem value="Pronunciation">Pronunciation</SelectItem>
                          <SelectItem value="Picture Description">Picture Description</SelectItem>
                          <SelectItem value="English for Travel">English for Travel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                        Level
                      </Label>
                      <div className="pt-1">
                        <Badge variant="outline" className="capitalize text-sm px-3 py-1 border-gray-300">
                          {subTopic.level}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {subTopic.description && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {subTopic.description}
                      </p>
                    </div>
                  )}

                  {/* Create Interactive Material Button */}
                  <Button
                    onClick={() => handleSelectSubTopic(editedSubTopics[index])}
                    disabled={isGenerating || isCompletingLesson}
                    className={`w-full py-3 text-base font-medium rounded-lg transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isGenerating || isCompletingLesson ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {progressValue === 100 ? "Completed" : "Creating..."}
                      </>
                    ) : isCompleted ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Recreate Material
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Create Interactive Material
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <DialogFooter className="relative z-10">
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          disabled={isGenerating || isCompletingLesson}
          className="btn-ghost-cyber"
        >
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function SubTopicSelectionDialog(props: SubTopicSelectionDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <SubTopicSelectionDialogContent {...props} />
    </Dialog>
  );
}