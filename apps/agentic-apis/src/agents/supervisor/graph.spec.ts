import { buildGraph } from './graph';
import { AgenticStateAnnotation } from './state';

describe('Graph Wiring', () => {
  it('should build the StateGraph successfully', () => {
    // Mock the dependencies for the graph
    const mockRouter = jest.fn();
    const mockEducator = jest.fn();
    const mockComposer = jest.fn();

    const graph = buildGraph({
      routerNode: mockRouter,
      educatorNode: mockEducator,
      composerNode: mockComposer
    });

    expect(graph).toBeDefined();
    // In LangChain/LangGraph, the compiled graph has a name and nodes.
    // We just verify it compiles without throwing errors.
  });
});
