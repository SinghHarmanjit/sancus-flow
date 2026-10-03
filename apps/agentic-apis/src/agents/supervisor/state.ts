import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

export const AgenticStateAnnotation = Annotation.Root({
  sessionId: Annotation<string>(),
  domain: Annotation<string>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
  conversationPhase: Annotation<'education' | 'intake' | 'handoff'>(),
  extractedFacts: Annotation<Record<string, any>>({
    reducer: (state, update) => ({ ...state, ...update }),
    default: () => ({}),
  }),
  activeTaxonomyProfiles: Annotation<string[]>({
    reducer: (state, update) => {
      const merged = new Set([...state, ...update]);
      return Array.from(merged);
    },
    default: () => [],
  }),
  missingRequiredFields: Annotation<string[]>({
    reducer: (state, update) => update, // overwrite with latest evaluation
    default: () => [],
  }),
  retrievedContext: Annotation<string>({
    reducer: (state, update) => update, // overwrite with latest retrieval
    default: () => '',
  }),
  safetyStatus: Annotation<'safe' | 'flagged' | 'out_of_scope'>(),
});

export type AgenticState = typeof AgenticStateAnnotation.State;
