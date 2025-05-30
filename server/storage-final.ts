import {
  users,
  items,
  type User,
  type UpsertUser,
  type Item,
  type InsertItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike } from "drizzle-orm";

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
      let whereConditions = [eq(items.userId, userId)];
      
      if (type && type !== 'all') {
        whereConditions.push(eq(items.type, type));
      }
      
      if (searchQuery) {
        const searchClause = or(
          ilike(items.title, `%${searchQuery}%`),
          ilike(items.content, `%${searchQuery}%`),
          ilike(items.fileName, `%${searchQuery}%`)
        );
        if (searchClause) {
          whereConditions.push(searchClause);
        }
      }
      
      const results = await db
        .select()
        .from(items)
        .where(and(...whereConditions))
        .orderBy(items.createdAt);
        
      return results.reverse();
    } catch (error) {
      console.error('Database query failed:', error);
      return [];
    }
  }

  async getItem(id: number): Promise<Item | undefined> {
    try {
      const [item] = await db.select().from(items).where(eq(items.id, id));
      return item;
    } catch (error) {
      console.error('Error fetching item:', error);
      return undefined;
    }
  }

  async createItem(userId: string, insertItem: InsertItem): Promise<Item> {
    try {
      const [item] = await db
        .insert(items)
        .values({
          ...insertItem,
          userId,
        })
        .returning();
      return item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    try {
      const [item] = await db
        .update(items)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(items.id, id))
        .returning();
      return item;
    } catch (error) {
      console.error('Error updating item:', error);
      return undefined;
    }
  }

  async deleteItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(items).where(eq(items.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
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
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();