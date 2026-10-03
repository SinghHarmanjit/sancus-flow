CREATE TYPE "public"."document_status" AS ENUM('active', 'draft', 'archived');--> statement-breakpoint
CREATE TYPE "public"."domain" AS ENUM('wills', 'conveyancing');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed', 'abandoned', 'archived');--> statement-breakpoint
CREATE TABLE "agentic_checkpoints" (
	"thread_id" uuid NOT NULL,
	"checkpoint_id" varchar(255) PRIMARY KEY NOT NULL,
	"parent_checkpoint_id" varchar(255),
	"state" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_study_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"short_summary" text,
	"domain" "domain" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_study_taxonomy_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_study_id" uuid NOT NULL,
	"tag_data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_study_vectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(256)
);
--> statement-breakpoint
CREATE TABLE "case_study_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_study_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source_url" text,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid,
	"domain" "domain" NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"short_summary" text,
	"domain" "domain" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_knowledge_vectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(256)
);
--> statement-breakpoint
CREATE TABLE "domain_knowledge_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source_url" text,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"domain" "domain" NOT NULL,
	"fact_key" varchar(255) NOT NULL,
	"fact_value" jsonb NOT NULL,
	"confidence_score" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_leaf_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"taxonomy_entity_id" uuid NOT NULL,
	"extracted_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_entity_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" "domain" NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"extraction_schema" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agentic_checkpoints" ADD CONSTRAINT "agentic_checkpoints_thread_id_chat_sessions_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_taxonomy_tags" ADD CONSTRAINT "case_study_taxonomy_tags_case_study_id_case_study_documents_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_study_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_vectors" ADD CONSTRAINT "case_study_vectors_version_id_case_study_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."case_study_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_versions" ADD CONSTRAINT "case_study_versions_case_study_id_case_study_documents_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_study_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_knowledge_vectors" ADD CONSTRAINT "domain_knowledge_vectors_version_id_domain_knowledge_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."domain_knowledge_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_knowledge_versions" ADD CONSTRAINT "domain_knowledge_versions_document_id_domain_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."domain_knowledge_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_facts" ADD CONSTRAINT "prospect_facts_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_leaf_profiles" ADD CONSTRAINT "prospect_leaf_profiles_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_leaf_profiles" ADD CONSTRAINT "prospect_leaf_profiles_taxonomy_entity_id_taxonomy_entity_definitions_id_fk" FOREIGN KEY ("taxonomy_entity_id") REFERENCES "public"."taxonomy_entity_definitions"("id") ON DELETE no action ON UPDATE no action;