import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { LlmService } from '../llm/llm.service';
import {
  ChatRepository,
  ChatSessionWithMessages,
} from './chat.repository';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    private readonly llm: LlmService,
    private readonly chatRepo: ChatRepository,
  ) {}

  async createSession(domain: 'wills' | 'conveyancing') {
    const session = await this.chatRepo.createSession(domain);
    return {
      sessionId: session.id,
      domain: session.domain,
      status: session.status,
      createdAt: session.createdAt,
    };
  }

  async sendMessage(sessionId: string, content: string) {
    const session = await this.chatRepo.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    if (session.status !== 'active') {
      throw new UnprocessableEntityException(
        `Session ${sessionId} is not active (status: ${session.status})`,
      );
    }

    const sessionWithHistory = await this.chatRepo.getSessionWithMessages(sessionId);
    const history = sessionWithHistory?.messages ?? [];

    // Save user message
    await this.chatRepo.saveMessage(sessionId, 'user', content);

    // Build LangChain message list
    const systemPrompt = new SystemMessage(
      `You are a legal intake assistant helping clients with ${session.domain} matters. ` +
        `Be professional, empathetic, and ask clarifying questions to understand the client's needs.`,
    );

    const langChainMessages = [
      systemPrompt,
      ...history.map((msg) => {
        if (msg.role === 'user') return new HumanMessage(msg.content);
        return new AIMessage(msg.content);
      }),
      new HumanMessage(content),
    ];

    // Invoke LLM
    let replyContent: string;
    try {
      const response = await this.llm.chat.invoke(langChainMessages);
      replyContent =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
    } catch (err) {
      this.logger.error('LLM invocation failed', err);
      throw new InternalServerErrorException(
        `LLM unavailable: ${(err as Error).message}`,
      );
    }

    // Save assistant message
    const assistantMessage = await this.chatRepo.saveMessage(
      sessionId,
      'assistant',
      replyContent,
    );

    return {
      messageId: assistantMessage.id,
      reply: replyContent,
      sessionId,
    };
  }

  async getSession(sessionId: string): Promise<ChatSessionWithMessages> {
    const session = await this.chatRepo.getSessionWithMessages(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }
}
