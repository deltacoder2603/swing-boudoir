import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, History, Award } from "lucide-react";

export const Route = createFileRoute("/admin/spin-wheel/")({
  component: SpinWheelPage,
});

function SpinWheelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Spin Wheel Management</h1>
        <p className="text-muted-foreground text-sm">Manage spin wheel rewards, view history, and monitor prizes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Rewards</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage spin wheel rewards, their probabilities, and configurations
            </p>
            <Link to="/admin/spin-wheel/rewards">
              <Button>Manage Rewards</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Spin History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View all spin wheel history across all users
            </p>
            <Link to="/admin/spin-wheel/history">
              <Button>View History</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Active Prizes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor all active prizes and their status
            </p>
            <Link to="/admin/spin-wheel/prizes">
              <Button>View Prizes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

