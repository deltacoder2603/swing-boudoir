import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminUnlocks, useCreateUnlock, useDeleteUnlock, type CreateUnlockRequest } from "@/hooks/api/useAdminUnlocks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/unlocks/")({
  component: UnlocksPage,
});

function UnlocksPage() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const limit = 20;
  const { data, isLoading, error } = useAdminUnlocks(page, limit);
  const createMutation = useCreateUnlock();
  const deleteMutation = useDeleteUnlock();

  const form = useForm<CreateUnlockRequest>({
    defaultValues: {
      profileId: "",
      contentType: "PHOTO",
      title: "",
      voteThreshold: 100,
    },
  });

  const handleSubmit = async (data: CreateUnlockRequest) => {
    await createMutation.mutateAsync(data);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this unlock?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unlocks</h1>
          <p className="text-muted-foreground text-sm">Manage unlocked content for profiles</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Unlock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Unlock</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <Label>Profile ID</Label>
                <Input {...form.register("profileId")} required />
              </div>
              <div>
                <Label>Content Type</Label>
                <select {...form.register("contentType")} className="w-full p-2 border rounded">
                  <option value="PHOTO">Photo</option>
                  <option value="VIDEO">Video</option>
                  <option value="AUDIO">Audio</option>
                  <option value="MESSAGE">Message</option>
                  <option value="CALL">Call</option>
                  <option value="MERCH">Merch</option>
                  <option value="MAGAZINE">Magazine</option>
                </select>
              </div>
              <div>
                <Label>Title</Label>
                <Input {...form.register("title")} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea {...form.register("description")} />
              </div>
              <div>
                <Label>Content URL</Label>
                <Input {...form.register("contentUrl")} />
              </div>
              <div>
                <Label>Vote Threshold</Label>
                <Input type="number" {...form.register("voteThreshold", { valueAsNumber: true })} required />
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Unlocks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading unlocks</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Vote Threshold</TableHead>
                  <TableHead>Unlocked At</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((unlock) => (
                  <TableRow key={unlock.id}>
                    <TableCell>{unlock.title}</TableCell>
                    <TableCell>{unlock.contentType}</TableCell>
                    <TableCell>{unlock.voteThreshold}</TableCell>
                    <TableCell>{new Date(unlock.unlockedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{unlock.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(unlock.id)}>
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

