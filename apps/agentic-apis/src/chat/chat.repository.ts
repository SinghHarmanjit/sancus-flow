import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import {
  chatSessions,
  chatMessages,
  prospects,
} from '../db/schema';

export type ChatSessionRow = typeof chatSessions.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;

export interface ChatSessionWithMessages extends ChatSessionRow {
  messages: ChatMessageRow[];
}

@Injectable()
export class ChatRepository {
  constructor(private drizzle: DrizzleService) {}

  async createSession(
    domain: 'wills' | 'conveyancing',
  ): Promise<ChatSessionRow> {
    const [session] = await this.drizzle.db
      .insert(chatSessions)
      .values({ domain })
      .returning();
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSessionRow | null> {
    const [session] = await this.drizzle.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return session ?? null;
  }

  async getSessionWithMessages(
    sessionId: string,
  ): Promise<ChatSessionWithMessages | null> {
    const [session] = await this.drizzle.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    if (!session) return null;

    const messages = await this.drizzle.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    return { ...session, messages };
  }

  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<ChatMessageRow> {
    const [message] = await this.drizzle.db
      .insert(chatMessages)
      .values({ sessionId, role, content, metadata: metadata ?? null })
      .returning();
    return message;
  }
}
