import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { getLLM } from './llm.factory';

@Injectable()
export class LlmService {
  readonly chat: ChatOpenAI;

  constructor(private config: ConfigService) {
    this.chat = getLLM(config);
  }
}
