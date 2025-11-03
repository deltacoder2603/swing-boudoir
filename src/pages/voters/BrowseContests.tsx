import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Heart, 
  Star, 
  Clock, 
  Users, 
  Trophy,
  Eye,
  Calendar,
  MapPin
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useContests } from '@/hooks/api/useContests';
import { useContestParticipants } from '@/hooks/api/useContestParticipation';
import type { Contest } from '@/types/contest.types';

export function BrowseContests() {
  const { user } = useAuth();
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'contests' | 'models'>('contests');

  const categories = ['all', 'boudoir', 'fashion', 'portrait', 'artistic', 'commercial'];

  // Fetch contests from API
  const { data: contestsData, isLoading } = useContests(1, 100, 'active');
  const contests = contestsData?.data || [];

  // Fetch participants for selected contest
  const { data: participantsData } = useContestParticipants(selectedContestId || '');
  const contestModels = participantsData?.data || [];

  const selectedContest = contests.find(c => c.id === selectedContestId) || null;

  const handleVote = async (modelId: string, contestId: string) => {
    try {
      // TODO: Implement actual voting logic via API
      console.log(`Voting for model ${modelId} in contest ${contestId}`);
      // Will be implemented when vote API is integrated
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ending_soon':
        return <Badge variant="destructive">Ending Soon</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      default:
        return <Badge variant="default">Active</Badge>;
    }
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredContests = contests.filter(contest => {
    const matchesSearch = contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contest.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    // Note: API doesn't provide category field, so filtering by category won't work
    // until we add category to Contest model
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Browse Contests</h1>
          <p className="text-muted-foreground mt-2">
            Discover amazing contests and vote for your favorite models
          </p>
        </div>
        
        {viewMode === 'models' && selectedContest && (
          <Button 
            variant="outline" 
            onClick={() => {
              setViewMode('contests');
              setSelectedContestId(null);
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Back to Contests
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search contests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            aria-label="Filter by category"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'contests' ? (
        /* Contests Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => (
            <Card 
              key={contest.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedContestId(contest.id);
                setViewMode('models');
              }}
            >
              <div className="relative">
                <img
                  src={contest.images?.[0]?.url || '/placeholder.svg'}
                  alt={contest.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(contest.status)}
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg">{contest.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {contest.description || 'Join this exciting competition!'}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">${contest.prizePool.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span>{getDaysLeft(contest.endDate)} days left</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-xs">
                      {new Date(contest.startDate!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Models
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Models Grid */
        <div className="space-y-6">
          {/* Contest Info */}
          {selectedContest && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedContest.name}</h2>
                    <p className="text-muted-foreground mt-1">{selectedContest.description || 'Join this exciting competition!'}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-red-500" />
                        <span className="text-sm">{getDaysLeft(selectedContest.endDate)} days left</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">${selectedContest.prizePool.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{contestModels.length}</div>
                    <div className="text-sm text-muted-foreground">Models</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contestModels.map((participant) => {
              const modelName = participant.profile?.user?.name || 'Model';
              const avatarUrl = participant.profile?.user?.image || '/placeholder.svg';
              const bio = participant.profile?.bio || 'Participant in this competition';
              
              return (
                <Card key={participant.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt={modelName}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{modelName}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {bio}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{participant.totalVotes || 0} votes</span>
                      </div>
                      <Badge variant="secondary">
                        Rank #{participant.rank || '–'}
                      </Badge>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleVote(participant.profileId, selectedContest?.id || '')}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Vote for {modelName}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseContests;
