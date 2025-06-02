import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Client } from "@replit/object-storage";
import { storage } from "./storage-final";
import { insertItemSchema, contactSchema, linkSchema, noteSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  },
});

// Initialize Object Storage client
const objectStorage = new Client();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all items with optional search and filtering
  app.get("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const { search, type } = req.query;
      const userId = req.user.claims.sub;
      const items = await storage.getItems(
        userId,
        search as string, 
        type as string
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // Get single item
  app.get("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  // Update item
  app.patch("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const item = await storage.updateItem(id, updateData);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  // Delete item
  app.delete("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ success: true, message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Upload file
  app.post("/api/items/file", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { tags = "[]" } = req.body;
      const parsedTags = JSON.parse(tags);
      const userId = req.user.claims.sub;

      // Generate unique filename
      const fileKey = `${userId}/${Date.now()}-${req.file.originalname}`;
      
      // Upload to Object Storage
      await objectStorage.uploadFromBytes(fileKey, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const fileUrl = `/api/files/${fileKey}`;
      
      const item = await storage.createItem(userId, {
        title: req.file.originalname,
        content: null,
        type: 'file',
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tags: parsedTags,
        metadata: JSON.stringify({ objectKey: fileKey }),
      });

      res.json(item);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Create note
  app.post("/api/items/note", isAuthenticated, async (req: any, res) => {
    try {
      const validation = noteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid note data",
          errors: validation.error.issues
        });
      }

      const { title, content } = validation.data;
      const { tags = [] } = req.body;
      const userId = req.user.claims.sub;

      const item = await storage.createItem(userId, {
        title,
        content,
        type: 'note',
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        tags,
        metadata: null,
      });

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Create contact
  app.post("/api/items/contact", isAuthenticated, async (req: any, res) => {
    try {
      const validation = contactSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid contact data",
          errors: validation.error.issues
        });
      }

      const contactData = validation.data;
      const { tags = [] } = req.body;
      const userId = req.user.claims.sub;

      const item = await storage.createItem(userId, {
        title: contactData.name,
        content: contactData.notes || null,
        type: 'contact',
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        tags,
        metadata: JSON.stringify({
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          role: contactData.role,
        }),
      });

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Create link
  app.post("/api/items/link", isAuthenticated, async (req: any, res) => {
    try {
      const validation = linkSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid link data",
          errors: validation.error.issues
        });
      }

      const { title, url, description } = validation.data;
      const { tags = [] } = req.body;
      const userId = req.user.claims.sub;

      const item = await storage.createItem(userId, {
        title,
        content: description || null,
        type: 'link',
        fileUrl: url,
        fileName: null,
        fileSize: null,
        mimeType: null,
        tags,
        metadata: JSON.stringify({ url }),
      });

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create link" });
    }
  });

  // Update item
  app.patch("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateItem(id, req.body);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  // Delete item
  app.delete("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Serve files from Object Storage
  app.get('/api/files/*', async (req, res) => {
    try {
      const fileKey = req.params[0]; // Get everything after /api/files/
      
      // Download file from Object Storage
      const fileResponse = await objectStorage.downloadAsBytes(fileKey);
      
      console.log('File response type:', typeof fileResponse);
      console.log('File response keys:', fileResponse ? Object.keys(fileResponse) : 'null');
      console.log('File response structure:', JSON.stringify(fileResponse, null, 2).substring(0, 500));
      
      // Extract the actual bytes from the response
      let fileBuffer: Buffer;
      if (fileResponse && typeof fileResponse === 'object') {
        if ('ok' in fileResponse && fileResponse.ok === true && 'value' in fileResponse) {
          // Handle successful response wrapper format
          const value = fileResponse.value;
          console.log('Value type:', typeof value, 'Array?', Array.isArray(value));
          
          if (Array.isArray(value) && value.length > 0) {
            const firstItem = value[0];
            console.log('First item type:', typeof firstItem, 'Keys:', firstItem ? Object.keys(firstItem) : 'none');
            
            if (firstItem && typeof firstItem === 'object' && 'type' in firstItem && firstItem.type === 'Buffer' && 'data' in firstItem) {
              // Handle nested Buffer format: {type: "Buffer", data: [numbers]}
              console.log('Using nested Buffer format, data length:', firstItem.data.length);
              fileBuffer = Buffer.from(firstItem.data);
            } else if (typeof firstItem === 'number') {
              // Handle direct array of numbers
              console.log('Using direct number array format, length:', value.length);
              fileBuffer = Buffer.from(value);
            } else {
              throw new Error(`Unexpected value format in Object Storage response: ${JSON.stringify(firstItem).substring(0, 100)}`);
            }
          } else {
            throw new Error(`Empty or invalid value array in Object Storage response`);
          }
        } else if ('ok' in fileResponse && fileResponse.ok === false) {
          // Handle error response
          throw new Error(`Object Storage error: ${fileResponse.error?.message || 'Unknown error'}`);
        } else if ('value' in fileResponse && Array.isArray(fileResponse.value)) {
          // Handle direct value format without ok wrapper
          const bytes = fileResponse.value;
          if (bytes.length > 0 && bytes[0] && typeof bytes[0] === 'object' && 'data' in bytes[0]) {
            fileBuffer = Buffer.from(bytes[0].data);
          } else {
            fileBuffer = Buffer.from(bytes);
          }
        } else if (Buffer.isBuffer(fileResponse)) {
          fileBuffer = fileResponse;
        } else {
          throw new Error(`Unexpected Object Storage response format: ${JSON.stringify(fileResponse).substring(0, 200)}`);
        }
      } else if (Buffer.isBuffer(fileResponse)) {
        fileBuffer = fileResponse;
      } else {
        throw new Error('Unexpected response format from Object Storage');
      }
      
      // Get file metadata from database to set proper content type
      const item = await storage.getItemByObjectKey(fileKey);
      
      if (item && item.mimeType) {
        res.setHeader('Content-Type', item.mimeType);
      }
      
      // Set proper headers based on query parameter
      const action = req.query.action || 'preview'; // 'download' or 'preview'
      
      if (item && item.fileName) {
        if (action === 'download') {
          res.setHeader('Content-Disposition', `attachment; filename="${item.fileName}"`);
        } else {
          res.setHeader('Content-Disposition', `inline; filename="${item.fileName}"`);
        }
      }
      
      // Set additional headers for better browser handling
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Length', fileBuffer.length.toString());
      
      // Send the actual file buffer, not JSON
      res.end(fileBuffer);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
