import { Copy, Eye, ExternalLink, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Item, ContactMetadata, LinkMetadata } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { copyToClipboard } = useCopyToClipboard();

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
        copyText = item.fileUrl || item.title;
        break;
      case "note":
        copyText = `${item.title}\n\n${item.content}`;
        break;
      case "contact":
        const contactData = item.metadata ? JSON.parse(item.metadata) as ContactMetadata : {};
        copyText = `${item.title}\n${contactData.email || ""}\n${contactData.phone || ""}`;
        break;
      case "link":
        const linkData = item.metadata ? JSON.parse(item.metadata) as LinkMetadata : { url: item.fileUrl || "" };
        copyText = linkData.url;
        break;
      default:
        copyText = item.title;
    }
    
    copyToClipboard(copyText);
  };

  const handleAction = () => {
    if (item.type === "link") {
      const linkData = item.metadata ? JSON.parse(item.metadata) as LinkMetadata : { url: item.fileUrl || "" };
      window.open(linkData.url, "_blank");
    } else if (item.type === "file" && item.fileUrl) {
      window.open(item.fileUrl, "_blank");
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

  return (
    <Card className="hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4">
        {renderContent()}
        
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4" />
          </Button>
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
            <Button className="flex-1 text-sm">
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
          {item.type === "contact" && (
            <Button className="flex-1 text-sm">
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
