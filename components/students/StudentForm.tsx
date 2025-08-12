"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Student } from "@/types";

const proficiencyLevels = [
  { value: "a1", label: "A1 - Beginner" },
  { value: "a2", label: "A2 - Elementary" },
  { value: "b1", label: "B1 - Intermediate" },
  { value: "b2", label: "B2 - Upper Intermediate" },
  { value: "c1", label: "C1 - Advanced" },
  { value: "c2", label: "C2 - Mastery" },
];

const ageGroups = [
  { value: "kid", label: "Kid (4-8 years)" },
  { value: "teenager", label: "Teenager (13-17 years)" },
  { value: "adult", label: "Adult (18-39 years)" },
  { value: "middle_aged_adult", label: "Middle-aged Adult (40-64 years)" },
  { value: "senior", label: "Senior (65+ years)" },
];

const learningStyles = [
  { id: "visual", label: "Visual" },
  { id: "auditory", label: "Auditory" },
  { id: "kinesthetic", label: "Kinesthetic" },
  { id: "readWrite", label: "Read/Write" },
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  targetLanguage: z.string().min(1, "Please select a target language"),
  nativeLanguage: z.string().optional(),
  proficiencyLevel: z.string().min(1, "Please select a proficiency level"),
  ageGroup: z.string().min(1, "Please select an age group"),
  endGoals: z.string().min(1, "Please specify the student's end goals"),
  grammarWeaknesses: z.string(),
  vocabularyGaps: z.string(),
  pronunciationChallenges: z.string(),
  conversationalFluencyBarriers: z.string(),
  learningStyles: z.array(z.string()),
  notes: z.string(),
});

type StudentFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  initialName?: string;
  onSuccess?: () => void;
};

export default function StudentForm({ open, onOpenChange, student, initialName, onSuccess }: StudentFormProps) {
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetLanguage: "",
      nativeLanguage: "",
      proficiencyLevel: "",
      ageGroup: "",
      endGoals: "",
      grammarWeaknesses: "",
      vocabularyGaps: "",
      pronunciationChallenges: "",
      conversationalFluencyBarriers: "",
      learningStyles: [],
      notes: "",
    },
  });

  useEffect(() => {
    if (student) {
      // Editing existing student
      form.reset({
        name: student.name,
        targetLanguage: student.target_language,
        nativeLanguage: student.native_language || "",
        proficiencyLevel: student.level,
        ageGroup: (student as any).age_group || "adult", // Default to adult if not set
        endGoals: student.end_goals || "",
        grammarWeaknesses: student.grammar_weaknesses || "",
        vocabularyGaps: student.vocabulary_gaps || "",
        pronunciationChallenges: student.pronunciation_challenges || "",
        conversationalFluencyBarriers: student.conversational_fluency_barriers || "",
        learningStyles: student.learning_styles || [],
        notes: student.notes || "",
      });
    } else {
      // Creating new student
      form.reset({
        name: initialName || "",
        targetLanguage: "",
        nativeLanguage: "",
        proficiencyLevel: "",
        ageGroup: "adult", // Default to adult for new students
        endGoals: "",
        grammarWeaknesses: "",
        vocabularyGaps: "",
        pronunciationChallenges: "",
        conversationalFluencyBarriers: "",
        learningStyles: [],
        notes: "",
      });
    }
  }, [student, initialName, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    try {
      const studentData = {
        name: values.name,
        target_language: values.targetLanguage,
        native_language: values.nativeLanguage || null,
        level: values.proficiencyLevel,
        age_group: values.ageGroup,
        tutor_id: user.id,
        end_goals: values.endGoals,
        grammar_weaknesses: values.grammarWeaknesses,
        vocabulary_gaps: values.vocabularyGaps,
        pronunciation_challenges: values.pronunciationChallenges,
        conversational_fluency_barriers: values.conversationalFluencyBarriers,
        learning_styles: values.learningStyles,
        notes: values.notes,
      };

      if (student) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', student.id);

        if (error) throw error;
        toast.success('Student updated successfully');
      } else {
        // Create new student
        const { error } = await supabase
          .from('students')
          .insert([studentData]);

        if (error) throw error;
        toast.success('Student added successfully');
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save student');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-cyber-400/30">
        <DialogHeader>
          <DialogTitle className="gradient-text">
            {student ? "Edit Student" : "Add New Student"}
          </DialogTitle>
          <DialogDescription>
            {student
              ? "Update the student's information and learning preferences."
              : "Enter the student's information and learning preferences."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter student's name" 
                      className="border-cyber-400/30 focus:border-cyber-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-cyber-400/30 focus:border-cyber-400">
                          <SelectValue placeholder="Select target language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-effect border-cyber-400/30">
                        {languages.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            <span className="mr-2">{language.flag}</span>
                            {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nativeLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Native Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-cyber-400/30 focus:border-cyber-400">
                          <SelectValue placeholder="Select native language (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-effect border-cyber-400/30">
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Not specified</span>
                        </SelectItem>
                        {languages.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            <span className="mr-2">{language.flag}</span>
                            {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used for translation assistance during lessons
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-cyber-400/30 focus:border-cyber-400">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-effect border-cyber-400/30">
                        {proficiencyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Group</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-cyber-400/30 focus:border-cyber-400">
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-effect border-cyber-400/30">
                        {ageGroups.map((ageGroup) => (
                          <SelectItem key={ageGroup.value} value={ageGroup.value}>
                            {ageGroup.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used to select age-appropriate lesson templates and content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does the student want to achieve?"
                      className="min-h-[100px] resize-y border-cyber-400/30 focus:border-cyber-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grammarWeaknesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grammar Weaknesses</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note any grammar challenges"
                        className="min-h-[100px] resize-y border-cyber-400/30 focus:border-cyber-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vocabularyGaps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vocabulary Gaps</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note any vocabulary areas to improve"
                        className="min-h-[100px] resize-y border-cyber-400/30 focus:border-cyber-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pronunciationChallenges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pronunciation Challenges</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note any pronunciation difficulties"
                        className="min-h-[100px] resize-y border-cyber-400/30 focus:border-cyber-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conversationalFluencyBarriers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversational Fluency Barriers</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note any conversation challenges"
                        className="min-h-[100px] resize-y border-cyber-400/30 focus:border-cyber-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="learningStyles"
              render={() => (
                <FormItem>
                  <FormLabel>Learning Styles</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {learningStyles.map((style) => (
                      <FormField
                        key={style.id}
                        control={form.control}
                        name="learningStyles"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={style.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(style.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, style.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== style.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {style.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any other relevant information"
                      className="min-h-[100px] resize-y border-cyber-400/30 focus:border-cyber-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-cyber-400/30 hover:bg-cyber-400/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0"
              >
                {student ? "Update Student" : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}