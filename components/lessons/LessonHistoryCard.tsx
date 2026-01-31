"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, BookOpen, Target, Calendar, Clock, User } from 'lucide-react';
import LessonBannerImage from './LessonBannerImage';

interface LessonHistoryCardProps {
  lessonEntry: any;
  onViewLesson: (lessonEntry: any) => void;
}

export default function LessonHistoryCard({ lessonEntry, onViewLesson }: LessonHistoryCardProps) {
  const completionDate = new Date(lessonEntry.completedAt);
  const completedSubTopic = lessonEntry.completedSubTopic;
  const hasInteractiveContent = !!lessonEntry.interactive_lesson_content;

  // Extract lesson title and subject from the completed sub-topic or lesson data
  const lessonTitle = completedSubTopic?.title || 'Completed Lesson';
  const lessonSubject = completedSubTopic?.category || 'English';
  const lessonLevel = completedSubTopic?.level || 'intermediate';

  return (
    <Card className="overflow-hidden border-cyber-400/20 bg-gradient-to-br from-white/50 to-blue-50/30 dark:from-gray-950/50 dark:to-blue-950/20 hover:shadow-lg transition-all duration-300 group">
      {/* Banner Image Section */}
      <div className="relative h-48 overflow-hidden">
        <LessonBannerImage
          title={lessonTitle}
          subtitle={completedSubTopic?.description}
          subject={lessonSubject}
          level={lessonLevel}
          className="h-full"
        />
        
        {/* Completion Badge Overlay */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-green-500/90 text-white border-0 shadow-lg backdrop-blur-sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        </div>

        {/* Date Badge Overlay */}
        {/* <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-800 border-0 shadow-lg backdrop-blur-sm">
            <Calendar className="w-3 h-3 mr-1" />
            {completionDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })}
          </Badge>
        </div> */}
      </div>

      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-green-800 dark:text-green-200 line-clamp-2">
            {lessonTitle}
          </h3>
          
          {completedSubTopic?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {completedSubTopic.description}
            </p>
          )}
        </div>

        {/* Lesson Details */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{lessonSubject}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span className="capitalize">{lessonLevel}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {completionDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Feature Badges */}
        {/* <div className="flex flex-wrap gap-2">
          {hasInteractiveContent && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              <BookOpen className="w-3 h-3 mr-1" />
              Interactive Material
            </Badge>
          )}
          {lessonEntry.lesson_template_id && (
            <Badge variant="outline" className="text-xs border-cyber-400/30">
              <Target className="w-3 h-3 mr-1" />
              Template Applied
            </Badge>
          )}
        </div> */}

        {/* Action Button */}
        <div className="pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewLesson(lessonEntry)}
                  className="w-full border-cyber-400/30 hover:bg-cyber-600/80 group-hover:border-cyber-400/50 transition-colors"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Lesson Material
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Review the completed lesson content</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}