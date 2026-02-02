"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeedbackMessage {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  source: string;
  created_at: string;
}

export default function AdminFeedbackMessagesPage() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [statusFilter, sourceFilter]);

  const updateStatus = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Status updated');
      loadMessages();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredMessages = messages.filter(message =>
    message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceBadge = (source: string) => {
    if (source === 'email') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">📧 Email</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">🌐 Web Form</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      new: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
      implemented: 'bg-green-50 text-green-700 border-green-200',
      archived: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || colors.new}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold">Feedback Messages</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage feedback from feedback@linguaflow.online
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="web_form">Web Form</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{messages.length}</div>
            <div className="text-sm text-muted-foreground">Total Messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {messages.filter(m => m.status === 'new').length}
            </div>
            <div className="text-sm text-muted-foreground">New</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {messages.filter(m => m.status === 'reviewed').length}
            </div>
            <div className="text-sm text-muted-foreground">Reviewed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {messages.filter(m => m.status === 'implemented').length}
            </div>
            <div className="text-sm text-muted-foreground">Implemented</div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No feedback messages found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSourceBadge(message.source)}
                      {getStatusBadge(message.status)}
                    </div>
                    <CardTitle className="text-lg mb-1">{message.subject}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>From: {message.email}</span>
                      <span>•</span>
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${message.email}?subject=Re: ${message.subject}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                  <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={message.status}
                    onValueChange={(value) => updateStatus(message.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="implemented">Implemented</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
