import { ConfigService } from '@nestjs/config';

export const setupLangSmith = (configService: ConfigService) => {
    // LangChain automatically picks up these env variables for LangSmith
    const isTracingEnabled = configService.get<string>('LANGCHAIN_TRACING_V2');
    if (isTracingEnabled === 'true') {
        process.env.LANGCHAIN_TRACING_V2 = 'true';
        process.env.LANGCHAIN_API_KEY =
            configService.get<string>('LANGCHAIN_API_KEY');
        process.env.LANGCHAIN_PROJECT = configService.get<string>(
            'LANGCHAIN_PROJECT',
            'rag-mvp1',
        );
    }
};
