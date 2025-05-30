import { items, users, type Item, type InsertItem, type User, type UpsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  getItems(userId: string, searchQuery?: string, type?: string): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(userId: string, item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getItems(userId: string, searchQuery?: string, type?: string): Promise<Item[]> {
    try {
      let query = db.select().from(items);
      
      const conditions = [eq(items.userId, userId)];
      
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
      
      query = query.where(and(...conditions));
      
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

  async createItem(userId: string, insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values({
        ...insertItem,
        userId,
        content: insertItem.content || null,
        fileUrl: insertItem.fileUrl || null,
        fileName: insertItem.fileName || null,
        fileSize: insertItem.fileSize || null,
        mimeType: insertItem.mimeType || null,
        metadata: insertItem.metadata || null
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

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export class MemStorage implements IStorage {
  private items: Map<number, Item>;
  private users: Map<string, User>;
  private currentId: number;

  constructor() {
    this.items = new Map();
    this.users = new Map();
    this.currentId = 1;
  }

  async getItems(userId: string, searchQuery?: string, type?: string): Promise<Item[]> {
    let results = Array.from(this.items.values()).filter(item => item.userId === userId);

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

  async createItem(userId: string, insertItem: InsertItem): Promise<Item> {
    const id = this.currentId++;
    const now = new Date();
    const item: Item = {
      id,
      userId,
      title: insertItem.title,
      content: insertItem.content || null,
      type: insertItem.type,
      fileUrl: insertItem.fileUrl || null,
      fileName: insertItem.fileName || null,
      fileSize: insertItem.fileSize || null,
      mimeType: insertItem.mimeType || null,
      tags: insertItem.tags || null,
      metadata: insertItem.metadata || null,
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

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const now = new Date();
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    this.users.set(userData.id, user);
    return user;
  }
}

export const storage = new MemStorage();
