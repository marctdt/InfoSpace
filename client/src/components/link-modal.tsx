import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Item } from "@/lib/types";

interface LinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
}

export function LinkModal({ open, onOpenChange, editItem }: LinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editItem;

  useEffect(() => {
    if (editItem && open) {
      setTitle(editItem.title);
      setDescription(editItem.content || "");
      setTags(editItem.tags ? editItem.tags.join(", ") : "");
      if (editItem.metadata) {
        try {
          const metadata = JSON.parse(editItem.metadata);
          setUrl(metadata.url || "");
        } catch (e) {
          // Handle invalid JSON metadata
        }
      }
    }
  }, [editItem, open]);

  const saveLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        const response = await fetch(`/api/items/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update link");
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/items/link", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: isEdit ? "Link updated successfully!" : "Link saved successfully!",
        description: isEdit ? "Your link has been updated." : "Your link has been saved to your hub.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: isEdit ? "Failed to update link" : "Failed to save link",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    saveLinkMutation.mutate({
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
    });
  };

  const handleClose = () => {
    if (!isEdit) {
      setTitle("");
      setUrl("");
      setDescription("");
      setTags("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Link" : "Save Link"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Link title"
              required
            />
          </div>

          <div>
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this link about?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="reference, design, tools"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || !url.trim() || saveLinkMutation.isPending}
              className="flex-1"
            >
              {saveLinkMutation.isPending ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Link" : "Save Link")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
