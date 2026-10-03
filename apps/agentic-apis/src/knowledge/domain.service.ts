import { Inject, Injectable } from '@nestjs/common';
import { eq, and, sql, cosineDistance } from 'drizzle-orm';
import { domainKnowledgeVectors, domainKnowledgeVersions, domainKnowledgeDocuments, domainEnum } from '../db/schema';

@Injectable()
export class DomainKnowledgeService {
  constructor(
    @Inject('DATABASE_CONNECTION') private db: any,
  ) {}

  async searchDomainKnowledge(domain: typeof domainEnum.enumValues[number], queryEmbedding: number[], limit: number = 3) {
    const results = await this.db
      .select({
        content: domainKnowledgeVectors.content,
        title: domainKnowledgeDocuments.title,
      })
      .from(domainKnowledgeVectors)
      .innerJoin(domainKnowledgeVersions, eq(domainKnowledgeVectors.versionId, domainKnowledgeVersions.id))
      .innerJoin(domainKnowledgeDocuments, eq(domainKnowledgeVersions.documentId, domainKnowledgeDocuments.id))
      .where(and(
        eq(domainKnowledgeDocuments.domain, domain),
        eq(domainKnowledgeVersions.status, 'active')
      ))
      .orderBy(cosineDistance(domainKnowledgeVectors.embedding, queryEmbedding))
      .limit(limit);

    return results;
  }
}
