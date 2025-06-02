import { useState } from "react";
import { Copy, Eye, ExternalLink, Phone, Mail, Trash2, MoreVertical, Edit, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { apiRequest } from "@/lib/queryClient";
import { Item, ContactMetadata, LinkMetadata } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { NoteModal } from "./note-modal";
import { ContactModal } from "./contact-modal";
import { LinkModal } from "./link-modal";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { copyToClipboard } = useCopyToClipboard();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
  });

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📄";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📈";
    return "📄";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleCopy = () => {
    let copyText = "";

    switch (item.type) {
      case "file":
        copyText = item.fileUrl ? `${window.location.origin}${item.fileUrl}` : "";
        break;
      case "note":
        copyText = item.content || "";
        break;
      case "contact":
        const contactData = item.metadata ? JSON.parse(item.metadata) as ContactMetadata : {};
        const contactInfo = [
          contactData.email || "",
          contactData.phone || "",
          contactData.company || "",
          contactData.role || ""
        ].filter(Boolean).join("\n");
        copyText = contactInfo;
        break;
      case "link":
        const linkData = item.metadata ? JSON.parse(item.metadata) as LinkMetadata : { url: item.fileUrl || "" };
        copyText = linkData.url;
        break;
      default:
        copyText = item.content || "";
    }

    copyToClipboard(copyText);
  };

  const handleAction = () => {
    if (item.type === "link") {
      const linkData = item.metadata ? JSON.parse(item.metadata) as LinkMetadata : { url: item.fileUrl || "" };
      window.open(linkData.url, "_blank");
    } else if (item.type === "file" && item.fileUrl) {
      // For files, open in same tab to allow browser to handle preview/download
      window.location.href = `${item.fileUrl}?action=preview`;
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case "file":
        return (
          <>
            {item.mimeType?.startsWith("image/") && (
              <img 
                src={item.fileUrl || ""} 
                alt={item.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-lg">{getFileIcon(item.mimeType)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {item.fileSize ? formatFileSize(item.fileSize) : ""} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </>
        );

      case "note":
        return (
          <div className="mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <span className="text-lg">📝</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
            {item.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {item.content}
              </p>
            )}
          </div>
        );

      case "contact":
        const contactData = item.metadata ? JSON.parse(item.metadata) as ContactMetadata : {};
        return (
          <div className="mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{item.title}</h3>
                {contactData.role && (
                  <p className="text-xs text-muted-foreground">{contactData.role}</p>
                )}
              </div>
            </div>
            <div className="space-y-1 mb-2">
              {contactData.email && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{contactData.email}</span>
                </div>
              )}
              {contactData.phone && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{contactData.phone}</span>
                </div>
              )}
            </div>
          </div>
        );

      case "link":
        const linkData = item.metadata ? JSON.parse(item.metadata) as LinkMetadata : { url: item.fileUrl || "" };
        return (
          <div className="mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔗</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{linkData.url}</p>
              </div>
            </div>
            {item.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {item.content}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4">
        {renderContent()}

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {item.type === 'file' && item.fileUrl && (
                  <DropdownMenuItem onClick={() => {
                    const link = document.createElement('a');
                    link.href = `${item.fileUrl}?action=download`;
                    link.download = item.fileName || 'file';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-2 py-1"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex space-x-2">
          {(item.type === "link" || (item.type === "file" && item.fileUrl)) && (
            <Button
              className="flex-1 text-sm"
              onClick={handleAction}
            >
              {item.type === "link" ? (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Open
                </>
              )}
            </Button>
          )}
          {item.type === "note" && (
            <Button 
              className="flex-1 text-sm"
              onClick={() => setIsViewModalOpen(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
          {item.type === "contact" && (
            <Button 
              className="flex-1 text-sm"
              onClick={() => setIsViewModalOpen(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {item.type === "note" && (
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">
                    {item.content || "No content"}
                  </p>
                </div>
              </div>
            )}

            {item.type === "contact" && (
              <div className="space-y-4">
                {(() => {
                  const contactData = item.metadata ? JSON.parse(item.metadata) as ContactMetadata : {};
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Name</h4>
                          <p className="text-sm">{item.title}</p>
                        </div>
                        {contactData.role && (
                          <div>
                            <h4 className="font-medium mb-2">Role</h4>
                            <p className="text-sm">{contactData.role}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contactData.email && (
                          <div>
                            <h4 className="font-medium mb-2">Email</h4>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a 
                                href={`mailto:${contactData.email}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {contactData.email}
                              </a>
                            </div>
                          </div>
                        )}

                        {contactData.phone && (
                          <div>
                            <h4 className="font-medium mb-2">Phone</h4>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <a 
                                href={`tel:${contactData.phone}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {contactData.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {contactData.company && (
                        <div>
                          <h4 className="font-medium mb-2">Company</h4>
                          <p className="text-sm">{contactData.company}</p>
                        </div>
                      )}

                      {item.content && (
                        <div>
                          <h4 className="font-medium mb-2">Notes</h4>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="whitespace-pre-wrap text-sm">{item.content}</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Created {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <span> • Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modals */}
      {item.type === "note" && (
        <NoteModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          editItem={item}
        />
      )}

      {item.type === "contact" && (
        <ContactModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          editItem={item}
        />
      )}

      {item.type === "link" && (
        <LinkModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          editItem={item}
        />
      )}
    </Card>
  );
}