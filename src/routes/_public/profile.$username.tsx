import NotFound from "@/components/global/NotFound";
import { Button } from "@/components/ui/button";
import { profileApi } from "@/hooks/api/useProfile";
import PublicProfilePage from "@/pages/PublicProfilePage";
import { Profile } from "@/types/profile.types";
import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, Menu, Share } from "lucide-react";
import { z } from "zod";


export const Route = createFileRoute("/_public/profile/$username")({
  validateSearch: z.object({
    contestId: z.string().optional(),
    autoOpenVote: z.boolean().optional(),
  }),
  beforeLoad: async ({ params }) => {
    const { username } = params;
    console.log("Loading profile for username:", username);
    try {
      const profile = await profileApi.getProfileByUsername(username);
      if (!profile) {
        console.error("Profile not found for username:", username);
        const error = new Error(`Profile not found for username: ${username}`);
        error.name = "PROFILE_NOT_FOUND";
        throw error;
      }
      console.log("Profile loaded successfully:", profile.user?.username, profile.user?.displayUsername);
      return {profile};
    } catch (error) {
      console.error("Error loading profile for username:", username, error);
      // Re-throw the error to trigger the errorComponent
      throw error;
    }
  },
  // non-blocking, runs after profile is loaded
  loader: async ({ context }) => {
    const { profile } = context as { profile: Profile };
    return profileApi.getActiveParticipation(profile.id, { page: 1, limit: 50 });
  },
  component: PublicProfilePage,
  pendingComponent:PendingComponent,
  errorComponent: () => <NotFound title="Profile Not Found" description="The profile you're looking for doesn't exist or has been removed." />,
});



function PendingComponent () {
  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex flex-col items-start">
            <div className="text-2xl font-display font-bold text-primary tracking-tight">SWING</div>
            <div className="text-xs font-medium text-muted-foreground -mt-1 tracking-wider">Boudoir</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-800 border-gray-300 hidden sm:flex">
            <DollarSign className="w-4 h-4 mr-1" />
            Buy More Votes
          </Button>
          <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-800 border-gray-300 hidden sm:flex">
            <Share className="w-4 h-4 mr-1" />
            Share Profile
          </Button>
          <Button variant="ghost" size="sm" className="sm:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center pt-16">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  </>
  )
}