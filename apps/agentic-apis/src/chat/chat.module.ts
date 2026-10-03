import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { DrizzleModule } from '../db/drizzle.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [DrizzleModule, LlmModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}
