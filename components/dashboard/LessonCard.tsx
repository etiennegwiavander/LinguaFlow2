"use client";

import { useState } from "react";
import { Lesson } from "@/types";
import { languages } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Calendar, 
  ChevronRight,
  ClipboardList,
  Clock,
  X
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LessonCardProps {
  lesson: Lesson;
  className?: string;
}

export default function LessonCard({ lesson, className }: LessonCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "completed":
        return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled":
        return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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

  const languageInfo = getLanguageInfo(lesson.student.target_language);

  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-200 hover:shadow-md h-full", 
          className
        )}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-3">
                <AvatarImage src={lesson.student.avatar_url || undefined} alt={lesson.student.name} />
                <AvatarFallback>{getInitials(lesson.student.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm sm:text-base font-semibold">{lesson.student.name}</h3>
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                  <span className="mr-1.5 text-base sm:text-lg">{languageInfo.flag}</span>
                  <span>{languageInfo.name}</span>
                  <span className="mx-2">•</span>
                  <Badge variant="outline" className="capitalize text-xs font-normal">
                    {lesson.student.level}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge className={cn("capitalize text-xs", getStatusColor(lesson.status))}>
              {lesson.status}
            </Badge>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-muted-foreground" />
              <span>{format(new Date(lesson.date), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-muted-foreground" />
              <span>{format(new Date(lesson.date), "h:mm a")}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-muted-foreground" />
              <span className="truncate">{lesson.materials.join(", ")}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/50 px-4 sm:px-6 py-2 sm:py-3">
          <Button 
            variant="ghost" 
            className="ml-auto flex items-center text-xs sm:text-sm hover:bg-background"
            onClick={() => setIsDialogOpen(true)}
          >
            <span>View Lesson</span>
            <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <span className="mr-2 text-xl">{languageInfo.flag}</span>
              Lesson with {lesson.student.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 my-2">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-4">
                  <AvatarImage src={lesson.student.avatar_url || undefined} alt={lesson.student.name} />
                  <AvatarFallback>{getInitials(lesson.student.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">{lesson.student.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {languageInfo.name} • <span className="capitalize">{lesson.student.level}</span>
                  </p>
                </div>
              </div>
              <Badge className={cn("capitalize", getStatusColor(lesson.status))}>
                {lesson.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Date</p>
                <p>{format(new Date(lesson.date), "EEEE, MMMM d, yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Time</p>
                <p>{format(new Date(lesson.date), "h:mm a")}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Lesson Notes</h4>
              <p className="text-xs sm:text-sm">{lesson.notes || "No notes available"}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Materials</h4>
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                {lesson.materials.map((material, index) => (
                  <li key={index}>{material}</li>
                ))}
              </ul>
            </div>
            
            {lesson.previous_challenges && lesson.previous_challenges.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Previous Challenges</h4>
                <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                  {lesson.previous_challenges.map((challenge, index) => (
                    <li key={index}>{challenge}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {lesson.generated_lessons && lesson.generated_lessons.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">AI-Generated Lesson Ideas</h4>
                <div className="grid gap-2">
                  {lesson.generated_lessons.map((genLesson, index) => (
                    <div 
                      key={index} 
                      className="bg-secondary/50 p-2 sm:p-3 rounded-md text-xs sm:text-sm flex items-start"
                    >
                      <span className="mr-2 font-medium">{index + 1}.</span>
                      <span>{genLesson}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button>Select Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}