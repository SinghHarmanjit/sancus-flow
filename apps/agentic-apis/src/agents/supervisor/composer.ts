import { AgenticState } from './state';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { SystemMessage, BaseMessage } from '@langchain/core/messages';

export const createComposerNode = (llm: BaseLanguageModel) => {
  return async (state: AgenticState): Promise<Partial<AgenticState>> => {
    const systemPrompt = `You are a helpful legal assistant for the domain: ${state.domain}.
Current Phase: ${state.conversationPhase}

Context Information:
${state.retrievedContext}

If the phase is education, synthesize a helpful, factual response based on the context provided. Do not ask aggressive intake questions. Keep it informative.`;

    const messages = [
      new SystemMessage(systemPrompt),
      ...state.messages,
    ];

    const response = await llm.invoke(messages);

    return {
      messages: [response],
    };
  };
};
