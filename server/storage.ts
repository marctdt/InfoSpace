import { items, type Item, type InsertItem } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  getItems(searchQuery?: string, type?: string): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getItems(searchQuery?: string, type?: string): Promise<Item[]> {
    try {
      let query = db.select().from(items);
      
      const conditions = [];
      
      // Filter by type if specified
      if (type && type !== 'all') {
        conditions.push(eq(items.type, type));
      }
      
      // Filter by search query if specified
      if (searchQuery) {
        const searchConditions = [
          ilike(items.title, `%${searchQuery}%`),
          ilike(items.content, `%${searchQuery}%`),
          ilike(items.fileName, `%${searchQuery}%`)
        ];
        conditions.push(or(...searchConditions));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const results = await query.orderBy(items.createdAt);
      return results.reverse(); // Show newest first
    } catch (error) {
      console.error('Database query failed:', error);
      throw error;
    }
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values({
        ...insertItem,
        metadata: insertItem.metadata || null,
        content: insertItem.content || null,
        fileUrl: insertItem.fileUrl || null,
        fileName: insertItem.fileName || null,
        fileSize: insertItem.fileSize || null,
        mimeType: insertItem.mimeType || null
      })
      .returning();
    return item;
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(items.id, id))
      .returning();
    return item || undefined;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export class MemStorage implements IStorage {
  private items: Map<number, Item>;
  private currentId: number;

  constructor() {
    this.items = new Map();
    this.currentId = 1;
  }

  async getItems(searchQuery?: string, type?: string): Promise<Item[]> {
    let results = Array.from(this.items.values());

    // Filter by type if specified
    if (type && type !== 'all') {
      results = results.filter(item => item.type === type);
    }

    // Filter by search query if specified
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.content && item.content.toLowerCase().includes(query)) ||
        (item.fileName && item.fileName.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Sort by creation date (newest first)
    return results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.currentId++;
    const now = new Date();
    const item: Item = {
      ...insertItem,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(id, item);
    return item;
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const existingItem = this.items.get(id);
    if (!existingItem) {
      return undefined;
    }

    const updatedItem: Item = {
      ...existingItem,
      ...updateData,
      updatedAt: new Date(),
    };

    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }
}

export const storage = new DatabaseStorage();
