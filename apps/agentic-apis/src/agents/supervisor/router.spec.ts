import { describe, expect, it, mock } from 'bun:test';
import { routerNode } from './router';
import { HumanMessage } from '@langchain/core/messages';

describe('Router Node', () => {
  it('should classify safe educational messages', async () => {
    const mockState = {
      messages: [new HumanMessage('What is a trust?')],
    };
    
    const mockStructuredLlm = {
      invoke: mock().mockResolvedValue({ safetyStatus: 'safe', conversationPhase: 'education' }),
    };

    const mockLlm = {
      withStructuredOutput: () => mockStructuredLlm,
    } as any;

    const result = await routerNode(mockState as any, { configurable: { llm: mockLlm } });
    
    expect(result.safetyStatus).toBe('safe');
    expect(result.conversationPhase).toBe('education');
  });
});
