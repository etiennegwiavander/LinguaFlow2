'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DiscussionTopic, Student } from '@/types';
import { 
  getDiscussionTopicsByStudent, 
  getPredefinedTopicsByLevel
} from '@/lib/discussion-topics-db';
import {
  getTopicsCache,
  setTopicsCache,
  invalidateTopicsCache
} from '@/lib/discussion-cache';
import CustomTopicInput from './CustomTopicInput';
import { ErrorBoundary } from './ErrorBoundary';
import { 
  NetworkErrorFallback, 
  GenericErrorFallback, 
  EmptyStateFallback 
} from './ErrorFallbacks';
import { TopicsListSkeleton, TopicCardSkeleton } from './SkeletonLoaders';

interface TopicsListProps {
  student: Student;
  tutorId: string;
  onTopicSelect: (topic: DiscussionTopic) => void;
  showCustomTopicInput?: boolean;
  className?: string;
}

const TopicsList = React.memo(function TopicsList({ 
  student, 
  tutorId, 
  onTopicSelect,
  showCustomTopicInput = true,
  className 
}: TopicsListProps) {
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [predefinedTopics, setPredefinedTopics] = useState<DiscussionTopic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const loadTopics = useCallback(async (forceRefresh = false) => {
    console.log('🔄 Loading topics for student:', student.id, 'tutor:', tutorId);
    console.log('🔄 Force refresh:', forceRefresh);
    setIsLoading(true);
    setError(null);

    try {
      let studentTopics: DiscussionTopic[] = [];
      let levelTopics: DiscussionTopic[] = [];

      // Try to get topics from cache first (unless force refresh)
      if (!forceRefresh) {
        console.log('📦 Checking cache for student:', student.id);
        const cachedTopics = getTopicsCache(student.id);
        if (cachedTopics) {
          console.log('✅ Found cached topics:', cachedTopics.length);
          // Separate cached topics into student-specific and predefined
          const cached = cachedTopics;
          studentTopics = cached.filter(topic => topic.student_id === student.id);
          levelTopics = cached.filter(topic => !topic.student_id || topic.student_id !== student.id);
          
          setTopics(studentTopics);
          setPredefinedTopics(levelTopics);
          setIsLoading(false);
          return;
        }
        console.log('❌ No cached topics found');
      }

      // Load from database if not in cache or force refresh
      console.log('🔍 Loading from database...');
      const [studentResult, levelResult] = await Promise.all([
        getDiscussionTopicsByStudent(student.id, tutorId),
        getPredefinedTopicsByLevel(student.level)
      ]);

      console.log('📊 Student topics result:', studentResult);
      console.log('📊 Level topics result:', levelResult);

      if (studentResult.error) {
        console.error('❌ Student topics error:', studentResult.error);
        throw new Error(studentResult.error.message || 'Failed to load student topics');
      }

      if (levelResult.error) {
        console.error('❌ Level topics error:', levelResult.error);
        throw new Error(levelResult.error.message || 'Failed to load predefined topics');
      }

      studentTopics = studentResult.data || [];
      levelTopics = levelResult.data || [];

      console.log('✅ Loaded topics - Student:', studentTopics.length, 'Level:', levelTopics.length);

      // Cache the combined topics
      const allTopics = [...studentTopics, ...levelTopics];
      if (allTopics.length > 0) {
        console.log('💾 Caching topics:', allTopics.length);
        setTopicsCache(student.id, allTopics);
      }

      setTopics(studentTopics);
      setPredefinedTopics(levelTopics);
    } catch (err) {
      console.error('💥 Error loading topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  }, [student.id, tutorId, student.level]);

  // Load topics on component mount
  useEffect(() => {
    loadTopics();
  }, [loadTopics]); // Include loadTopics since it's wrapped in useCallback

  // Filter topics based on search term
  const filteredTopics = useMemo(() => {
    const allTopics = [...topics, ...predefinedTopics];
    
    if (!searchTerm.trim()) {
      return allTopics;
    }

    const searchLower = searchTerm.toLowerCase();
    return allTopics.filter(topic =>
      topic.title.toLowerCase().includes(searchLower) ||
      topic.description?.toLowerCase().includes(searchLower) ||
      topic.category.toLowerCase().includes(searchLower)
    );
  }, [topics, predefinedTopics, searchTerm]);

  // Group topics by category
  const groupedTopics = useMemo(() => {
    const groups: Record<string, DiscussionTopic[]> = {};
    
    filteredTopics.forEach(topic => {
      const category = topic.is_custom ? 'Custom Topics' : topic.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(topic);
    });

    return groups;
  }, [filteredTopics]);

  // Handle new topic creation from CustomTopicInput
  const handleTopicCreated = (newTopic: DiscussionTopic) => {
    setTopics(prev => [newTopic, ...prev]);
    
    // Invalidate cache to ensure fresh data on next load
    invalidateTopicsCache(student.id);
    
    // Update cache with new topic
    const allTopics = [newTopic, ...topics, ...predefinedTopics];
    setTopicsCache(student.id, allTopics);
    
    // Hide the custom input after successful creation
    setShowCustomInput(false);
  };

  // Handle showing/hiding custom topic input
  const handleShowCustomInput = () => {
    setShowCustomInput(true);
  };

  const handleHideCustomInput = () => {
    setShowCustomInput(false);
  };

  if (isLoading) {
    return <TopicsListSkeleton className={className} />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Input and Create Topic Button */}
      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="topic-search" className="sr-only">
            Search discussion topics by title, description, or category
          </label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
          <Input
            id="topic-search"
            placeholder="Search discussion topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-describedby="search-help"
          />
          <div id="search-help" className="sr-only">
            Type to search through available discussion topics. Results will update as you type.
          </div>
        </div>

        {/* Create Topic Button */}
        {showCustomTopicInput && !showCustomInput && (
          <div className="flex justify-center">
            <Button
              onClick={handleShowCustomInput}
              variant="outline"
              className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary/50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create Custom Topic
            </Button>
          </div>
        )}
      </div>

      {/* Custom Topic Creation */}
      {showCustomTopicInput && showCustomInput && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create Custom Discussion Topic</h3>
            <Button
              onClick={handleHideCustomInput}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
          </div>
          <CustomTopicInput
            student={student}
            tutorId={tutorId}
            onTopicCreated={handleTopicCreated}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <ErrorBoundary
          fallback={
            <GenericErrorFallback 
              onRetry={() => loadTopics(true)}
            />
          }
        >
          {error.includes('network') || error.includes('connection') ? (
            <NetworkErrorFallback 
              onRetry={() => loadTopics(true)}
            />
          ) : (
            <GenericErrorFallback 
              onRetry={() => loadTopics(true)}
            />
          )}
        </ErrorBoundary>
      )}

      {/* Search results announcement for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {searchTerm && (
          `Search results for "${searchTerm}": ${Object.keys(groupedTopics).length === 0 
            ? 'No topics found' 
            : `${filteredTopics.length} topic${filteredTopics.length === 1 ? '' : 's'} found across ${Object.keys(groupedTopics).length} categor${Object.keys(groupedTopics).length === 1 ? 'y' : 'ies'}`
          }`
        )}
      </div>

      {/* Topics Grid */}
      {Object.keys(groupedTopics).length === 0 ? (
        <EmptyStateFallback
          title={searchTerm ? 'No topics found' : 'No topics available'}
          description={searchTerm 
            ? 'Try adjusting your search terms or create a custom topic.'
            : 'Create your first custom discussion topic to get started.'
          }
          icon={<BookOpen className="h-12 w-12" />}
          actionLabel={!searchTerm ? "Create Custom Topic" : undefined}
          onAction={!searchTerm ? () => {
            // Focus on custom topic input if available
            const input = document.querySelector('input[placeholder*="topic"]') as HTMLInputElement;
            if (input) input.focus();
          } : undefined}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTopics).map(([category, categoryTopics]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900" id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                  {category}
                </h3>
                <Badge variant="secondary" className="text-xs" aria-label={`${categoryTopics.length} topics in ${category} category`}>
                  {categoryTopics.length}
                </Badge>
              </div>
              
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                role="grid"
                aria-labelledby={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {categoryTopics.map((topic, index) => (
                  <Card
                    key={topic.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 group touch-manipulation active:scale-95 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                    onClick={() => onTopicSelect(topic)}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`Select topic: ${topic.title}. ${topic.description || ''} Level: ${topic.level}. ${topic.is_custom ? 'Custom topic.' : 'Predefined topic.'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onTopicSelect(topic);
                      }
                    }}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm sm:text-base font-medium group-hover:text-blue-600 transition-colors leading-tight">
                          {topic.title}
                        </CardTitle>
                        {topic.is_custom ? (
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 shrink-0 ml-2" aria-label="Custom topic" />
                        ) : (
                          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0 ml-2" aria-label="Predefined topic" />
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
                      {topic.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                          {topic.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs flex-shrink-0"
                          aria-label={`Difficulty level: ${topic.level}`}
                        >
                          {topic.level.toUpperCase()}
                        </Badge>
                        
                        {topic.is_custom && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-purple-100 text-purple-700 flex-shrink-0"
                            aria-label="Custom created topic"
                          >
                            Custom
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default TopicsList;