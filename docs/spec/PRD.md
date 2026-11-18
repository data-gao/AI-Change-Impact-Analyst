# Product Requirements Document (PRD)

## 1. Product Vision & Overview
**AI Impact Analyst** is an automotive functional safety requirement impact analysis tool designed to streamline the systems engineering workflow. It converts meeting transcripts (such as sprint planning workshops or safety reviews) into traced user stories and evaluates requirement deltas (updates, new additions, and missing gap warnings) against an existing IBM Jazz Requirements Management (RM) inventory. This process significantly reduces manual review time while ensuring ISO 26262 compliance.

## 2. User Personas
- **Safety Engineer**: ISO 26262 compliance lead who reviews safety gaps and ensures ASIL ratings are correctly assigned and met.
- **ADAS Systems Architect**: System requirements owner for Advanced Driver Assistance Systems, ensuring architectural components are traced accurately.
- **HMI Software Engineer**: Responsible for UI and alert requirements, consuming software requirements for dashboard implementations.
- **BMS Firmware Engineer**: Focuses on battery management systems and thermal requirements, specifically ensuring safety critical thermal runaway scenarios are addressed.
- **QA/HIL Verification Engineer**: Manages test case coverage, ensuring every requirement (especially safety-critical ones) is verified via Hardware-In-the-Loop testing.

## 3. Feature Matrix
The core workflow follows a 5-step pipeline:
- **Step 1: Meeting Transcript Input**: Users can select predefined templates or input raw text into an editable textarea, representing voice-to-text transcriptions (e.g., via Whisper).
- **Step 2: User Story Extraction**: Uses Gemini LLM structured output to extract formal user stories from conversational text.
- **Step 3: RAG Vector Comparison**: Compares the extracted stories with the existing active requirement inventory from IBM Jazz RM.
- **Step 4: Impact Trace Report**: Performs delta analysis to recommend updates to existing requirements, propose new requirement insertions, and flag safety or integrity warnings.
- **Step 5: IBM Jazz OSLC Write-back**: Provides a staging interface to review changes, commits updates using OSLC RDF+XML to IBM Jazz, and triggers an n8n webhook notification.

## 4. Functional Requirements
| ID | Requirement Description |
|---|---|
| **FR-001** | System shall accept meeting transcript text input via an editable textarea. |
| **FR-002** | System shall support predefined sprint workshop templates (e.g., ADAS, BMS). |
| **FR-003** | System shall extract structured User Stories containing id, title, as-a/i-want/so-that clauses, acceptance criteria, and ASIL rating. |
| **FR-004** | System shall compare extracted stories against the current requirements inventory. |
| **FR-005** | System shall generate requirement update recommendations with visual before/after diffs. |
| **FR-006** | System shall identify and propose completely new requirements to be inserted. |
| **FR-007** | System shall flag missing requirement gaps, including safety and integrity warnings. |
| **FR-008** | System shall render an interactive Neo4j-style traceability graph (SVG-based). |
| **FR-009** | System shall support staging and unstaging of individual changes for write-back. |
| **FR-010** | System shall push staged changes to IBM Jazz via OSLC RDF+XML integration. |
| **FR-011** | System shall trigger an n8n webhook upon a successful commit. |
| **FR-012** | System shall support manual requirement creation via a user interface dialog. |
| **FR-013** | System shall support database reset to factory defaults. |
| **FR-014** | System shall generate downloadable TXT safety compliance reports. |
| **FR-015** | System shall display the connection status for all integrations (Whisper, Jazz, Neo4j, n8n). |
| **FR-016** | System shall support configurable API endpoints via a settings panel. |
| **FR-017** | Graph nodes shall visually display ASIL rating badges. |
| **FR-018** | Impact-affected nodes in the graph shall be visually highlighted (e.g., amber for updates, green for additions). |
| **FR-019** | System shall display real-time OSLC XML transaction logs in the staging panel. |
| **FR-020** | System shall validate API key availability on application startup. |

## 5. Non-Functional Requirements
- **Performance**: LLM analysis via Gemini must complete within 30 seconds for a typical transcript.
- **Reliability**: The system must gracefully handle network failures or LLM timeouts without crashing the UI.
- **Security**: API keys must be securely stored as environment variables, with credential masking enforced in the UI configuration panel.
- **Usability**: The application must provide a single-page cockpit interface where no page navigation is required to complete the pipeline.
- **Compatibility**: Must support modern browsers (Chrome, Edge, Firefox, Safari) and feature a responsive layout.

## 6. Out of Scope (MVP)
- Real Whisper audio-to-text integration (currently simulated via text templates).
- Persistent database storage (currently uses in-memory data structures).
- Multi-user real-time collaboration.
- Real-time Neo4j graph database integration (currently relies on mocked stats).
- Authentication and authorization systems.
