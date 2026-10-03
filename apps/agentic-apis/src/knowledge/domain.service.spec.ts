import { describe, it, expect, mock, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";

import { Test, TestingModule } from '@nestjs/testing';
import { DomainKnowledgeService } from './domain.service';
import { domainKnowledgeVectors, domainKnowledgeVersions, domainKnowledgeDocuments } from '../db/schema';

describe('DomainKnowledgeService', () => {
  let service: DomainKnowledgeService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: mock().mockReturnThis(),
      from: mock().mockReturnThis(),
      innerJoin: mock().mockReturnThis(),
      where: mock().mockReturnThis(),
      orderBy: mock().mockReturnThis(),
      limit: mock().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainKnowledgeService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<DomainKnowledgeService>(DomainKnowledgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchDomainKnowledge', () => {
    it('should perform semantic search and return matched text', async () => {
      const mockEmbedding = Array(256).fill(0.1);
      const mockDomain = 'wills' as const;

      const mockResults = [
        {
          content: 'This is a test document.',
          title: 'Test Title',
        }
      ];

      mockDb.limit.mockResolvedValueOnce(mockResults);

      const results = await service.searchDomainKnowledge(mockDomain, mockEmbedding, 1);

      expect(results).toEqual(mockResults);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(domainKnowledgeVectors);
    });
  });
});
