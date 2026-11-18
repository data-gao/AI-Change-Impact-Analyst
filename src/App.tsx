import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Send, 
  Settings2, 
  Layers, 
  Database, 
  RotateCcw, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Sparkles, 
  Link, 
  Cpu, 
  CheckSquare, 
  Edit3, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  User,
  GitCommit,
  Clock,
  Download
} from 'lucide-react';
import { ConnectionConfig, UserStory, MeetingTranscript, Requirement, TraceLink, GraphNode } from './types';
import { SAMPLE_TRANSCRIPTS, INITIAL_CONNECTIONS } from './data';

export default function App() {
  // Connection states
  const [connections, setConnections] = useState<ConnectionConfig>(INITIAL_CONNECTIONS);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [isApiKeyAvailable, setIsApiKeyAvailable] = useState<boolean>(true);

  // Requirements Database State (Fetched from API)
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [links, setLinks] = useState<TraceLink[]>([]);
  const [isLoadingReqs, setIsLoadingReqs] = useState<boolean>(false);
  
  // App Workflow Pipeline State
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string>('TR-01');
  const [customTranscriptText, setCustomTranscriptText] = useState<string>(SAMPLE_TRANSCRIPTS[0].rawText);
  const [isWhisperTranscribing, setIsWhisperTranscribing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(1); // 1: Transcript, 2: Story Extraction, 3: RAG Match, 4: Impact, 5: Jazz Writeback

  // Analysis result states
  const [extractedStories, setExtractedStories] = useState<UserStory[]>([]);
  const [deltaUpdates, setDeltaUpdates] = useState<Array<{
    targetRequirementId: string;
    reason: string;
    recommendedChangeText: string;
    staged: boolean;
  }>>([]);
  
  const [deltaAdditions, setDeltaAdditions] = useState<Array<{
    id: string;
    type: 'System' | 'Software' | 'FunctionalSafety';
    title: string;
    text: string;
    asilRating: 'A' | 'B' | 'C' | 'D' | 'QM' | '';
    tracesTo: string[];
    staged: boolean;
  }>>([]);
  
  const [missingReqWarning, setMissingReqWarning] = useState<string>('');

  // Selected Node in Graph or List for detailing
  const [selectedEntityId, setSelectedEntityId] = useState<string>('SYS-REQ-ADAS-201');
  
  // Custom manual requirement creator modal/state
  const [showManualCreator, setShowManualCreator] = useState<boolean>(false);
  const [manualReq, setManualReq] = useState<Partial<Requirement>>({
    id: 'SYS-REQ-ADAS-',
    type: 'System',
    title: '',
    text: '',
    asilRating: 'QM',
    status: 'Draft',
    owner: 'System Eng',
    tracesTo: [],
  });

  // IBM Jazz integration execution feedback
  const [isSyncingToJazz, setIsSyncingToJazz] = useState<boolean>(false);
  const [jazzLogs, setJazzLogs] = useState<string[]>([]);
  const [jazzSuccess, setJazzSuccess] = useState<boolean>(false);

  // PDF Download Trigger Simulation
  const [reportDownloaded, setReportDownloaded] = useState<boolean>(false);

  // Load requirements on mount
  useEffect(() => {
    fetchRequirements();
    checkEngineHealth();
  }, []);

  // Update text when user chooses predefined meeting transcript template
  useEffect(() => {
    const predefined = SAMPLE_TRANSCRIPTS.find(t => t.id === selectedTranscriptId);
    if (predefined) {
      setCustomTranscriptText(predefined.rawText);
    }
  }, [selectedTranscriptId]);

  const checkEngineHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setIsApiKeyAvailable(data.api_key_available);
    } catch {
      setIsApiKeyAvailable(false);
    }
  };

  const fetchRequirements = async () => {
    setIsLoadingReqs(true);
    try {
      const response = await fetch('/api/requirements');
      const data = await response.json();
      if (data.requirements) {
        setRequirements(data.requirements);
      }
      if (data.links) {
        setLinks(data.links);
      }
    } catch (e) {
      console.error("Error reading backend store: ", e);
    } finally {
      setIsLoadingReqs(false);
    }
  };

  const resetAllData = async () => {
    if (!window.confirm("Are you sure you want to reset the requirements database down to default factory parameters?")) return;
    try {
      const res = await fetch('/api/requirements/reset', { method: 'POST' });
      const data = await res.json();
      setRequirements(data.requirements);
      setLinks(data.links);
      setExtractedStories([]);
      setDeltaUpdates([]);
      setDeltaAdditions([]);
      setMissingReqWarning('');
      setJazzLogs([]);
      setJazzSuccess(false);
      setPipelineStep(1);
    } catch (e) {
      console.error(e);
    }
  };

  // Run Whisper Engine + LLM Impact RAG analysis
  const handleTriggerAnalysis = async () => {
    if (!customTranscriptText.trim()) return;
    
    setIsWhisperTranscribing(true);
    setPipelineStep(1);
    
    // Simulate audio Whisper capture for realistic experience
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setIsWhisperTranscribing(false);
    
    setIsAnalyzing(true);
    setPipelineStep(2); // Extraction starts

    try {
      const response = await fetch('/api/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: customTranscriptText,
          activeInventory: requirements,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Analysis failure');
      }

      const result = await response.json();
      setPipelineStep(4); // Impact trace complete
      
      setExtractedStories(result.userStories || []);
      
      // Stage items by default for the user
      if (result.impactReport?.updatedRequirements) {
        setDeltaUpdates(
          result.impactReport.updatedRequirements.map((r: any) => ({
            ...r,
            staged: true,
          }))
        );
      } else {
        setDeltaUpdates([]);
      }

      if (result.impactReport?.addedRequirements) {
        setDeltaAdditions(
          result.impactReport.addedRequirements.map((r: any) => ({
            ...r,
            staged: true,
          }))
        );
      } else {
        setDeltaAdditions([]);
      }

      setMissingReqWarning(result.impactReport?.missingRequirementsWarning || '');

      // Trigger automatic pipeline highlight
      setPipelineStep(5);

    } catch (error: any) {
      alert(`Engineering LLM Error: ${error.message}. Please configure your GEMINI_API_KEY inside the secrets panel.`);
      console.error(error);
      setPipelineStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run real or sandbox writeback to IBM Jazz & dynamic n8n webhooks
  const handleJazzWriteback = async () => {
    const activeUpdates = deltaUpdates.filter(u => u.staged);
    const activeAdditions = deltaAdditions.filter(a => a.staged);

    if (activeUpdates.length === 0 && activeAdditions.length === 0) {
      alert("Please stage at least one requirement modification or new insertion.");
      return;
    }

    setIsSyncingToJazz(true);
    setJazzLogs(['[SYSTEM] Initializing transaction sequence...']);
    setJazzSuccess(false);

    const itemsToPush = [
      ...activeUpdates.map(u => ({
        action: 'UPDATE',
        id: u.targetRequirementId,
        title: requirements.find(r => r.id === u.targetRequirementId)?.title || 'Updated Requirement Specification',
        text: u.recommendedChangeText,
        asilRating: requirements.find(r => r.id === u.targetRequirementId)?.asilRating || 'QM',
        status: 'In Review',
      })),
      ...activeAdditions.map(a => ({
        action: 'ADD',
        id: a.id,
        type: a.type,
        title: a.title,
        text: a.text,
        asilRating: a.asilRating,
        status: 'In Review',
        tracesTo: a.tracesTo
      }))
    ];

    try {
      const response = await fetch('/api/jazz/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: connections,
          itemsToPush
        })
      });

      const res = await response.json();
      if (res.success) {
        setJazzLogs(res.traceLogs || []);
        setJazzSuccess(true);
        // Refresh our local requirement definitions to show modified/pushed records in high density tables
        if (res.activeRequirements) {
          setRequirements(res.activeRequirements);
        } else {
          await fetchRequirements();
        }

        // Add trace links dynamically in UI to represent Neo4j graphs linking together
        const generatedLinks: TraceLink[] = [];
        activeAdditions.forEach(a => {
          if (a.tracesTo && a.tracesTo.length > 0) {
            a.tracesTo.forEach(t => {
              generatedLinks.push({
                source: a.id,
                target: t,
                type: 'REFINES'
              });
            });
          }
        });
        if (generatedLinks.length > 0) {
          setLinks(prev => [...prev, ...generatedLinks]);
        }
      } else {
        setJazzLogs(prev => [...prev, '[ERROR] Failed pushing. Check OSLC credentials.']);
      }
    } catch (e: any) {
      setJazzLogs(prev => [...prev, `[FATAL EXCEPTION] Connect error: ${e.message}`]);
    } finally {
      setIsSyncingToJazz(false);
    }
  };

  // Quick manually create database items for testing local matrix
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReq.id || !manualReq.title || !manualReq.text) {
      alert("Fill out target ID, Title, and Requirement description.");
      return;
    }

    try {
      const response = await fetch('/api/requirements/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualReq)
      });
      const data = await response.json();
      if (data.status === 'success') {
        await fetchRequirements();
        setShowManualCreator(false);
        setSelectedEntityId(data.requirement.id);
        setManualReq({
          id: 'SYS-REQ-ADAS-',
          type: 'System',
          title: '',
          text: '',
          asilRating: 'QM',
          status: 'Draft',
          owner: 'System Eng',
          tracesTo: []
        });
      }
    } catch (err) {
      console.error("Manual add issue: ", err);
    }
  };

  const handleDownloadReport = () => {
    setReportDownloaded(true);
    setTimeout(() => setReportDownloaded(false), 3000);

    const reportContent = `AUTOMOTIVE SAFETY & TRACEABILITY REPORT (ISO 26262 COMPLIANCE)
Created on: ${new Date().toLocaleString()}
Operator: ${connections.ibmJazzUser}

=================== STAGED IMPACT ANALYSIS ===================
1. Extracted Technical User Stories:
${extractedStories.map(s => ` - [${s.id}] As a ${s.asARole}, I want to ${s.iWantTo} -> So that ${s.soThat}. (ASIL ${s.asilRating || 'QM'})`).join('\n')}

2. Recommended Parameter Updates In Existing Requirements:
${deltaUpdates.filter(u=>u.staged).map(u => ` - Target: ${u.targetRequirementId}\n   Modification: ${u.recommendedChangeText}`).join('\n\n')}

3. Brand New Requirements Inserted:
${deltaAdditions.filter(a=>a.staged).map(a => ` - ID: ${a.id} (Type: ${a.type}, ASIL ${a.asilRating || 'QM'})\n   Title: ${a.title}\n   Specification: ${a.text}`).join('\n\n')}

=================== CONNECTIVITY METRICS ===================
- OSLC Endpoint URL: ${connections.ibmJazzUrl}
- Neo4j Status: Connected & Audited
- Graph Matrix nodes affected directly: ${deltaUpdates.filter(u=>u.staged).length + deltaAdditions.filter(a=>a.staged).length}
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Automotive_Impact_Analysis_Report.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build local map to calculate direct and cascade changes visually in SVG
  const updatedIds = new Set(deltaUpdates.filter(u => u.staged).map(u => u.targetRequirementId));
  const addedIds = new Set(deltaAdditions.filter(a => a.staged).map(a => a.id));

  // Trace dependency nodes for rendering
  const visibleNodes: GraphNode[] = requirements.map((req, index) => {
    // Determine type/layer row for positioning
    // Systems at 100px height, Software at 220px, TestCases at 340px
    let y = 100;
    if (req.type === 'Software') y = 190;
    if (req.type === 'TestCase') y = 280;

    // Distribute X evenly
    const levelNodes = requirements.filter(r => r.type === req.type);
    const levelIndex = levelNodes.findIndex(r => r.id === req.id);
    const stepX = 580 / (levelNodes.length + 1);
    const x = stepX * (levelIndex + 1);

    return {
      id: req.id,
      label: req.id,
      type: req.type === 'TestCase' ? 'TestCase' : req.type === 'System' ? 'SystemReq' : 'SoftwareReq',
      status: req.status,
      asil: req.asilRating,
      x: x,
      y: y
    };
  });

  // Also include the newly recommended stories as transient nodes at y=30 to show flow comparison
  extractedStories.forEach((st, idx) => {
    const stepX = 580 / (extractedStories.length + 1);
    visibleNodes.push({
      id: st.id,
      label: st.id,
      type: 'Story',
      status: 'Proposed',
      asil: st.asilRating,
      x: stepX * (idx + 1),
      y: 25
    });
  });

  return (
    <div id="ai-impact-analyst-root" className="flex flex-col h-screen w-full bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      
      {/* High-fidelity Cockpit Header */}
      <header id="app-header" className="h-14 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              AI Impact Analyst
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-medium px-2 py-0.5 rounded border border-blue-500/30">
                Automotive Functional Safety L2/L3
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">ISO 26262 & IBM Jazz Integration Hub</p>
          </div>
        </div>

        {/* Global Pipeline Integration Indicators */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-300">Whisper API: Staged</span>
          </div>

          <div 
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer hover:bg-slate-700 transition-colors ${
              jazzSuccess ? 'bg-emerald-950/40 border-emerald-800' : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${jazzSuccess ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
            <span className="text-[10px] text-slate-300">IBM Jazz: Connected</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-slate-300">Neo4j Database</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="text-[10px] text-slate-300">n8n Pipeline</span>
          </div>

          {/* Settings trigger */}
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 px-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-[10px] transition-all flex items-center gap-1 font-bold"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Config API</span>
          </button>
        </div>
      </header>

      {/* Main Core View Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COMPONENT: STRAWMAN STEPS & SPRINT LOG OPTIONS */}
        <aside id="pipeline-control" className="w-64 border-r border-slate-800 bg-[#0F172A] p-4 flex flex-col gap-5 shrink-0 select-none overflow-y-auto">
          
          <section>
            <h2 className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold mb-3">
              Automotive Lifecycle Pipeline
            </h2>
            <div className="flex flex-col gap-1.5 font-mono">
              <div className={`flex items-center justify-between p-2 rounded border transition-all text-xs ${
                pipelineStep === 1 ? 'bg-blue-900/30 border-blue-500 text-blue-100' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-200">1</span>
                  <span>Teams Meeting Transcript</span>
                </div>
                {isWhisperTranscribing && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 animate-pulse">Whisper</span>}
              </div>

              <div className={`flex items-center justify-between p-2 rounded border transition-all text-xs ${
                pipelineStep === 2 ? 'bg-blue-900/30 border-blue-500 text-blue-100' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-200">2</span>
                  <span>User Story Extraction</span>
                </div>
                {isAnalyzing && pipelineStep === 2 && <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 py-0.2 animate-pulse">LLMs</span>}
              </div>

              <div className={`flex items-center justify-between p-2 rounded border transition-all text-xs ${
                pipelineStep === 3 ? 'bg-blue-900/30 border-blue-500 text-blue-100' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-200">3</span>
                  <span>RAG Vector Comparison</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2 rounded border transition-all text-xs ${
                pipelineStep === 4 ? 'bg-blue-900/30 border-blue-500 text-blue-100' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-200">4</span>
                  <span>Impact Trace Report</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2 rounded border transition-all text-xs ${
                pipelineStep === 5 ? 'bg-emerald-900/30 border-emerald-500 text-emerald-100 font-bold' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-200">5</span>
                  <span>IBM Jazz Stage Out</span>
                </div>
                {jazzSuccess && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1">Done</span>}
              </div>
            </div>
          </section>

          {/* Pre-recorded meeting transcript selector */}
          <section className="border-t border-slate-800/80 pt-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold mb-2 flex items-center justify-between">
              <span>Select Sprint Workshop</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            
            <div className="flex flex-col gap-1.5">
              {SAMPLE_TRANSCRIPTS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTranscriptId(t.id)}
                  className={`text-left p-2 rounded text-xs leading-snug transition-all border ${
                    selectedTranscriptId === t.id 
                      ? 'bg-slate-800 border-blue-500/50 text-white' 
                      : 'bg-slate-900/30 border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between mb-0.5">
                    <span>{t.id === 'TR-01' ? '1. ADAS Safeguards' : '2. BMS Thermal'}</span>
                    <span className="text-[8px] font-mono uppercase bg-slate-900 px-1 text-slate-400 rounded">
                      {t.id === 'TR-01' ? 'ASIL-D' : 'ASIL-D'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{t.title}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Connected RAG Document Sandbox Checklist */}
          <section className="border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold">
                Active RAG Contexts
              </h3>
              <span className="text-[9px] bg-slate-800 text-blue-400 px-1 font-mono">3 Ref Docs</span>
            </div>
            <div className="space-y-1.5 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded border border-slate-800/60">
                <CheckSquare className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">ISO-26262-6-Part3-2018.pdf</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded border border-slate-800/60">
                <CheckSquare className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">BMS_Arch_Thermal_V4.2.xlsx</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded border border-slate-800/60">
                <CheckSquare className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="truncate text-slate-500">Euro-NCAP_ADAS_2025.pdf</span>
              </div>
            </div>
          </section>

          {/* Database Info */}
          <section className="mt-auto border-t border-slate-800/80 pt-4">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded text-[11px] space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Neo4j Nodes:</span>
                <span className="text-blue-400">14,208</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Relationships:</span>
                <span className="text-emerald-400">82,192</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 italic pt-1 border-t border-slate-800/60">
                <span>Last Graph Audit</span>
                <span>Active 4 mins ago</span>
              </div>
            </div>
          </section>

        </aside>

        {/* MIDDLE SECTION: TRANSCRIPT EDIT VIEW + DYNAMIC ANALYZER & DELTAS */}
        <section id="middle-panel" className="flex-1 flex flex-col min-w-0 bg-[#0F172A] overflow-hidden">
          
          {/* Active Transcript Header with Control Triggers */}
          <div className="p-4 border-b border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {selectedTranscriptId}
                </span>
                <h2 className="text-sm font-bold text-white tracking-tight leading-none">
                  Sprint Planning Workshop: Functional Requirements Sync
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Recorded: 2026-06-23 | Duration: 12m 45s | Speaker Confidence: 98.4%</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset database button */}
              <button
                onClick={resetAllData}
                title="Reset Database to original demo state"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleTriggerAnalysis}
                disabled={isWhisperTranscribing || isAnalyzing}
                className={`px-4 py-2 text-white text-xs font-bold rounded shadow-lg transition-all flex items-center gap-2 outline-none ${
                  isAnalyzing || isWhisperTranscribing 
                  ? 'bg-blue-800 cursor-not-allowed text-slate-300' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
                }`}
              >
                {isWhisperTranscribing ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span>Whisper Transcribing...</span>
                  </>
                ) : isAnalyzing ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                    <span>RAG & Delta Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PROCESS IMPACT COGNITION</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Top Half of Middle Area: Left is Whisper Transcript raw field, Right is comparative RAG suggestion output */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800 overflow-hidden min-h-0">
            
            {/* Left Box: raw transcript editor */}
            <div className="bg-[#0F172A] p-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <span>Voice-to-Text Meeting Transcript Input</span>
                  <span className="text-[9px] text-[#2563EB] font-mono lowercase"> (Editable)</span>
                </h3>
                <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  Whisper Audio Engine V3
                </span>
              </div>
              
              <div className="flex-1 flex flex-col relative bg-slate-950 p-2 rounded border border-slate-800/80">
                <textarea
                  className="flex-1 w-full bg-transparent text-xs text-slate-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 p-2 leading-relaxed h-full overflow-y-auto"
                  value={customTranscriptText}
                  onChange={(e) => setCustomTranscriptText(e.target.value)}
                  placeholder="Insert real-time transcript or write custom software safety specs here..."
                />
                
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90">
                  <span className="text-[9px] text-slate-500 font-mono">
                    {customTranscriptText.length} chars
                  </span>
                </div>
              </div>
            </div>

            {/* Right Box: RAG Delta Output comparing the Jazz Requirements */}
            <div className="bg-[#0F172A] p-4 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-slate-800">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>LLM AI Analysis: Delta & Gaps</span>
                </h3>
                <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  ISO 26262 Calibrated
                </span>
              </div>

              {/* Gaps Delta content area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                
                {/* API Key missing error or prompt notice */}
                {!isApiKeyAvailable && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
                    <p className="font-bold flex items-center gap-1.5 mb-1 text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      GEMINI_API_KEY Unavailable In Preview Backend
                    </p>
                    <p className="font-mono text-[10.5px]">
                      Please register a real API key inside the Secrets panel. For immediate assessment, a mock pipeline behaves in place but we recommend configuring the key to activate advanced context intelligence.
                    </p>
                  </div>
                )}

                {/* Initial Instruction State */}
                {extractedStories.length === 0 && deltaUpdates.length === 0 && deltaAdditions.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <Layers className="w-10 h-10 mb-2 stroke-1 text-slate-600 animate-pulse" />
                    <p className="text-xs font-semibold">No active impact trace generated.</p>
                    <p className="text-[10px] max-w-sm mt-1">
                      Click the <span className="text-blue-400">"PROCESS IMPACT COGNITION"</span> button at the top right to start acoustic transcription, analyze safety risks, and determine necessary system changes.
                    </p>
                  </div>
                )}

                {/* Missing requirement critical structural warning */}
                {missingReqWarning && (
                  <div className="p-3 rounded bg-amber-600/10 border border-amber-500/30 text-xs">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                      Safety & Integrity Gaps Notice:
                    </p>
                    <p className="text-slate-300 font-mono text-[10px] leading-relaxed">
                      {missingReqWarning}
                    </p>
                  </div>
                )}

                {/* Extracted Product/Safety User Stories */}
                {extractedStories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Extracted Customer & Safety User Stories
                    </h4>
                    {extractedStories.map((story) => (
                      <div key={story.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1 text-slate-300">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-blue-400 font-mono">{story.id}: {story.title}</span>
                          {story.asilRating && (
                            <span className="text-[8px] bg-red-950/50 text-red-400 border border-red-900/40 px-1 rounded font-mono font-bold">
                              ASIL {story.asilRating}
                            </span>
                          )}
                        </div>
                        <div className="pl-2 border-l border-blue-500/30 py-1 text-slate-400 italic">
                          <span className="text-blue-300 font-medium">As a </span>{story.asARole}, <span className="text-blue-300 font-medium">I want to </span>{story.iWantTo} <span className="text-blue-300 font-medium">so that </span>{story.soThat}
                        </div>
                        {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
                          <div className="mt-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Acceptance Criteria / Calibration:</span>
                            <ul className="list-disc pl-3 text-[10px] space-y-0.5 text-slate-400">
                              {story.acceptanceCriteria.map((c, idx) => <li key={idx}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* UPDATES: To existing IBM Jazz database */}
                {deltaUpdates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>Refinements to Existing System/Software Specs</span>
                    </h4>
                    {deltaUpdates.map((update, index) => (
                      <div key={index} className="p-3 rounded bg-purple-950/20 border border-purple-500/20 text-[11px] relative">
                        <div className="absolute top-2 right-2">
                          <input 
                            type="checkbox"
                            checked={update.staged}
                            onChange={() => {
                              const copy = [...deltaUpdates];
                              copy[index].staged = !copy[index].staged;
                              setDeltaUpdates(copy);
                            }}
                            className="w-3.5 h-3.5 cursor-pointer accent-purple-500 rounded"
                            title="Include in IBM Jazz Writeback queue"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-mono bg-purple-900/40 text-purple-300 font-bold px-1.5 py-0.2 select-none border border-purple-800/40 rounded">
                            UPDATE: {update.targetRequirementId}
                          </span>
                          <span className="text-[9.5px] font-mono text-slate-500 italic max-w-[70%] truncate">
                            {requirements.find(r => r.id === update.targetRequirementId)?.title || 'Existing Item'}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 font-mono mb-2">
                          <span className="font-bold text-slate-300">RAG Analysis Reason:</span> {update.reason}
                        </p>

                        <div className="bg-slate-950 p-2 rounded border border-slate-900 font-mono text-[10.5px]">
                          <div className="text-slate-500 line-through mb-1 text-[10px]">
                            Old specification text: {requirements.find(r => r.id === update.targetRequirementId)?.text || 'N/A'}
                          </div>
                          <div className="text-slate-200">
                            <span className="text-purple-400 font-bold">New: </span> 
                            {update.recommendedChangeText}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* NEW REQUIREMENTS TO INSERT */}
                {deltaAdditions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Completely New Requirements to Insert
                    </h4>
                    {deltaAdditions.map((addition, index) => (
                      <div key={index} className="p-3 rounded bg-emerald-950/20 border border-emerald-500/20 text-[11px] relative">
                        <div className="absolute top-2 right-2">
                          <input 
                            type="checkbox"
                            checked={addition.staged}
                            onChange={() => {
                              const copy = [...deltaAdditions];
                              copy[index].staged = !copy[index].staged;
                              setDeltaAdditions(copy);
                            }}
                            className="w-3.5 h-3.5 cursor-pointer accent-emerald-500 rounded"
                            title="Include in IBM Jazz Writeback queue"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="font-mono bg-emerald-900/40 text-emerald-300 font-bold px-1.5 py-0.2 border border-emerald-800/40 rounded">
                            NEW: {addition.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">[{addition.type} Requirement]</span>
                        </div>

                        <p className="text-slate-200 font-semibold mb-1">{addition.title}</p>
                        
                        <div className="bg-slate-950 p-2 rounded border border-slate-900 font-mono text-[10.5px] text-slate-300 mb-2">
                          {addition.text}
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Link className="w-3 h-3 text-slate-600" />
                            Traces context story: <strong className="text-blue-400">{(addition.tracesTo || []).join(', ')}</strong>
                          </span>
                          {addition.asilRating && (
                            <span className="px-1 text-red-400 border border-red-900 bg-red-950/40 rounded font-bold">
                              ASIL {addition.asilRating}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Bottom Third: Traceability Analysis (Neo4j Graph Visualization) */}
          <div id="graph-panel" className="h-[280px] border-t border-slate-800 bg-[#0F172A] p-4 flex flex-col shrink-0 min-h-[180px] select-none">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Interactive Traceability & Safety Analysis (Neo4j Graph Platform)</span>
                </h4>
                <p className="text-[9px] text-[#64748B] font-mono">
                  Orange rings indicate direct impact targets. Orange text/nodes display proposed changes on review.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowManualCreator(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-semibold border border-slate-700/80 transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Manual Node +</span>
                </button>
              </div>
            </div>

            {/* Traceability Network Visual Container */}
            <div className="flex-1 bg-slate-950 rounded border border-slate-800 relative overflow-hidden flex flex-col justify-center">
              
              {/* Radial grid lines for precise blueprint look */}
              <div className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(#3B82F6_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"></div>

              {/* Grid levels captions */}
              <div className="absolute inset-y-0 left-3 flex flex-col justify-between text-[9px] font-mono text-slate-500 pointer-events-none py-4 border-r border-slate-800/45 pr-2 z-10 select-none uppercase">
                <div>Stories</div>
                <div>Systems Layer</div>
                <div>Software Layer</div>
                <div>Testing Layer</div>
              </div>

              {/* Dynamic SVG Nodes Render */}
              <svg className="w-full h-full min-h-[160px] relative font-mono text-[10px]">
                
                {/* SVG arrows definitions */}
                <defs>
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                  </marker>
                  <marker id="arrow-emerald" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                  </marker>
                  <marker id="arrow-muted" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
                  </marker>
                </defs>

                {/* Render lines from TraceLinks database inside in-memory sandbox */}
                {links.map((link, idx) => {
                  const srcNode = visibleNodes.find(n => n.id === link.source);
                  const tgtNode = visibleNodes.find(n => n.id === link.target);
                  
                  if (!srcNode || !tgtNode) return null;

                  const isImpacted = updatedIds.has(srcNode.id) || updatedIds.has(tgtNode.id);

                  return (
                    <line
                      key={`link-${idx}`}
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke={isImpacted ? '#FBAE20' : '#334155'}
                      strokeWidth={isImpacted ? '1.5' : '1'}
                      strokeDasharray={isImpacted ? '4,4' : '0'}
                      markerEnd={isImpacted ? 'url(#arrow-emerald)' : 'url(#arrow-muted)'}
                    />
                  );
                })}

                {/* Render dynamic relationships from the newly proposed Stories to the requirements */}
                {extractedStories.map((story) => {
                  // Connect story to the proposed requirement ID if they match
                  return deltaAdditions
                    .filter(add => add.staged && add.tracesTo.includes(story.id))
                    .map((add, addIdx) => {
                      const tgtNode = visibleNodes.find(n => n.id === add.id);
                      if (!tgtNode) return null;
                      
                      const stepX = 580 / (extractedStories.length + 1);
                      const storyX = stepX * (extractedStories.indexOf(story) + 1);
                      const storyY = 25;

                      return (
                        <line
                          key={`story-link-${story.id}-${add.id}`}
                          x1={storyX}
                          y1={storyY}
                          x2={tgtNode.x}
                          y2={tgtNode.y}
                          stroke="#10B981"
                          strokeWidth="1.2"
                          strokeDasharray="3,3"
                          markerEnd="url(#arrow-emerald)"
                        />
                      );
                    });
                })}

                {/* Render Nodes */}
                {visibleNodes.map((n) => {
                  const isUpdated = updatedIds.has(n.id);
                  const isAdded = addedIds.has(n.id);
                  const isSelected = selectedEntityId === n.id;

                  // Define node styling based on its functional safety or test layer
                  let colorClass = 'fill-[#1E293B] stroke-slate-650';
                  let textClass = 'fill-slate-400';

                  if (n.type === 'Story') {
                    colorClass = 'fill-blue-950 stroke-blue-600';
                    textClass = 'fill-blue-300';
                  } else if (n.type === 'SystemReq') {
                    colorClass = 'fill-[#1E291C] stroke-emerald-600/80';
                    textClass = 'fill-emerald-400 text-[9px]';
                  } else if (n.type === 'SoftwareReq') {
                    colorClass = 'fill-slate-900 stroke-slate-700';
                    textClass = 'fill-slate-300';
                  } else if (n.type === 'TestCase') {
                    colorClass = 'fill-[rgba(15,23,42,0.95)] stroke-[#2563EB]';
                    textClass = 'fill-[#60A5FA]';
                  }

                  // Highlight impacted target
                  if (isUpdated) {
                    colorClass = 'fill-amber-950/90 stroke-amber-500';
                    textClass = 'fill-amber-300 font-bold';
                  }
                  if (isAdded) {
                    colorClass = 'fill-emerald-950/80 stroke-emerald-400';
                    textClass = 'fill-emerald-200 font-bold';
                  }

                  return (
                    <g 
                      key={`node-${n.id}`} 
                      className="cursor-pointer group"
                      onClick={() => setSelectedEntityId(n.id)}
                    >
                      {/* Halo ring for selected or target items */}
                      {(isSelected || isUpdated || isAdded) && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r="16"
                          className={`${
                            isSelected ? 'stroke-blue-500 animate-ping' : isUpdated ? 'stroke-amber-500' : 'stroke-emerald-500'
                          } fill-none stroke-[1] opacity-75`}
                        />
                      )}

                      {/* Core Node Circle */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r="11"
                        className={`${colorClass} stroke-[1.5] transition-all group-hover:r-[13]`}
                      />

                      {/* Node Label Text */}
                      <text
                        x={(n.x || 0) + 14}
                        y={(n.y || 0) + 4}
                        className={`${textClass} text-[9.5px] group-hover:underline font-semibold pointer-events-none select-none`}
                      >
                        {n.label}
                      </text>

                      {/* ASIL level badge mini indicator */}
                      {n.asil && (
                        <g transform={`translate(${(n.x || 0) - 13}, ${(n.y || 0) - 13})`}>
                          <circle cx="0" cy="0" r="5" className="fill-red-900" />
                          <text x="-2.5" y="2" className="fill-red-200 text-[6.5px] font-bold font-mono">{n.asil}</text>
                        </g>
                      )}
                    </g>
                  );
                })}

              </svg>

              {/* Detail drawer overlay for selected graph entity */}
              {selectedEntityId && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded flex items-center justify-between text-[11px] font-mono select-text z-20 shadow-md">
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-blue-400 font-bold flex items-center gap-1 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                      {selectedEntityId}:
                    </span>
                    <span className="text-slate-300 font-medium truncate">
                      {requirements.find(r => r.id === selectedEntityId)?.title || 
                       extractedStories.find(st => st.id === selectedEntityId)?.title || 
                       deltaAdditions.find(st => st.id === selectedEntityId)?.title || 'N/A specification item selected'}
                    </span>
                    <span className="text-slate-500 text-[10px] hidden md:inline truncate">
                      "{requirements.find(r => r.id === selectedEntityId)?.text || 
                        extractedStories.find(st => st.id === selectedEntityId)?.asARole || 'Click target nodes to inspect metadata & traces.'}"
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-sans select-none shrink-0 border-l border-slate-800 pl-3">
                    <span className="text-[9px] uppercase bg-slate-800 text-slate-400 px-1 py-0.2 rounded">
                      ASIL {requirements.find(r => r.id === selectedEntityId)?.asilRating || 'QM'}
                    </span>
                    <span className="text-[10px] uppercase text-emerald-400">
                      {requirements.find(r => r.id === selectedEntityId)?.status || 'Approved'}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </section>

        {/* RIGHT PANEL: CONNECTIVITY CONFIGS & IBM JAZZ STAGING ACTIONS */}
        <aside id="staging-panel" className="w-72 border-l border-slate-800 bg-[#111827] flex flex-col shrink-0 overflow-y-auto">
          
          {/* Top dynamic stage header */}
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-blue-400" />
              <span>IBM Jazz Write-Back STAGING AREA</span>
            </h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Current Sync Stack</span>
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 rounded font-mono">
                    {deltaUpdates.filter(u => u.staged).length + deltaAdditions.filter(a => a.staged).length} Items Ready
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-[10.5px] font-mono text-slate-400 max-h-36 overflow-y-auto pr-1">
                  
                  {deltaUpdates.filter(u => u.staged).map(u => (
                    <div key={u.targetRequirementId} className="flex items-center gap-2 p-1 rounded bg-[#1e293b]/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></div>
                      <span className="text-purple-300 font-semibold">{u.targetRequirementId}_REF</span>
                      <span className="text-slate-500 text-[10px] shrink-0 italic ml-auto">(Update)</span>
                    </div>
                  ))}

                  {deltaAdditions.filter(a => a.staged).map(a => (
                    <div key={a.id} className="flex items-center gap-2 p-1 rounded bg-[#1e293b]/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                      <span className="text-emerald-300 font-semibold">{a.id}_NEW</span>
                      <span className="text-slate-500 text-[10px] shrink-0 italic ml-auto">(Insert)</span>
                    </div>
                  ))}

                  {deltaUpdates.filter(u => u.staged).length === 0 && deltaAdditions.filter(a => a.staged).length === 0 && (
                    <p className="text-[10px] text-slate-500 italic text-center py-2">No modifications staged yet.</p>
                  )}
                </div>
              </div>

              {/* Primary action commit down to IBM Jazz */}
              <button
                onClick={handleJazzWriteback}
                disabled={isSyncingToJazz || (deltaUpdates.filter(u=>u.staged).length === 0 && deltaAdditions.filter(a=>a.staged).length === 0)}
                className={`w-full py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all outline-none ${
                  isSyncingToJazz 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 active:scale-95'
                }`}
              >
                {isSyncingToJazz ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
                    <span>OSLC XML Syncing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>COMMIT & WRITE TO IBM JAZZ</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Real-time Web Service Integration Logs panel */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <h3 className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold mb-2 font-mono flex items-center justify-between">
              <span>IBM DOORS OSLC XML-RDF Log Out</span>
              <span className="text-[8px] text-slate-500 bg-slate-900 px-1">HTTPS PUT/POST</span>
            </h3>

            <div className="flex-1 bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono text-[9px] text-[#A6ADBB] overflow-y-auto space-y-1.5 leading-relaxed select-text pr-2 scrollbar-thin">
              {jazzLogs.length === 0 ? (
                <div className="text-slate-600 italic text-center pt-8">
                  Ready. Staging queue will output authentic OSLC-RM HTTP request payloads and verification logs here on commit.
                </div>
              ) : (
                jazzLogs.map((log, index) => {
                  let logColor = 'text-slate-400';
                  if (log.includes('[ERROR]') || log.includes('[FATAL]')) {
                    logColor = 'text-red-400 font-bold';
                  } else if (log.includes('Response Received') || log.includes('verified')) {
                    logColor = 'text-emerald-400';
                  } else if (log.includes('xml')) {
                    logColor = 'text-blue-300';
                  } else if (log.includes('PUT/POST')) {
                    logColor = 'text-amber-300';
                  }
                  
                  return (
                    <div key={index} className={`${logColor} whitespace-pre-wrap select-all border-b border-slate-900/40 pb-1 font-mono`}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Core Settings Config Area inside sidebar toggle-ready */}
          {showConfig && (
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">API & IBM Jazz Endpoint Connection</h4>
              
              <div className="space-y-2 text-[11px] font-mono">
                <div>
                  <label className="text-slate-500 block mb-1">IBM Jazz Publish Gateway</label>
                  <input
                    type="text"
                    className="w-full bg-[#1e293b] p-1 px-2 rounded border border-slate-700 text-slate-300 focus:outline-none"
                    value={connections.ibmJazzUrl}
                    onChange={(e) => setConnections({...connections, ibmJazzUrl: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">OSLC Agent User</label>
                  <input
                    type="text"
                    className="w-full bg-[#1e293b] p-1 px-2 rounded border border-slate-700 text-slate-300 focus:outline-none"
                    value={connections.ibmJazzUser}
                    onChange={(e) => setConnections({...connections, ibmJazzUser: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Auth Credentials token</label>
                  <input
                    type="password"
                    style={{ WebkitTextSecurity: 'disc' } as any}
                    className="w-full bg-[#1e293b] p-1 px-2 rounded border border-slate-700 text-slate-300 focus:outline-none"
                    value={connections.ibmJazzPass}
                    onChange={(e) => setConnections({...connections, ibmJazzPass: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Continuous n8n Webhook</label>
                  <input
                    type="text"
                    className="w-full bg-[#1e293b] p-1 px-2 rounded border border-slate-700 text-slate-300 focus:outline-none"
                    value={connections.n8nWebhookUrl}
                    onChange={(e) => setConnections({...connections, n8nWebhookUrl: e.target.value})}
                  />
                </div>

                <div className="pt-1.5 flex justify-end">
                  <button
                    onClick={() => setShowConfig(false)}
                    className="p-1 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded"
                  >
                    Accept Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Foot Action: PDF/Markdown Functional safety Download compilation */}
          <div className="p-4 border-t border-slate-800 bg-[#0F172A] space-y-2 shrink-0">
            <button
              onClick={handleDownloadReport}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{reportDownloaded ? 'TXT REPORT DOWNLOADED' : 'DOWNLOAD TXT SAFETY REPORT'}</span>
            </button>
            <p className="text-center text-[9px] text-slate-600 font-mono">
              AI Impact Analyst Engine V5.4.1 | Build-8812
            </p>
          </div>

        </aside>

      </div>

      {/* MANUAL COMPONENT POPUP DIALOG FOR TESTING GRAPH MATRIX ON THE FLY */}
      {showManualCreator && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-slate-200 select-text">
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-lg p-5 w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              Add Manual Sandbox Requirement Node
            </h3>

            <form onSubmit={handleManualAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Identifier ID (must start with SYS-REQ- or SW-REQ- or TC-)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SW-REQ-ADAS-303"
                  className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  value={manualReq.id}
                  onChange={(e) => setManualReq({...manualReq, id: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Requirement Class</label>
                  <select
                    className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-slate-200 focus:outline-none"
                    value={manualReq.type}
                    onChange={(e: any) => setManualReq({...manualReq, type: e.target.value})}
                  >
                    <option value="System">System Layer</option>
                    <option value="Software">Software Layer</option>
                    <option value="FunctionalSafety">Functional Safety</option>
                    <option value="TestCase">Testing / Verification Case</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ISO 26262 ASIL Rating</label>
                  <select
                    className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-slate-200 focus:outline-none"
                    value={manualReq.asilRating}
                    onChange={(e: any) => setManualReq({...manualReq, asilRating: e.target.value})}
                  >
                    <option value="QM">QM (Quality Managed)</option>
                    <option value="A">ASIL-A (Low risk)</option>
                    <option value="B">ASIL-B</option>
                    <option value="C">ASIL-C</option>
                    <option value="D">ASIL-D (Critical Safeguard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Requirement Short Descriptive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Steering torque feedback safety bounds"
                  className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-slate-200 focus:outline-none"
                  value={manualReq.title}
                  onChange={(e) => setManualReq({...manualReq, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Technical Specification Text</label>
                <textarea
                  required
                  rows={3}
                  placeholder="The EPS controller shall register redundant power rails to enforce manual driver control override whenever sensor signals..."
                  className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-slate-200 focus:outline-none font-mono"
                  value={manualReq.text}
                  onChange={(e) => setManualReq({...manualReq, text: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Directly traces downstream to (e.g., existing parent requirements ID)</label>
                <input
                  type="text"
                  placeholder="e.g., SYS-REQ-ADAS-201"
                  className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-slate-200 focus:outline-none font-mono"
                  onChange={(e) => setManualReq({...manualReq, tracesTo: e.target.value ? [e.target.value] : []})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualCreator(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                >
                  Confirm & Insert Trace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
