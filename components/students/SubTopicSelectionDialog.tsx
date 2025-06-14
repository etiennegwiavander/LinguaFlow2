"use client";

import { useState } from "react";
import { SubTopic } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Globe
} from "lucide-react";

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

export default function SubTopicSelectionDialog({
  open,
  onOpenChange,
  subTopics,
  onSelectSubTopic,
  isGenerating,
  generationProgress
}: SubTopicSelectionDialogProps) {
  const [editedSubTopics, setEditedSubTopics] = useState<SubTopic[]>(subTopics);

  // Update edited sub-topics when props change
  useState(() => {
    setEditedSubTopics(subTopics);
  }, [subTopics]);

  const handleSubTopicEdit = (index: number, field: keyof SubTopic, value: string) => {
    const updated = [...editedSubTopics];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSubTopics(updated);
  };

  const handleSelectSubTopic = (subTopic: SubTopic) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Target className="mr-2 h-6 w-6 text-primary" />
            Choose a Sub-Topic for Interactive Material
          </DialogTitle>
          <DialogDescription className="text-base">
            Select and optionally edit a specific sub-topic to create focused interactive lesson material. 
            Each sub-topic is designed for 15-20 minutes of focused learning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {isGenerating && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Creating Interactive Material...
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {generationProgress || 'This may take a moment...'}
                </p>
              </div>
            </div>
          )}

          {editedSubTopics.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No Sub-Topics Available</h3>
              <p className="text-muted-foreground">
                Generate lesson plans first to see available sub-topics.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {editedSubTopics.map((subTopic, index) => {
                const IconComponent = getCategoryIcon(subTopic.category);
                const categoryColor = getCategoryColor(subTopic.category);
                
                return (
                  <Card key={subTopic.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${categoryColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="space-y-1">
                              <Label htmlFor={`title-${index}`} className="text-sm font-medium">
                                Title
                              </Label>
                              <Input
                                id={`title-${index}`}
                                value={subTopic.title}
                                onChange={(e) => handleSubTopicEdit(index, 'title', e.target.value)}
                                className="font-medium"
                                disabled={isGenerating}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`category-${index}`} className="text-sm font-medium">
                                  Category
                                </Label>
                                <Select
                                  value={subTopic.category}
                                  onValueChange={(value) => handleSubTopicEdit(index, 'category', value)}
                                  disabled={isGenerating}
                                >
                                  <SelectTrigger>
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
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Level</Label>
                                <Badge variant="outline" className="w-fit capitalize">
                                  {subTopic.level}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {subTopic.description && (
                      <CardContent className="pt-0 pb-3">
                        <p className="text-sm text-muted-foreground">
                          {subTopic.description}
                        </p>
                      </CardContent>
                    )}
                    
                    <CardContent className="pt-0">
                      <Button
                        onClick={() => handleSelectSubTopic(editedSubTopics[index])}
                        disabled={isGenerating}
                        className="w-full"
                        size="sm"
                      >
                        {isGenerating ? (
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}