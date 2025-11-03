import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Send, 
  Mail, 
  Linkedin,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGenerateSocialSharingUrls } from "@/hooks/api/useGamification";

interface SocialSharingProps {
  referralCode?: string;
  referralLink?: string;
  compact?: boolean;
}

const SocialSharing = ({ referralCode, referralLink, compact = false }: SocialSharingProps) => {
  const { user } = useAuth();
  const [customMessage, setCustomMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCustomMessage, setShowCustomMessage] = useState(false);

  const { data: sharingData, isLoading, refetch } = useGenerateSocialSharingUrls(
    user?.id,
    customMessage || undefined
  );

  const handleShare = (platform: string, url?: string) => {
    if (!url) {
      toast.error("Sharing URL not available for this platform");
      return;
    }

    if (platform === "instagram") {
      // For Instagram, copy the message to clipboard since direct sharing isn't supported
      navigator.clipboard.writeText(sharingData?.defaultMessage || "");
      toast.success("Message copied to clipboard! Paste it in your Instagram story or post.");
      return;
    }

    // Open sharing URL in new window
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyMessage = () => {
    if (sharingData?.defaultMessage) {
      navigator.clipboard.writeText(sharingData.defaultMessage);
      setCopied(true);
      toast.success("Message copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialPlatforms = [
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-blue-500 hover:bg-blue-600",
      url: sharingData?.sharingUrls?.twitter,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: sharingData?.sharingUrls?.facebook,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      url: sharingData?.sharingUrls?.whatsapp,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-blue-400 hover:bg-blue-500",
      url: sharingData?.sharingUrls?.telegram,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      url: sharingData?.sharingUrls?.linkedin,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-500 hover:bg-gray-600",
      url: sharingData?.sharingUrls?.email,
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-pink-500 hover:bg-pink-600",
      url: sharingData?.sharingUrls?.instagram,
    },
  ];

  if (!referralCode) {
    if (compact) {
      return (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-muted-foreground text-sm">
            Generate your referral code to start sharing!
          </p>
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> Social Sharing
          </CardTitle>
          <CardDescription>Generate your referral code to start sharing!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            You need a referral code to generate sharing links. Please generate your referral code first.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Custom Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="custom-message" className="text-xs">Custom Message (Optional)</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomMessage(!showCustomMessage)}
              className="text-xs h-6 px-2"
            >
              {showCustomMessage ? "Hide" : "Customize"}
            </Button>
          </div>
          {showCustomMessage && (
            <div className="space-y-2">
              <Textarea
                id="custom-message"
                placeholder="Enter your custom message for sharing..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default message
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomMessage("");
                    refetch();
                  }}
                  className="text-xs h-6 px-2"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Default Message Preview */}
        {sharingData?.defaultMessage && (
          <div className="space-y-2">
            <Label className="text-xs">Message Preview</Label>
            <div className="p-2 bg-gray-50 rounded-md border text-xs">
              <p className="text-gray-700">{sharingData.defaultMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMessage}
              className="w-full text-xs h-7"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Message
            </Button>
          </div>
        )}

        {/* Social Platform Buttons */}
        <div className="space-y-2">
          <Label className="text-xs">Share on Social Media</Label>
          <div className="grid grid-cols-3 gap-1">
            {socialPlatforms.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <Button
                  key={platform.name}
                  variant="outline"
                  className={`${platform.color} text-white border-0 hover:text-white text-xs h-8`}
                  onClick={() => handleShare(platform.name.toLowerCase(), platform.url)}
                  disabled={isLoading}
                >
                  <IconComponent className="h-3 w-3 mr-1" />
                  {platform.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" /> Social Sharing
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Share & Earn
          </Badge>
        </CardTitle>
        <CardDescription>
          Share your referral link across social media platforms to earn rewards!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Link Display */}
        <div className="space-y-2">
          <Label htmlFor="referral-link">Your Referral Link</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="referral-link"
              readOnly
              value={referralLink || ""}
              className="flex-1"
            />
            <Button onClick={handleCopyLink} variant="outline" size="icon">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomMessage(!showCustomMessage)}
            >
              {showCustomMessage ? "Hide" : "Customize"}
            </Button>
          </div>
          {showCustomMessage && (
            <div className="space-y-2">
              <Textarea
                id="custom-message"
                placeholder="Enter your custom message for sharing..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default message
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomMessage("");
                    refetch();
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Default Message Preview */}
        {sharingData?.defaultMessage && (
          <div className="space-y-2">
            <Label>Message Preview</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <p className="text-sm text-gray-700">{sharingData.defaultMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMessage}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Message
            </Button>
          </div>
        )}

        {/* Social Platform Buttons */}
        <div className="space-y-3">
          <Label>Share on Social Media</Label>
          <div className="grid grid-cols-2 gap-2">
            {socialPlatforms.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <Button
                  key={platform.name}
                  variant="outline"
                  className={`${platform.color} text-white border-0 hover:text-white`}
                  onClick={() => handleShare(platform.name.toLowerCase(), platform.url)}
                  disabled={isLoading}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {platform.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Sharing Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Share during peak hours for better engagement</li>
            <li>• Add a personal message to make it more authentic</li>
            <li>• Use Instagram Stories to reach your followers</li>
            <li>• Share in relevant groups and communities</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialSharing;
