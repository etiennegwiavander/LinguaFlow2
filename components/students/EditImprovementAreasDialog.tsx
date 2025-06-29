"use client";

import { useState } from "react";
import { Student } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, X } from "lucide-react";

interface EditImprovementAreasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onSuccess: () => void;
}

export default function EditImprovementAreasDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: EditImprovementAreasDialogProps) {
  const [grammarWeaknesses, setGrammarWeaknesses] = useState(student.grammar_weaknesses || "");
  const [vocabularyGaps, setVocabularyGaps] = useState(student.vocabulary_gaps || "");
  const [pronunciationChallenges, setPronunciationChallenges] = useState(student.pronunciation_challenges || "");
  const [conversationalFluencyBarriers, setConversationalFluencyBarriers] = useState(student.conversational_fluency_barriers || "");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("grammar");

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          grammar_weaknesses: grammarWeaknesses,
          vocabulary_gaps: vocabularyGaps,
          pronunciation_challenges: pronunciationChallenges,
          conversational_fluency_barriers: conversationalFluencyBarriers,
        })
        .eq('id', student.id);

      if (error) throw error;
      
      toast.success('Improvement areas updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update improvement areas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-effect border-cyber-400/30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/5 to-neon-400/5 rounded-lg pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-400/30 via-neon-400/30 to-cyber-400/30"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-neon-400/30 via-cyber-400/30 to-neon-400/30"></div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center text-xl">
            <span className="gradient-text">Edit Improvement Areas</span> for {student.name}
          </DialogTitle>
          <DialogDescription className="text-base">
            Update the areas where {student.name} needs to improve to help generate better personalized lessons
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 relative z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full glass-effect border-cyber-400/20">
              <TabsTrigger 
                value="grammar" 
                className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/30 dark:data-[state=active]:text-red-400"
              >
                Grammar
              </TabsTrigger>
              <TabsTrigger 
                value="vocabulary" 
                className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 dark:data-[state=active]:bg-orange-900/30 dark:data-[state=active]:text-orange-400"
              >
                Vocabulary
              </TabsTrigger>
              <TabsTrigger 
                value="pronunciation" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400"
              >
                Pronunciation
              </TabsTrigger>
              <TabsTrigger 
                value="conversation" 
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-400"
              >
                Conversation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grammar" className="mt-4 space-y-3">
              <div className="p-4 border border-red-200 rounded-lg bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20">
                <Label htmlFor="grammar-weaknesses" className="text-red-600 dark:text-red-400 font-medium mb-2 block">
                  Grammar Weaknesses
                </Label>
                <Textarea
                  id="grammar-weaknesses"
                  value={grammarWeaknesses}
                  onChange={(e) => setGrammarWeaknesses(e.target.value)}
                  placeholder="Describe grammar areas that need improvement..."
                  className="min-h-[150px] border-red-200 focus:border-red-400 bg-white/80 dark:bg-gray-900/80"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Examples: Struggles with past tense, confuses articles, difficulty with conditional sentences
                </p>
              </div>
            </TabsContent>

            <TabsContent value="vocabulary" className="mt-4 space-y-3">
              <div className="p-4 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
                <Label htmlFor="vocabulary-gaps" className="text-orange-600 dark:text-orange-400 font-medium mb-2 block">
                  Vocabulary Gaps
                </Label>
                <Textarea
                  id="vocabulary-gaps"
                  value={vocabularyGaps}
                  onChange={(e) => setVocabularyGaps(e.target.value)}
                  placeholder="Describe vocabulary areas that need improvement..."
                  className="min-h-[150px] border-orange-200 focus:border-orange-400 bg-white/80 dark:bg-gray-900/80"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Examples: Limited professional vocabulary, needs more phrasal verbs, struggles with idioms
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pronunciation" className="mt-4 space-y-3">
              <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <Label htmlFor="pronunciation-challenges" className="text-blue-600 dark:text-blue-400 font-medium mb-2 block">
                  Pronunciation Challenges
                </Label>
                <Textarea
                  id="pronunciation-challenges"
                  value={pronunciationChallenges}
                  onChange={(e) => setPronunciationChallenges(e.target.value)}
                  placeholder="Describe pronunciation areas that need improvement..."
                  className="min-h-[150px] border-blue-200 focus:border-blue-400 bg-white/80 dark:bg-gray-900/80"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Examples: Difficulty with 'th' sound, stress patterns in longer words, intonation issues
                </p>
              </div>
            </TabsContent>

            <TabsContent value="conversation" className="mt-4 space-y-3">
              <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20">
                <Label htmlFor="conversational-barriers" className="text-purple-600 dark:text-purple-400 font-medium mb-2 block">
                  Conversational Fluency Barriers
                </Label>
                <Textarea
                  id="conversational-barriers"
                  value={conversationalFluencyBarriers}
                  onChange={(e) => setConversationalFluencyBarriers(e.target.value)}
                  placeholder="Describe conversation areas that need improvement..."
                  className="min-h-[150px] border-purple-200 focus:border-purple-400 bg-white/80 dark:bg-gray-900/80"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Examples: Hesitates when speaking, limited small talk ability, struggles with turn-taking
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="relative z-10 flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="btn-ghost-cyber"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}