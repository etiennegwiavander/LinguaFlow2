import { supabase, supabaseRequest } from './supabase';
import { DiscussionTopic } from '../types';
import { startTimer, endTimer, trackDatabaseOperation } from './performance-monitor';

// Discussion Topics Database Operations

/**
 * Fetch all discussion topics for a specific student
 */
export async function getDiscussionTopicsByStudent(
  studentId: string,
  tutorId: string
): Promise<{ data: DiscussionTopic[] | null; error: any }> {
  // Validate inputs
  if (!studentId || !tutorId) {
    return { 
      data: null, 
      error: { message: 'Student ID and Tutor ID are required' } 
    };
  }

  console.log('🔍 Fetching discussion topics for student:', studentId, 'tutor:', tutorId);

  try {
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('*')
      .eq('student_id', studentId)
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    console.log('📊 Discussion topics result:', { data, error, count: data?.length || 0 });

    return { data, error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Discussion topics fetch error:', errorMessage);
    
    return {
      data: null,
      error: { message: errorMessage }
    };
  }
}

/**
 * Fetch discussion topics filtered by student level
 */
export async function getDiscussionTopicsByLevel(
  studentId: string,
  tutorId: string,
  level: string
): Promise<{ data: DiscussionTopic[] | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('*')
      .eq('student_id', studentId)
      .eq('tutor_id', tutorId)
      .eq('level', level)
      .order('created_at', { ascending: false });

    return { data, error };
  });
}

/**
 * Fetch predefined (non-custom) discussion topics for a level
 * For now, return a hardcoded list of predefined topics since the database structure
 * requires student_id and tutor_id for all topics
 */
export async function getPredefinedTopicsByLevel(
  level: string
): Promise<{ data: DiscussionTopic[] | null; error: any }> {
  console.log('🎯 Getting predefined topics for level:', level);
  
  // Validate input
  if (!level) {
    return { 
      data: null, 
      error: { message: 'Level is required' } 
    };
  }

  // For now, return hardcoded predefined topics based on level
  // In the future, we might want to create a separate predefined_topics table
  const predefinedTopics: DiscussionTopic[] = [
    {
      id: 'predefined-1',
      title: 'Food & Cooking',
      description: 'Discuss favorite foods, cooking experiences, and culinary traditions',
      category: 'lifestyle',
      level: level,
      is_custom: false,
      student_id: string | null,
      tutor_id: string | null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'predefined-2',
      title: 'Travel & Tourism',
      description: 'Share travel experiences and dream destinations',
      category: 'lifestyle',
      level: level,
      is_custom: false,
      student_id: null,
      tutor_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'predefined-3',
      title: 'Technology & Innovation',
      description: 'Explore the impact of technology on daily life',
      category: 'technology',
      level: level,
      is_custom: false,
      student_id: null,
      tutor_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'predefined-4',
      title: 'Work & Career',
      description: 'Discuss professional experiences and career goals',
      category: 'professional',
      level: level,
      is_custom: false,
      student_id: null,
      tutor_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'predefined-5',
      title: 'Hobbies & Interests',
      description: 'Share personal interests and leisure activities',
      category: 'lifestyle',
      level: level,
      is_custom: false,
      student_id: null,
      tutor_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return { data: predefinedTopics, error: null };
}

/**
 * Create a new discussion topic
 */
export async function createDiscussionTopic(
  topic: Omit<DiscussionTopic, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: DiscussionTopic | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_topics')
      .insert([topic])
      .select()
      .single();

    return { data, error };
  });
}

/**
 * Create a custom discussion topic with validation
 */
export async function createCustomDiscussionTopic(
  studentId: string,
  tutorId: string,
  title: string,
  level: string,
  description?: string
): Promise<{ data: DiscussionTopic | null; error: any }> {
  // Validate input
  if (!title || title.trim().length === 0) {
    return { data: null, error: { message: 'Topic title is required' } };
  }

  if (title.length > 200) {
    return { data: null, error: { message: 'Topic title must be less than 200 characters' } };
  }

  if (description && description.length > 500) {
    return { data: null, error: { message: 'Topic description must be less than 500 characters' } };
  }

  // Sanitize input
  const sanitizedTitle = title.trim();
  const sanitizedDescription = description?.trim();

  const topicData: Omit<DiscussionTopic, 'id' | 'created_at' | 'updated_at'> = {
    student_id: studentId,
    tutor_id: tutorId,
    title: sanitizedTitle,
    description: sanitizedDescription,
    category: 'custom',
    level,
    is_custom: true,
  };

  return createDiscussionTopic(topicData);
}

/**
 * Update an existing discussion topic
 */
export async function updateDiscussionTopic(
  topicId: string,
  updates: Partial<Omit<DiscussionTopic, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: DiscussionTopic | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_topics')
      .update(updates)
      .eq('id', topicId)
      .select()
      .single();

    return { data, error };
  });
}

/**
 * Delete a discussion topic
 */
export async function deleteDiscussionTopic(
  topicId: string
): Promise<{ data: null; error: any }> {
  return supabaseRequest(async () => {
    const { error } = await supabase
      .from('discussion_topics')
      .delete()
      .eq('id', topicId);

    return { data: null, error };
  });
}

/**
 * Get a single discussion topic by ID
 */
export async function getDiscussionTopicById(
  topicId: string
): Promise<{ data: DiscussionTopic | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('*')
      .eq('id', topicId)
      .single();

    return { data, error };
  });
}

/**
 * Search discussion topics by title
 */
export async function searchDiscussionTopics(
  studentId: string,
  tutorId: string,
  searchTerm: string
): Promise<{ data: DiscussionTopic[] | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('*')
      .eq('student_id', studentId)
      .eq('tutor_id', tutorId)
      .ilike('title', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    return { data, error };
  });
}

/**
 * Check if a topic with the same title already exists for a student
 */
export async function checkTopicExists(
  studentId: string,
  tutorId: string,
  title: string
): Promise<{ data: boolean | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('id')
      .eq('student_id', studentId)
      .eq('tutor_id', tutorId)
      .ilike('title', title.trim())
      .limit(1);

    if (error) {
      return { data: false, error };
    }

    return { data: !!(data && data.length > 0), error: null };
  });
}