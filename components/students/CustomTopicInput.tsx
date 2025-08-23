'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { DiscussionTopic, Student } from '@/types';
import { 
  createCustomDiscussionTopic,
  checkTopicExists
} from '@/lib/discussion-topics-db';
import { CustomTopicCreationLoading, InlineLoading } from './LoadingStates';

interface CustomTopicInputProps {
  student: Student;
  tutorId: string;
  onTopicCreated: (topic: DiscussionTopic) => void;
  className?: string;
}

interface ValidationErrors {
  title?: string;
  description?: string;
}

const CustomTopicInput = React.memo(function CustomTopicInput({ 
  student, 
  tutorId, 
  onTopicCreated, 
  className 
}: CustomTopicInputProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Real-time validation
  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Topic title is required';
    }
    if (value.length > 200) {
      return 'Topic title must be less than 200 characters';
    }
    return undefined;
  };

  const validateDescription = (value: string): string | undefined => {
    if (value.length > 500) {
      return 'Description must be less than 500 characters';
    }
    return undefined;
  };

  // Handle title change with real-time validation
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSuccessMessage(null);
    setGeneralError(null);
    
    const titleError = validateTitle(value);
    setErrors(prev => ({
      ...prev,
      title: titleError
    }));
  };

  // Handle description change with real-time validation
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setSuccessMessage(null);
    setGeneralError(null);
    
    const descriptionError = validateDescription(value);
    setErrors(prev => ({
      ...prev,
      description: descriptionError
    }));
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const titleError = validateTitle(title);
    const descriptionError = validateDescription(description);
    
    setErrors({
      title: titleError,
      description: descriptionError
    });

    return !titleError && !descriptionError;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      // Check if topic already exists
      const { data: exists, error: checkError } = await checkTopicExists(
        student.id,
        tutorId,
        title
      );

      if (checkError) {
        throw new Error(checkError.message || 'Failed to check topic existence');
      }

      if (exists) {
        setErrors(prev => ({
          ...prev,
          title: 'A topic with this title already exists'
        }));
        return;
      }

      // Auto-generate description if empty
      let finalDescription = description.trim();
      if (!finalDescription) {
        try {
          setIsGeneratingDescription(true);
          const response = await fetch('/api/supabase/functions/generate-topic-description', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              student_id: student.id,
              topic_title: title,
            }),
          });

          const result = await response.json();
          
          if (result.success && result.description) {
            finalDescription = result.description;
          }
        } catch (error) {
          console.error('Failed to generate description:', error);
          // Continue without description if generation fails
        } finally {
          setIsGeneratingDescription(false);
        }
      }

      // Create the custom topic
      const { data: newTopic, error: createError } = await createCustomDiscussionTopic(
        student.id,
        tutorId,
        title,
        student.level,
        finalDescription || undefined
      );

      if (createError) {
        throw new Error(createError.message || 'Failed to create topic');
      }

      if (newTopic) {
        // Reset form
        setTitle('');
        setDescription('');
        setErrors({});
        setSuccessMessage(`Topic "${newTopic.title}" created successfully!`);
        
        // Notify parent component
        onTopicCreated(newTopic);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to create topic');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Enter key in title input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating && !errors.title && title.trim()) {
      handleSubmit(e as any);
    }
  };

  // Auto-generate description if empty
  const generateDescription = async (topicTitle: string) => {
    if (!topicTitle.trim()) return;
    
    setIsGeneratingDescription(true);
    try {
      const response = await fetch('/api/supabase/functions/generate-topic-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student.id,
          topic_title: topicTitle,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.description) {
        setDescription(result.description);
      }
    } catch (error) {
      console.error('Failed to generate description:', error);
      // Silently fail - description generation is optional
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = title.trim() && !errors.title && !errors.description;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Add a personalized topic for {student.name}&apos;s conversation practice
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-topic-title" className="text-sm">
            Topic Title *
          </Label>
          <Input
            id="custom-topic-title"
            placeholder="e.g., Travel experiences, Favorite hobbies, Future goals..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              errors.title && "border-red-500 focus:border-red-500"
            )}
            disabled={isCreating}
          />
          <div className="flex justify-between items-center">
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {title.length}/200 characters
            </p>
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="custom-topic-description" className="text-sm">
              Description (Optional)
            </Label>
            {!description.trim() && title.trim() && !isGeneratingDescription && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => generateDescription(title)}
                className="text-xs h-6 px-2"
                disabled={isCreating}
              >
                Auto-generate
              </Button>
            )}
          </div>
          <Textarea
            id="custom-topic-description"
            placeholder={
              isGeneratingDescription 
                ? "Generating personalized description..." 
                : "Provide additional context or specific areas to focus on..."
            }
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={cn(
              "min-h-[80px] resize-none",
              errors.description && "border-red-500 focus:border-red-500",
              isGeneratingDescription && "opacity-50"
            )}
            disabled={isCreating || isGeneratingDescription}
          />
          <div className="flex justify-between items-center">
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
            {isGeneratingDescription && (
              <p className="text-sm text-blue-600 flex items-center gap-1">
                <InlineLoading text="Generating..." size="sm" />
              </p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid || isCreating || isGeneratingDescription}
          className="w-full"
        >
          {isCreating ? (
            <InlineLoading text="Creating Topic..." size="md" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Topic
            </>
          )}
        </Button>
      </form>

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {generalError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {generalError}
          </AlertDescription>
        </Alert>
      )}

      {/* Level Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <p>
          <strong>Student Level:</strong> {student.level.toUpperCase()} - 
          Questions will be generated at this proficiency level
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.level === nextProps.student.level &&
    prevProps.tutorId === nextProps.tutorId &&
    prevProps.className === nextProps.className &&
    prevProps.onTopicCreated === nextProps.onTopicCreated
  );
});

export default CustomTopicInput;