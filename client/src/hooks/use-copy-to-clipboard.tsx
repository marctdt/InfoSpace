import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "Content is ready to share",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return { copyToClipboard, isCopied };
}
