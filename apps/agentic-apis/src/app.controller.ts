import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getInfo() {
    return {
      service: '@sancus-flow/agentic-apis',
      description: 'AI Agent Engine — LangGraph.js + MEDDPICC Qualification',
      version: '0.0.1',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
