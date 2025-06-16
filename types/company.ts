   export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: string;
  ownerId: string;
  supportEmail: string;
  defaultCCs: string[];
  autoRepliesEnabled: boolean;
  domain?: string;
  settings: {
    autoAssignRules?: any;
    ccRecommendationRules?: any;
    ticketIdPrefix: string;
  }
}