import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

export const getLLM = (configService: ConfigService) => {
    let baseUrl = configService.get<string>(
        'LLM_BASE_URL',
        'http://localhost:11434',
    );

    // Ensure OpenAI compatibility suffix is present if not using standard API
    if (baseUrl.includes('localhost') && !baseUrl.endsWith('/v1')) {
        baseUrl = `${baseUrl}/v1`;
    }

    const modelName = configService.get<string>(
        'LLM_CONVERSATION_MODEL',
        'gemma3',
    );

    console.log('[getLLM] Resolved Base URL:', baseUrl);
    console.log('[getLLM] Resolved Model Name:', modelName);

    return new ChatOpenAI({
        modelName: modelName,
        maxTokens: 8192,
        temperature: 0,
        apiKey: configService.get<string>('GEMINI_API_KEY', 'not-needed-for-local'),
        openAIApiKey: configService.get<string>(
            'GEMINI_API_KEY',
            'not-needed-for-local',
        ),
        configuration: {
            baseURL: baseUrl,
        },
    });
};
