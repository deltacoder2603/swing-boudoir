import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, MapPin, Trophy } from "lucide-react";
import { useProfileSearch } from "@/hooks/api/useSearch";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/api/useProfile";

export function ModelSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { useProfileList } = useProfile();
  
  // Get top models when no search query
  const { data: topModelsData, isLoading: isLoadingTopModels } = useProfileList(
    { page: 1, limit: 12 }
  );
  
  // Get search results when there's a search query
  const { data: searchResults, isLoading: isLoadingSearch, pagination } = useProfileSearch(
    {
      query: searchQuery,
      page: 1,
      limit: 20,
    },
    searchQuery.length > 0
  );
  
  const data = searchQuery ? searchResults : topModelsData?.data;
  const isLoading = searchQuery ? isLoadingSearch : isLoadingTopModels;

  const handleModelClick = (model: { user: { username: string | null; displayUsername: string | null; id: string } }) => {
    // Use username first, then displayUsername - both are valid for profile lookup
    const profileIdentifier = model.user.username || model.user.displayUsername;
    if (profileIdentifier) {
      navigate({ to: "/profile/$username", params: { username: profileIdentifier } });
    } else {
      console.warn("Cannot navigate to profile: model has no username or displayUsername", model);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Models</h1>
        <p className="text-muted-foreground">
          Find and support your favorite models
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name, username, city, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searchQuery && (
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : data && data.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground">
                Found {pagination?.total || data.length} model(s)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((model) => (
                  <Card
                    key={model.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleModelClick(model)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={model.avatarUrl || model.user.image || ""} />
                          <AvatarFallback>
                            {model.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {model.user.name}
                          </h3>
                          {model.user.username && (
                            <p className="text-sm text-muted-foreground truncate">
                              @{model.user.username}
                            </p>
                          )}
                          {model.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {model.bio}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {model.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{model.city}</span>
                                {model.country && <span>, {model.country}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No models found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try a different search term
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Models - Show when no search query */}
      {!searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Top Models</h2>
          </div>
          {isLoadingTopModels ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((model) => (
                <Card
                  key={model.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleModelClick(model)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={model.avatarUrl || model.user.image || ""} />
                        <AvatarFallback>
                          {model.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {model.user.name}
                        </h3>
                        {model.user.username && (
                          <p className="text-sm text-muted-foreground truncate">
                            @{model.user.username}
                          </p>
                        )}
                        {model.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {model.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {model.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{model.city}</span>
                              {model.country && <span>, {model.country}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No models available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

