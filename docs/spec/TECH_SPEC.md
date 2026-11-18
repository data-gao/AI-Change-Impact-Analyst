# Technical Specification

## 1. API Contract

### GET `/api/health`
- **Description**: Returns system health and API key availability.
- **Request Body**: None
- **Response Schema**:
  ```typescript
  {
    status: string;
    api_key_available: boolean;
  }
  ```
- **Example Response**:
  ```json
  {
    "status": "ok",
    "api_key_available": true
  }
  ```
- **Error Responses**: `500 Internal Server Error` if server is down.

### GET `/api/requirements`
- **Description**: Fetches current requirement inventory and trace links.
- **Request Body**: None
- **Response Schema**:
  ```typescript
  {
    requirements: Requirement[];
    links: TraceLink[];
  }
  ```
- **Example Response**:
  ```json
  {
    "requirements": [
      {
        "id": "REQ-001",
        "type": "System",
        "title": "ADAS System",
        "text": "ADAS shall...",
        "status": "Draft",
        "asilRating": "ASIL D",
        "owner": "John Doe",
        "lastModified": "2026-08-19T10:00:00Z",
        "tracesTo": []
      }
    ],
    "links": [
      { "source": "REQ-001", "target": "REQ-002", "type": "TRACES_TO" }
    ]
  }
  ```
- **Error Responses**: `500 Internal Server Error` on data fetch failure.

### POST `/api/requirements/reset`
- **Description**: Resets in-memory requirements and links to initial default data.
- **Request Body**: None
- **Response Schema**:
  ```typescript
  {
    message: string;
  }
  ```
- **Example Response**:
  ```json
  {
    "message": "Requirements reset to initial state"
  }
  ```

### POST `/api/requirements/update`
- **Description**: Upserts a requirement by ID.
- **Request Body Schema**:
  ```typescript
  {
    id: string;
    title: string;
    text: string;
    status: string;
    asilRating: string;
    owner: string;
  }
  ```
- **Response Schema**:
  ```typescript
  {
    message: string;
    requirement: Requirement;
  }
  ```

### POST `/api/analyze-transcript`
- **Description**: Analyzes a transcript to extract stories and compute requirement impact.
- **Request Body Schema**:
  ```typescript
  {
    rawText: string;
    activeInventory: Requirement[];
  }
  ```
- **Response Schema**:
  ```typescript
  {
    userStories: UserStory[];
    impactReport: {
      updatedRequirements: Requirement[];
      addedRequirements: Requirement[];
      missingRequirementsWarning: string;
    }
  }
  ```
- **Error Responses**: `400 Bad Request` if transcript missing, `502 Bad Gateway` if LLM fails.

### POST `/api/jazz/push`
- **Description**: Submits staged changes to IBM Jazz OSLC endpoint and triggers n8n webhook.
- **Request Body Schema**:
  ```typescript
  {
    config: ConnectionConfig;
    itemsToPush: Requirement[];
  }
  ```
- **Response Schema**:
  ```typescript
  {
    message: string;
    pushedCount: number;
    transactionLogs: string[];
  }
  ```
- **Error Responses**: `401 Unauthorized` for bad Jazz credentials, `500 Internal Server Error` if push fails.

## 2. Data Models

```typescript
interface ConnectionConfig {
  jazzUrl: string;       // IBM Jazz RM Base URL
  jazzUser: string;      // Jazz Username
  jazzPass: string;      // Jazz Password
  neo4jUrl: string;      // Neo4j Bolt/HTTP URL
  neo4jUser: string;     // Neo4j Username
  neo4jPass: string;     // Neo4j Password
  n8nWebhook: string;    // n8n Trigger URL
  modelName: string;     // LLM Model Name (e.g., gemini-3.5-flash)
}

interface UserStory {
  id: string;            // Format: ST-XXX
  title: string;         // Short descriptive title
  asARole: string;       // "As a [role]"
  iWantTo: string;       // "I want to [action]"
  soThat: string;        // "So that [benefit]"
  acceptanceCriteria: string[]; // List of criteria
  asilRating: string;    // "QM", "ASIL A", "ASIL B", "ASIL C", "ASIL D"
  affectedComponent: string; // Target system component
}

interface MeetingTranscript {
  id: string;            // Transcript ID
  title: string;         // Descriptive meeting title
  date: string;          // ISO Date string
  participants: string[];// List of attendees
  rawText: string;       // Full raw transcript
  extractedStories: UserStory[]; // Stories extracted post-analysis
}

interface Requirement {
  id: string;            // Format: REQ-XXX
  type: "System" | "Software" | "FunctionalSafety" | "TestCase";
  title: string;         // Requirement title
  text: string;          // Detailed description
  status: string;        // Lifecycle status (e.g., "Draft", "Approved")
  asilRating: string;    // ASIL allocation
  owner: string;         // Responsible person
  lastModified: string;  // ISO timestamp
  tracesTo: string[];    // Target requirement IDs
}

interface TraceLink {
  source: string;        // Source ID
  target: string;        // Target ID
  type: "TRACES_TO" | "REFINES" | "VERIFIES" | "MITIGATES" | "IMPLEMENTS";
}

interface GraphNode {
  id: string;
  label: string;
  type: "Story" | "SystemReq" | "SoftwareReq" | "TestCase" | "Hazard";
  status: string;
  asil: string;
}

interface ImpactAnalysisReport {
  totalAffectedNodes: number;
  affectedSystemRequirements: string[];
  affectedSoftwareRequirements: string[];
  affectedTestCases: string[];
  asilSafetyViolationRisks: string[];
  estimatedReworkHours: number;
}
```

## 3. LLM Integration Specification

- **Model**: `gemini-3.5-flash` via `@google/genai`
- **System Prompt Design**: Instructs the model to act as an ISO 26262 automotive safety expert and IBM Jazz integrator. Evaluates engineering meeting transcripts for safety implications and maps them to structural requirement updates.
- **Output Contract**: Uses `responseMimeType: "application/json"` with a defined `responseSchema` that maps to the structured JSON representation of extracted stories and delta requirements.
- **Prompt Template**: Contains the system prompt, dynamically injected context containing the `activeInventory` requirements, and the `rawText` of the transcript for LLM comparison.

## 4. External Integration Contracts

- **IBM Jazz OSLC**: Uses OSLC RDF+XML formats. The write-back operation simulates a PUT/POST to Jazz RM URLs with basic authentication. Constructs valid XML namespaces (`oslc_rm`, `rdf`, `dcterms`) and logs generated RDF in the UI.
- **n8n Webhook**: Dispatches a JSON POST request upon successful commits to notify upstream systems:
  ```json
  {
    "event": "jazz_commit",
    "operator": "AI Impact Analyst",
    "timestamp": "2026-08-19T16:30:10Z",
    "changes": [ "REQ-010 updated", "REQ-011 added" ]
  }
  ```

## 5. Error Handling Matrix

| Scenario | HTTP Status | Handling Strategy |
|---|---|---|
| Missing active inventory | 400 Bad Request | Reject analysis, prompt user to load requirements. |
| LLM API rate limit / timeout | 502 / 504 | Return graceful error payload; UI displays toast warning with retry option. |
| LLM parsing failure (bad JSON) | 500 Internal Server Error | Fallback mechanism or prompt regeneration. |
| Jazz OSLC Auth Failure | 401 Unauthorized | Reject commit, UI highlights config panel for credential update. |
| Jazz Network Failure | 503 Service Unavailable | Log failure, keep items staged in queue. |
| n8n Webhook Timeout | 200 (Partial) | Succeed commit but display warning toast that notification failed. |
