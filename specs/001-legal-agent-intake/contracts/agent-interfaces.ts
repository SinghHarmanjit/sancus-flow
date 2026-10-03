export interface StartSessionRequest {
  prospectId: string;
  domain: 'wills' | 'conveyancing';
  initialContext?: string; // e.g. "Arrived from Facebook Ads regarding Will kits"
}

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatMessageResponse {
  message: string;
  isComplete: boolean; // True if the intake form is fully satisfied
  missingFields: string[]; // Let the UI know what the AI is currently trying to ask
  debug_activeProfiles?: string[]; // For UI highlighting (e.g. "We detected: Blended Family")
}

export interface TaxonomyCreationRequest {
  domain: string;
  entityName: string;
  description: string;
  extractionSchema: Record<string, any>; // JSON Schema standard
}
