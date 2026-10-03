import { describe, it, expect, mock, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";

import { createComposerNode } from './composer';
import { AgenticState } from './state';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('Composer Node', () => {
  it('should synthesize a response for education phase', async () => {
    const mockLlm = {
      invoke: mock().mockResolvedValue(new AIMessage('This is an educational response.')),
    };

    const node = createComposerNode(mockLlm as any);

    const initialState: AgenticState = {
      sessionId: 'test-session',
      domain: 'wills',
      messages: [new HumanMessage('What is a will?')],
      conversationPhase: 'education',
      extractedFacts: {},
      activeTaxonomyProfiles: [],
      missingRequiredFields: [],
      retrievedContext: 'Document: Wills 101\nContent: A will is a legal document.',
    };

    const result = await node(initialState);

    expect(mockLlm.invoke).toHaveBeenCalled();
    const callArg = mockLlm.invoke.mock.calls[0][0];
    const systemMessage = callArg.find((m: any) => m._getType() === 'system');
    
    expect(systemMessage.content).toContain('education');
    expect(systemMessage.content).toContain('Wills 101');
    expect(result).toHaveProperty('messages');
    expect(result.messages[0]).toBeInstanceOf(AIMessage);
    expect((result.messages[0] as AIMessage).content).toBe('This is an educational response.');
  });
});
