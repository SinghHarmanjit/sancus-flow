import { AgenticState } from '../supervisor/state';
import { DomainKnowledgeService } from '../../knowledge/domain.service';

export const createEducatorNode = (
  knowledgeService: DomainKnowledgeService,
  embeddings: { embedQuery: (text: string) => Promise<number[]> }
) => {
  return async (state: AgenticState): Promise<Partial<AgenticState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || typeof lastMessage.content !== 'string') {
      return {};
    }

    const query = lastMessage.content;
    const embedding = await embeddings.embedQuery(query);
    const results = await knowledgeService.searchDomainKnowledge(state.domain as any, embedding);

    const formattedContext = results
      .map(r => `Document: ${r.title}\nContent: ${r.content}`)
      .join('\n\n');

    return {
      retrievedContext: formattedContext,
    };
  };
};
