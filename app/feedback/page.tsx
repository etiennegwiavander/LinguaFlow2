"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Lightbulb,
  ThumbsUp,
  Send,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeedbackItem {
  id: string;
  user_name: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  status: string;
  votes: number;
  created_at: string;
  hasVoted?: boolean;
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [type, setType] = useState('feature_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('medium');

  const loadFeedback = async () => {
    try {
      const { data: feedbackData, error } = await supabase
        .from('feedback')
        .select('*')
        .order('votes', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which items the user has voted on
      if (user) {
        const { data: votesData } = await supabase
          .from('feedback_votes')
          .select('feedback_id')
          .eq('user_id', user.id);

        const votedIds = new Set(votesData?.map(v => v.feedback_id) || []);
        
        setFeedbackList(feedbackData.map(item => ({
          ...item,
          hasVoted: votedIds.has(item.id)
        })));
      } else {
        setFeedbackList(feedbackData);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit feedback');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.name || user.email,
          type,
          title,
          description,
          impact,
        });

      if (error) throw error;

      toast.success('Feedback submitted successfully!');
      setTitle('');
      setDescription('');
      setType('feature_request');
      setImpact('medium');
      setShowForm(false);
      loadFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (feedbackId: string) => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      const feedback = feedbackList.find(f => f.id === feedbackId);
      
      if (feedback?.hasVoted) {
        // Remove vote
        await supabase
          .from('feedback_votes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id);

        await supabase
          .from('feedback')
          .update({ votes: (feedback.votes || 0) - 1 })
          .eq('id', feedbackId);

        toast.success('Vote removed');
      } else {
        // Add vote
        await supabase
          .from('feedback_votes')
          .insert({
            feedback_id: feedbackId,
            user_id: user.id,
          });

        await supabase
          .from('feedback')
          .update({ votes: (feedback?.votes || 0) + 1 })
          .eq('id', feedbackId);

        toast.success('Vote added!');
      }

      loadFeedback();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'planned':
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Feedback & Ideas</h1>
          </div>
          <p className="text-muted-foreground mb-3">
            Help us improve LinguaFlow by sharing your ideas and voting on features you'd like to see
          </p>
          <p className="text-sm text-muted-foreground">
            💌 Prefer email? Send your feedback to{' '}
            <a 
              href="mailto:feedback@linguaflow.online" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              feedback@linguaflow.online
            </a>
          </p>
        </div>

        {/* Submit Feedback Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowForm(!showForm)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            {showForm ? 'Cancel' : 'Submit Feedback'}
          </Button>
        </div>

        {/* Feedback Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Share Your Feedback</CardTitle>
              <CardDescription>
                Tell us about features you'd like to see or improvements we can make
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                      <SelectItem value="general">General Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of your feedback"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about your feedback..."
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="impact">Impact</Label>
                  <Select value={impact} onValueChange={setImpact}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Nice to have</SelectItem>
                      <SelectItem value="medium">Medium - Would improve experience</SelectItem>
                      <SelectItem value="high">High - Important for workflow</SelectItem>
                      <SelectItem value="critical">Critical - Blocking issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Feedback List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedbackList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No feedback yet. Be the first to share your ideas!</p>
              </CardContent>
            </Card>
          ) : (
            feedbackList.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Vote Button */}
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant={item.hasVoted ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVote(item.id)}
                        className="h-12 w-12 rounded-lg"
                      >
                        <div className="flex flex-col items-center">
                          <ThumbsUp className={`w-4 h-4 ${item.hasVoted ? 'fill-current' : ''}`} />
                          <span className="text-xs font-bold">{item.votes}</span>
                        </div>
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <Badge variant="outline" className={getImpactColor(item.impact)}>
                            {item.impact}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-3">{item.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="secondary">{item.type.replace('_', ' ')}</Badge>
                        <span>by {item.user_name}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        {item.status !== 'pending' && (
                          <>
                            <span>•</span>
                            <Badge variant="outline">{item.status.replace('_', ' ')}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
