export interface Item {
  id: number;
  title: string;
  content: string | null;
  type: 'file' | 'note' | 'contact' | 'link';
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  tags: string[];
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactMetadata {
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
}

export interface LinkMetadata {
  url: string;
}

export type FilterType = 'all' | 'file' | 'note' | 'contact' | 'link';
