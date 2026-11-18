export interface ConnectionConfig {
  ibmJazzUrl: string;
  ibmJazzUser: string;
  ibmJazzPass: string;
  neo4jUrl: string;
  neo4jUser: string;
  neo4jPass: string;
  n8nWebhookUrl: string;
  modelName: string;
}

export interface UserStory {
  id: string; // ST-101
  title: string;
  asARole: string;
  iWantTo: string;
  soThat: string;
  acceptanceCriteria: string[];
  asilRating?: 'A' | 'B' | 'C' | 'D' | 'QM' | '';
  affectedComponent?: string;
}

export interface MeetingTranscript {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: string[];
  rawText: string;
  extractedStories: UserStory[];
}

export interface Requirement {
  id: string; // REQ-ADAS-042
  type: 'System' | 'Software' | 'FunctionalSafety' | 'TestCase';
  title: string;
  text: string;
  status: 'Approved' | 'Draft' | 'In Review' | 'Obsolete';
  asilRating?: 'A' | 'B' | 'C' | 'D' | 'QM' | '';
  owner: string;
  lastModified: string;
  tracesTo: string[]; // IDs of other requirements or stories it traces to
}

export interface TraceLink {
  source: string;
  target: string;
  type: 'TRACES_TO' | 'REFINES' | 'VERIFIES' | 'MITIGATES' | 'IMPLEMENTS';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Story' | 'SystemReq' | 'SoftwareReq' | 'TestCase' | 'Hazard';
  status: string;
  asil?: 'A' | 'B' | 'C' | 'D' | 'QM' | '';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ImpactAnalysisReport {
  totalAffectedNodes: number;
  affectedSystemRequirements: string[];
  affectedSoftwareRequirements: string[];
  affectedTestCases: string[];
  asilSafetyViolationRisks: string[];
  estimatedReworkHours: number;
}
