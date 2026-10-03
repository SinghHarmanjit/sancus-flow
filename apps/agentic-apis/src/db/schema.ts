import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, doublePrecision, vector, pgEnum, integer } from 'drizzle-orm/pg-core';

export const domainEnum = pgEnum('domain', ['wills', 'conveyancing']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed', 'abandoned', 'archived']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system', 'tool']);
export const documentStatusEnum = pgEnum('document_status', ['active', 'draft', 'archived']);

export const prospects = pgTable('prospects', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  prospectId: uuid('prospect_id').references(() => prospects.id),
  domain: domainEnum('domain').notNull(),
  status: sessionStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => chatSessions.id).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const agenticCheckpoints = pgTable('agentic_checkpoints', {
  threadId: uuid('thread_id').references(() => chatSessions.id).notNull(),
  checkpointId: varchar('checkpoint_id', { length: 255 }).primaryKey(),
  parentCheckpointId: varchar('parent_checkpoint_id', { length: 255 }),
  state: jsonb('state'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const prospectFacts = pgTable('prospect_facts', {
  id: uuid('id').primaryKey().defaultRandom(),
  prospectId: uuid('prospect_id').references(() => prospects.id).notNull(),
  domain: domainEnum('domain').notNull(),
  factKey: varchar('fact_key', { length: 255 }).notNull(),
  factValue: jsonb('fact_value').notNull(),
  confidenceScore: doublePrecision('confidence_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taxonomyEntityDefinitions = pgTable('taxonomy_entity_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: domainEnum('domain').notNull(),
  entityName: varchar('entity_name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  extractionSchema: jsonb('extraction_schema').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const prospectLeafProfiles = pgTable('prospect_leaf_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  prospectId: uuid('prospect_id').references(() => prospects.id).notNull(),
  taxonomyEntityId: uuid('taxonomy_entity_id').references(() => taxonomyEntityDefinitions.id).notNull(),
  extractedData: jsonb('extracted_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const domainKnowledgeDocuments = pgTable('domain_knowledge_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  shortSummary: text('short_summary'),
  domain: domainEnum('domain').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const domainKnowledgeVersions = pgTable('domain_knowledge_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => domainKnowledgeDocuments.id).notNull(),
  versionNumber: integer('version_number').notNull(),
  sourceUrl: text('source_url'),
  status: documentStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const domainKnowledgeVectors = pgTable('domain_knowledge_vectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').references(() => domainKnowledgeVersions.id).notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 256 }),
});

export const caseStudyDocuments = pgTable('case_study_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  shortSummary: text('short_summary'),
  domain: domainEnum('domain').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const caseStudyVersions = pgTable('case_study_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseStudyId: uuid('case_study_id').references(() => caseStudyDocuments.id).notNull(),
  versionNumber: integer('version_number').notNull(),
  sourceUrl: text('source_url'),
  status: documentStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const caseStudyVectors = pgTable('case_study_vectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').references(() => caseStudyVersions.id).notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 256 }),
});

export const caseStudyTaxonomyTags = pgTable('case_study_taxonomy_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseStudyId: uuid('case_study_id').references(() => caseStudyDocuments.id).notNull(),
  tagData: jsonb('tag_data').notNull(),
});
