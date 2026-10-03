import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from './db/drizzle.module';
import { LlmModule } from './llm/llm.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { setupLangSmith } from './tracing/langsmith';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    DrizzleModule,
    LlmModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    setupLangSmith(this.configService);
  }
}
