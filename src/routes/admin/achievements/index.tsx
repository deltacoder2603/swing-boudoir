import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminAchievements,
  useCreateAchievement,
  useUpdateAchievement,
  useDeleteAchievement,
  type CreateAchievementRequest,
} from "@/hooks/api/useAdminAchievements";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/achievements/")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);
  const limit = 20;
  const { data, isLoading, error } = useAdminAchievements(page, limit);
  const createMutation = useCreateAchievement();
  const updateMutation = useUpdateAchievement();
  const deleteMutation = useDeleteAchievement();

  const form = useForm<CreateAchievementRequest>({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      icon: "",
      category: "VOTES",
      tier: "BRONZE",
    },
  });

  const handleSubmit = async (data: CreateAchievementRequest) => {
    if (editingAchievement) {
      await updateMutation.mutateAsync({ id: editingAchievement.id, data });
      setEditingAchievement(null);
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const handleEdit = (achievement: any) => {
    setEditingAchievement(achievement);
    form.reset({
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      tier: achievement.tier,
      requirement: achievement.requirement || undefined,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this achievement?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground text-sm">Manage achievements and their requirements</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAchievement(null); form.reset(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Achievement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAchievement ? "Edit Achievement" : "Create Achievement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input {...form.register("code")} required />
              </div>
              <div>
                <Label>Name</Label>
                <Input {...form.register("name")} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea {...form.register("description")} required />
              </div>
              <div>
                <Label>Icon</Label>
                <Input {...form.register("icon")} placeholder="🏆" required />
              </div>
              <div>
                <Label>Category</Label>
                <select {...form.register("category")} className="w-full p-2 border rounded">
                  <option value="VOTES">Votes</option>
                  <option value="CONTESTS">Contests</option>
                  <option value="ENGAGEMENT">Engagement</option>
                  <option value="SOCIAL">Social</option>
                  <option value="SPECIAL">Special</option>
                </select>
              </div>
              <div>
                <Label>Tier</Label>
                <select {...form.register("tier")} className="w-full p-2 border rounded">
                  <option value="BRONZE">Bronze</option>
                  <option value="SILVER">Silver</option>
                  <option value="GOLD">Gold</option>
                  <option value="PLATINUM">Platinum</option>
                  <option value="DIAMOND">Diamond</option>
                </select>
              </div>
              <div>
                <Label>Requirement (optional)</Label>
                <Input type="number" {...form.register("requirement", { valueAsNumber: true })} />
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingAchievement ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading achievements</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell>{achievement.icon}</TableCell>
                    <TableCell>{achievement.name}</TableCell>
                    <TableCell>{achievement.category}</TableCell>
                    <TableCell>{achievement.tier}</TableCell>
                    <TableCell>{achievement.requirement || "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(achievement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(achievement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

