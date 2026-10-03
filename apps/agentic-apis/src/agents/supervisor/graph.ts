import { StateGraph, END } from '@langchain/langgraph';
import { AgenticStateAnnotation } from './state';

export interface GraphNodes {
  routerNode: any;
  educatorNode: any;
  composerNode: any;
}

export const buildGraph = (nodes: GraphNodes) => {
  const workflow = new StateGraph(AgenticStateAnnotation)
    .addNode('router', nodes.routerNode)
    .addNode('educator', nodes.educatorNode)
    .addNode('composer', nodes.composerNode)
    .addEdge('__start__', 'router')
    .addConditionalEdges(
      'router',
      (state) => {
        if (state.conversationPhase === 'education') {
          return 'educator';
        }
        // Fallback for Phase 3 since we only built education so far
        return END; 
      },
      {
        'educator': 'educator',
        [END]: END,
      }
    )
    .addEdge('educator', 'composer')
    .addEdge('composer', END);

  return workflow.compile();
};
