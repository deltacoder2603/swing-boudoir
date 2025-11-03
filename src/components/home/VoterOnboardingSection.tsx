import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Trophy, 
  Star, 
  Sparkles, 
  Gift,
  TrendingUp,
  Award,
  Image,
  Video,
  Phone,
  Package,
  ArrowRight,
  Check
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const VoterOnboardingSection = () => {
  const voterFeatures = [
    {
      icon: Heart,
      title: "Vote for Your Favorites",
      description: "Support models by casting votes in active competitions",
    },
    {
      icon: Trophy,
      title: "Unlock Milestones",
      description: "Reach 100, 200, 500, and 1000 votes to unlock rewards",
    },
    {
      icon: Sparkles,
      title: "Spin the Wheel",
      description: "Earn spins and win free votes, badges, and discounts",
    },
    {
      icon: Gift,
      title: "Exclusive Content",
      description: "Unlock photos, videos, calls, and signed merchandise",
    },
  ];

  const milestones = [
    { votes: 100, reward: "Exclusive Photo", icon: Image },
    { votes: 200, reward: "Video/Audio Message", icon: Video },
    { votes: 500, reward: "Private Call", icon: Phone },
    { votes: 1000, reward: "Signed Merch", icon: Package },
  ];

  const achievements = [
    "🎯 First Vote Badge",
    "💝 Loyal Voter Badge",
    "🌟 Contest Explorer Badge",
    "⚡ Power Voter Badge",
    "🚀 Mega Supporter Badge",
    "👑 Legendary Badge",
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200">
            <Heart className="w-4 h-4 mr-2" />
            Voter Program
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Support Your Favorite Models
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join as a voter to unlock exclusive content, win prizes, and earn rewards while supporting talented models
          </p>
        </div>

        {/* Two Column Layout: Models vs Voters */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Model Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-pink-200 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-br from-pink-50 to-rose-50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">I'm a Model</CardTitle>
                <CardDescription className="text-base">
                  Compete in contests and win prizes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Join exclusive competitions</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Win cash prizes and rewards</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Build your fan base</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Get discovered by voters</span>
                  </div>
                </div>
                <Link to="/auth/$id" params={{ id: "sign-up" }} search={{ type: "MODEL" }}>
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white">
                    Sign Up as Model
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Voter Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-purple-200 hover:shadow-xl transition-shadow relative overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Popular Choice
                </Badge>
              </div>
              
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">I'm a Voter</CardTitle>
                <CardDescription className="text-base">
                  Vote, unlock rewards, and win prizes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Vote for your favorite models</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Unlock exclusive content</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Earn badges and achievements</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Spin the wheel for prizes</span>
                  </div>
                </div>
                <Link to="/auth/$id" params={{ id: "sign-up" }} search={{ type: "VOTER" }}>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    Sign Up as Voter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Voter Features Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">Why Become a Voter?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {voterFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-4">Unlock Exclusive Rewards</h3>
          <p className="text-center text-gray-600 mb-8">
            Vote to reach milestones and unlock amazing content
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.votes}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                      <milestone.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {milestone.votes}
                    </div>
                    <div className="text-sm text-gray-600">votes</div>
                    <div className="mt-3 font-medium">{milestone.reward}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-4">Collect Achievements</h3>
            <p className="text-gray-600">
              Unlock special badges as you vote and engage with the community
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">{achievement.split(" ")[0]}</div>
                <div className="text-xs font-medium text-gray-700">
                  {achievement.split(" ").slice(1).join(" ")}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/auth/$id" params={{ id: "sign-up" }} search={{ type: "VOTER" }}>
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6 h-auto shadow-lg">
              <Heart className="w-5 h-5 mr-2" />
              Start Voting Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="mt-4 text-gray-600">
            Already have an account?{" "}
            <Link to="/auth/$id" params={{ id: "sign-in" }} className="text-purple-600 hover:text-purple-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default VoterOnboardingSection;
