"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lesson } from "@/types";
import { languages } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Calendar, 
  ChevronRight,
  ClipboardList,
  Clock,
  X,
  Sparkles,
  ExternalLink
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
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "badge-success";
      case "completed":
        return "badge-success";
      case "cancelled":
        return "badge-error";
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200";
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

  const handleStudentClick = () => {
    router.push(`/students/${lesson.student.id}`);
  };

  const languageInfo = getLanguageInfo(lesson.student.target_language);

  return (
    <>
      <Card 
        className={cn(
          "cyber-card h-full group overflow-hidden relative hover:shadow-md", 
          className
        )}
      >
        <CardContent className="p-4 sm:p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Avatar 
                className="h-8 w-8 sm:h-10 sm:w-10 mr-3 ring-2 ring-cyber-400/20 group-hover:ring-cyber-400/50 transition-all duration-300 cursor-pointer"
                onClick={handleStudentClick}
              >
                <AvatarImage src={lesson.student.avatar_url || undefined} alt={lesson.student.name} />
                <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 font-semibold">
                  {getInitials(lesson.student.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <h3 
                    className="text-sm sm:text-base font-semibold group-hover:text-cyber-400 transition-colors duration-300 cursor-pointer hover:underline"
                    onClick={handleStudentClick}
                  >
                    {lesson.student.name}
                  </h3>
                  <ExternalLink 
                    className="h-3 w-3 text-muted-foreground group-hover:text-cyber-400 transition-colors duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
                    onClick={handleStudentClick}
                  />
                </div>
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                  <span className="mr-1.5 text-base sm:text-lg">{languageInfo.flag}</span>
                  <span>{languageInfo.name}</span>
                  <span className="mx-2">•</span>
                  <Badge variant="outline" className="capitalize text-xs font-normal border-cyber-400/30">
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
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-cyber-400" />
              <span>{format(new Date(lesson.date), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-neon-400" />
              <span>{format(new Date(lesson.date), "h:mm a")}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-purple-400" />
              <span className="truncate">{lesson.materials.join(", ")}</span>
            </div>
            {lesson.generated_lessons && lesson.generated_lessons.length > 0 && (
              <div className="flex items-center text-xs sm:text-sm">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">AI Plans Ready</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 px-4 sm:px-6 py-2 sm:py-3 relative z-10">
          <Button 
            variant="ghost" 
            className="ml-auto flex items-center text-xs sm:text-sm hover:bg-cyber-400/10 hover:text-cyber-400 transition-all duration-300 group focus-cyber"
            onClick={() => setIsDialogOpen(true)}
          >
            <span>View Lesson</span>
            <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-cyber-400/30">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <span className="mr-2 text-xl">{languageInfo.flag}</span>
              Lesson with <span className="gradient-text ml-1">{lesson.student.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 my-2">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center">
                <Avatar 
                  className="h-10 w-10 sm:h-12 sm:w-12 mr-4 ring-2 ring-cyber-400/20 cursor-pointer"
                  onClick={handleStudentClick}
                >
                  <AvatarImage src={lesson.student.avatar_url || undefined} alt={lesson.student.name} />
                  <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 font-semibold">
                    {getInitials(lesson.student.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-1">
                    <h3 
                      className="font-semibold text-base sm:text-lg cursor-pointer hover:text-cyber-400 hover:underline transition-colors"
                      onClick={handleStudentClick}
                    >
                      {lesson.student.name}
                    </h3>
                    <ExternalLink 
                      className="h-3 w-3 text-muted-foreground hover:text-cyber-400 transition-colors duration-300 cursor-pointer"
                      onClick={handleStudentClick}
                    />
                  </div>
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
              <div className="p-3 bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 rounded-lg border border-cyber-400/20">
                <p className="text-xs sm:text-sm">{lesson.notes || "No notes available"}</p>
              </div>
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
                <h4 className="font-medium flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
                  AI-Generated Lesson Ideas
                </h4>
                <div className="grid gap-2">
                  {lesson.generated_lessons.map((genLesson, index) => (
                    <div 
                      key={index} 
                      className="bg-gradient-to-r from-emerald-50/50 to-cyan-50/50 dark:from-emerald-900/20 dark:to-cyan-900/20 p-2 sm:p-3 rounded-md text-xs sm:text-sm flex items-start border border-emerald-200/50 dark:border-emerald-800/50"
                    >
                      <span className="mr-2 font-medium text-emerald-600 dark:text-emerald-400">{index + 1}.</span>
                      <span>{genLesson}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="btn-ghost-cyber">
                Close
              </Button>
            </DialogClose>
            <Button 
              className="btn-cyber"
              onClick={handleStudentClick}
            >
              View Student Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}