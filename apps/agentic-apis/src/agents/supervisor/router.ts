import { AgenticState } from './state';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { HumanMessage, BaseMessage } from '@langchain/core/messages';

const classificationSchema = z.object({
  safetyStatus: z.enum(['safe', 'flagged', 'out_of_scope']).describe('Safety classification of the query'),
  conversationPhase: z.enum(['education', 'intake', 'handoff']).describe('Intent classification of the query'),
});

export const routerNode = async (state: AgenticState, config?: { configurable?: { llm?: ChatOpenAI } }) => {
  const llm = config?.configurable?.llm ?? new ChatOpenAI({ modelName: 'gpt-4o-mini' });
  
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!lastMessage || typeof lastMessage.content !== 'string') {
    return { safetyStatus: 'safe', conversationPhase: 'education' } as Partial<AgenticState>;
  }

  const structuredLlm = llm.withStructuredOutput(classificationSchema, { name: 'classify_intent' });
  
  const systemPrompt = `You are a router for a legal AI agent.
Classify the user's latest message.
Safety: 'flagged' if harmful/illegal, 'out_of_scope' if totally unrelated to legal services, otherwise 'safe'.
Phase: 'education' if asking for definition/knowledge, 'intake' if providing facts for a case.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...state.messages,
  ];

  try {
    const result = await structuredLlm.invoke(messages);
    return {
      safetyStatus: result.safetyStatus,
      conversationPhase: result.conversationPhase,
    };
  } catch (error) {
    // fallback
    return { safetyStatus: 'safe', conversationPhase: 'education' };
  }
};
