import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Heart, 
  Star, 
  Eye, 
  Users, 
  Trophy,
  MapPin,
  Calendar,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFavorites, useRemoveFavorite } from '@/hooks/api/useFavorites';

export function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Fetch favorites from API
  const { data: favoritesData, isLoading } = useFavorites(user?.profile?.id);
  const removeFavoriteMutation = useRemoveFavorite();
  
  const favorites = favoritesData?.favorites || [];
  const [filteredFavorites, setFilteredFavorites] = useState(favorites);

  const categories = ['all', 'boudoir', 'fashion', 'portrait', 'artistic', 'commercial'];


  useEffect(() => {
    // Filter favorites based on search and category
    let filtered = favorites;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(model =>
        model.categories.includes(selectedCategory)
      );
    }

    setFilteredFavorites(filtered);
  }, [favorites, searchTerm, selectedCategory]);

  const handleRemoveFavorite = async (modelId: string) => {
    try {
      // TODO: Implement actual API call to remove favorite
      // await removeFavorite(user?.profile?.id, modelId);
      
      // Update local state
      setFavorites(prev => prev.filter(model => model.id !== modelId));
      
      toast({
        title: "Removed from favorites",
        description: "Model has been removed from your favorites list.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove model from favorites.",
        variant: "destructive"
      });
    }
  };

  const handleVoteForModel = async (modelId: string) => {
    try {
      // TODO: Implement voting logic
      console.log(`Voting for model ${modelId}`);
      
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote.",
        variant: "destructive"
      });
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-foreground">My Favorite Models</h1>
          <p className="text-muted-foreground mt-2">
            {favorites.length} model{favorites.length !== 1 ? 's' : ''} in your favorites
          </p>
        </div>
        
        <Button asChild>
          <Link to="/voters/browse-contests">
            <Heart className="w-4 h-4 mr-2" />
            Discover More Models
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search your favorite models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
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

      {/* Favorites Grid */}
      {filteredFavorites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start adding models to your favorites to see them here'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button asChild>
                <Link to="/voters/browse-contests">
                  <Heart className="w-4 h-4 mr-2" />
                  Browse Models
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((model) => (
            <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header with Profile Image and Status */}
              <div className="relative">
                <img
                  src={model.profileImage}
                  alt={model.name}
                  className="w-full h-48 object-cover"
                />
                
                {/* Online Status */}
                <div className="absolute top-3 left-3">
                  <div className={`w-3 h-3 rounded-full ${model.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                
                {/* Remove Favorite Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                  onClick={() => handleRemoveFavorite(model.id)}
                >
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </Button>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">{model.location}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{model.totalVotes}</div>
                    <div className="text-xs text-muted-foreground">Total Votes</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Bio */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {model.bio}
                </p>
                
                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {model.categories.map((category) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>{model.activeContests} active contests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Joined {new Date(model.joinedDate).getFullYear()}</span>
                  </div>
                </div>
                
                {/* Recent Photos */}
                <div className="grid grid-cols-3 gap-2">
                  {model.recentPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Recent photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>
                
                {/* Last Active */}
                <div className="text-xs text-muted-foreground text-center">
                  Last active: {formatLastActive(model.lastActive)}
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleVoteForModel(model.id)}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Vote
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
