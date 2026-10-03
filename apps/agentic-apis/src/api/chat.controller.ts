import { Controller, Post, Body } from '@nestjs/common';
import type { StartSessionRequest, ChatMessageRequest, ChatMessageResponse } from '@sancus-flow/types/src/agentic';

@Controller('chat')
export class ChatController {
  
  @Post('start')
  async startSession(@Body() request: StartSessionRequest) {
    // In a real implementation, this would save to the DB and initialize LangGraph state
    return {
      sessionId: 'sess_' + Math.random().toString(36).substring(7),
      domain: request.domain
    };
  }

  @Post('message')
  async chatMessage(@Body() request: ChatMessageRequest): Promise<ChatMessageResponse> {
    // In a real implementation, this would dispatch to the LangGraph supervisor graph
    return {
      message: 'Hello, this is a response from the agent.',
      isComplete: false,
      missingFields: [],
    };
  }
}
