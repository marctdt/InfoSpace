import { Upload, FileText, Users, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onFileUpload: () => void;
  onAddNote: () => void;
  onAddContact: () => void;
  onAddLink: () => void;
}

export function QuickActions({ onFileUpload, onAddNote, onAddContact, onAddLink }: QuickActionsProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="p-4 h-auto flex-col space-y-3 hover:shadow-md transition-shadow"
          onClick={onFileUpload}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-medium">Upload File</span>
        </Button>

        <Button
          variant="outline"
          className="p-4 h-auto flex-col space-y-3 hover:shadow-md transition-shadow"
          onClick={onAddNote}
        >
          <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-secondary" />
          </div>
          <span className="text-sm font-medium">Add Note</span>
        </Button>

        <Button
          variant="outline"
          className="p-4 h-auto flex-col space-y-3 hover:shadow-md transition-shadow"
          onClick={onAddContact}
        >
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <span className="text-sm font-medium">Add Contact</span>
        </Button>

        <Button
          variant="outline"
          className="p-4 h-auto flex-col space-y-3 hover:shadow-md transition-shadow"
          onClick={onAddLink}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Link className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-medium">Save Link</span>
        </Button>
      </div>
    </div>
  );
}
