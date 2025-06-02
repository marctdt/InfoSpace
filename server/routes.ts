import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage-final";
import { insertItemSchema, contactSchema, linkSchema, noteSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Store files in memory for now - we'll implement persistent storage with proper configuration
const fileStore = new Map<string, { buffer: Buffer; mimetype: string; originalname: string }>();

// Configure multer for memory storage
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
      const fileExtension = req.file.originalname.split('.').pop();
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      
      // Store file in memory store
      fileStore.set(uniqueFilename, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
      });

      // Create a URL for the uploaded file
      const fileUrl = `/files/${uniqueFilename}`;
      
      const item = await storage.createItem(userId, {
        title: req.file.originalname,
        content: null,
        type: 'file',
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tags: parsedTags,
        metadata: JSON.stringify({ storageKey: uniqueFilename }),
      });

      res.json(item);
    } catch (error) {
      console.error("File upload error:", error);
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

  // Serve files from memory store
  app.get('/files/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const file = fileStore.get(filename);
      
      if (file) {
        // Set appropriate headers
        res.setHeader('Content-Type', file.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
        res.send(file.buffer);
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
