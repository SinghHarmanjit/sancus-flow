import { createEducatorNode } from './node';
import { AgenticState } from '../supervisor/state';
import { HumanMessage } from '@langchain/core/messages';

describe('Educator Node', () => {
  it('should retrieve domain knowledge and update retrievedContext', async () => {
    const mockService = {
      searchDomainKnowledge: jest.fn().mockResolvedValue([
        { title: 'Doc 1', content: 'Fact 1' }
      ]),
    };

    const mockEmbeddings = {
      embedQuery: jest.fn().mockResolvedValue(Array(256).fill(0.1)),
    };

    const node = createEducatorNode(mockService as any, mockEmbeddings as any);

    const initialState: AgenticState = {
      sessionId: 'test-session',
      domain: 'wills',
      messages: [new HumanMessage('What is a will?')],
      conversationPhase: 'education',
      extractedFacts: {},
      activeTaxonomyProfiles: [],
      missingRequiredFields: [],
      retrievedContext: '',
    };

    const result = await node(initialState);

    expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith('What is a will?');
    expect(mockService.searchDomainKnowledge).toHaveBeenCalledWith('wills', Array(256).fill(0.1));
    expect(result).toHaveProperty('retrievedContext');
    expect(result.retrievedContext).toContain('Doc 1');
    expect(result.retrievedContext).toContain('Fact 1');
  });
});
