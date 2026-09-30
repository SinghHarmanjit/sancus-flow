import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getInfo() {
    return {
      service: '@sancus-flow/crm-apis',
      description:
        'CRM & Marketplace Backend — Leads, Cases, Lawyers, Integrations',
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
