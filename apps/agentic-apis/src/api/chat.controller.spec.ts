import { describe, it, expect, mock, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";

import 'reflect-metadata';
import { ChatController } from './chat.controller';
import { StartSessionRequest, ChatMessageRequest } from '@sancus-flow/types/src/agentic';

describe('ChatController', () => {
  it('should start a session and send a message', async () => {
    // TDD for ChatController
    const controller = new ChatController();

    const startReq: StartSessionRequest = {
      prospectId: '123',
      domain: 'wills'
    };
    const startRes = await controller.startSession(startReq);
    expect(startRes).toHaveProperty('sessionId');

    const chatReq: ChatMessageRequest = {
      sessionId: startRes.sessionId,
      message: 'Hello'
    };
    const chatRes = await controller.chatMessage(chatReq);
    expect(chatRes).toHaveProperty('message');
    expect(chatRes.isComplete).toBeDefined();
  });
});
