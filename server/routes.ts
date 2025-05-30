import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertItemSchema, contactSchema, linkSchema, noteSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all items with optional search and filtering
  app.get("/api/items", async (req, res) => {
    try {
      const { search, type } = req.query;
      const items = await storage.getItems(
        search as string, 
        type as string
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // Get single item
  app.get("/api/items/:id", async (req, res) => {
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

  // Upload file
  app.post("/api/items/file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { tags = "[]" } = req.body;
      const parsedTags = JSON.parse(tags);

      const fileUrl = `/uploads/${req.file.filename}`;
      
      const item = await storage.createItem({
        title: req.file.originalname,
        content: null,
        type: 'file',
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tags: parsedTags,
        metadata: null,
      });

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Create note
  app.post("/api/items/note", async (req, res) => {
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

      const item = await storage.createItem({
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
  app.post("/api/items/contact", async (req, res) => {
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

      const item = await storage.createItem({
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
  app.post("/api/items/link", async (req, res) => {
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

      const item = await storage.createItem({
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

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
