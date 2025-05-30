import { pgTable, text, serial, timestamp, integer, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type").notNull(), // 'file', 'note', 'contact', 'link'
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  tags: text("tags").array().$default(() => []),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Contact specific schema
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
});

export type ContactData = z.infer<typeof contactSchema>;

// Link specific schema
export const linkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid URL"),
  description: z.string().optional(),
});

export type LinkData = z.infer<typeof linkSchema>;

// Note specific schema
export const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export type NoteData = z.infer<typeof noteSchema>;
