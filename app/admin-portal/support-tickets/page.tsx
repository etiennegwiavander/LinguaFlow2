"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Search, Filter, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SupportTicket {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  source: string;
  created_at: string;
}

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const loadTickets = async () => {
    try {
      let query = supabase
        .from('support_tickets')
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

      setTickets(data || []);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, sourceFilter]);

  const updateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Status updated');
      loadTickets();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceBadge = (source: string) => {
    if (source === 'email_reply') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">📧 Email</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">🌐 Web Form</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
      resolved: 'bg-green-50 text-green-700 border-green-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || colors.open}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold">Support Tickets</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage support tickets from support@linguaflow.online
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="email_reply">Email</SelectItem>
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
            <div className="text-2xl font-bold">{tickets.length}</div>
            <div className="text-sm text-muted-foreground">Total Tickets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {tickets.filter(t => t.status === 'open').length}
            </div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {tickets.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.status === 'resolved').length}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No support tickets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSourceBadge(ticket.source)}
                      {getStatusBadge(ticket.status)}
                    </div>
                    <CardTitle className="text-lg mb-1">{ticket.subject}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>From: {ticket.email}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${ticket.email}?subject=Re: ${ticket.subject}`}
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
                  <p className="whitespace-pre-wrap text-sm">{ticket.message}</p>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => updateStatus(ticket.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
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
