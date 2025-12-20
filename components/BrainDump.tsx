import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Zap, X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Task, Project, EnergyLevel } from '../types';

interface BrainDumpProps {
  onClose: () => void;
  onTasksGenerated: (tasks: Partial<Task>[]) => void;
  projects: Project[];
  mode: 'workday' | 'planner';
  selectedDay?: number; // For planner mode
}

interface GeneratedTask {
  title: string;
  description?: string;
  energyRequired: EnergyLevel;
  projectId?: string;
  dueDate?: string;
}

const BrainDump: React.FC<BrainDumpProps> = ({ onClose, onTasksGenerated, projects, mode, selectedDay }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        setTranscript(prev => prev + finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setError(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const parseTranscriptToTasks = (text: string): GeneratedTask[] => {
    const tasks: GeneratedTask[] = [];

    // Split by common task indicators
    const sentences = text.split(/[.!?;]|(?:and then|also|next|after that)/i).filter(s => s.trim());

    // Keywords for energy level detection
    const highEnergyKeywords = ['complex', 'difficult', 'challenging', 'deep', 'important', 'critical', 'focus', 'concentrate'];
    const lowEnergyKeywords = ['simple', 'easy', 'quick', 'basic', 'straightforward', 'simple'];

    // Task action verbs
    const taskVerbs = ['write', 'create', 'build', 'design', 'implement', 'fix', 'update', 'review', 'plan', 'prepare', 'finish', 'complete', 'send', 'call', 'email', 'meet', 'discuss', 'analyze', 'research'];

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      // Check if sentence contains task-like content
      const hasTaskVerb = taskVerbs.some(verb => trimmed.toLowerCase().includes(verb));

      if (hasTaskVerb || trimmed.length > 10) {
        // Determine energy level based on keywords
        let energyRequired: EnergyLevel = 'Medium';
        const lowerSentence = trimmed.toLowerCase();

        if (highEnergyKeywords.some(keyword => lowerSentence.includes(keyword))) {
          energyRequired = 'High';
        } else if (lowEnergyKeywords.some(keyword => lowerSentence.includes(keyword))) {
          energyRequired = 'Low';
        }

        // Match with projects based on keywords
        let matchedProjectId: string | undefined;
        projects.forEach(project => {
          if (lowerSentence.includes(project.name.toLowerCase())) {
            matchedProjectId = project.id;
          }
        });

        // Extract due dates
        let dueDate: string | undefined;
        const today = new Date();

        if (mode === 'planner' && selectedDay !== undefined) {
          // For planner mode, use the selected day
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + (selectedDay - today.getDay()));
          dueDate = targetDate.toISOString().split('T')[0];
        } else {
          // Check for time indicators in the text
          if (/today|now/i.test(lowerSentence)) {
            dueDate = today.toISOString().split('T')[0];
          } else if (/tomorrow/i.test(lowerSentence)) {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            dueDate = tomorrow.toISOString().split('T')[0];
          } else if (/next week|upcoming/i.test(lowerSentence)) {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            dueDate = nextWeek.toISOString().split('T')[0];
          }
        }

        // Clean up the title
        const title = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

        tasks.push({
          title: title.length > 100 ? title.substring(0, 100) + '...' : title,
          energyRequired,
          projectId: matchedProjectId,
          dueDate,
        });
      }
    });

    return tasks;
  };

  const handleGenerateTasks = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Parse the transcript into tasks
      const tasks = parseTranscriptToTasks(transcript);

      if (tasks.length === 0) {
        setError('No tasks detected. Try being more specific with action verbs like "write", "create", "build", etc.');
        setIsProcessing(false);
        return;
      }

      // Simulate AI processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGeneratedTasks(tasks);
    } catch (err) {
      setError('Failed to generate tasks. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTasks = () => {
    onTasksGenerated(generatedTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pilot-orange/10 border border-pilot-orange/20 rounded-lg">
              <Sparkles size={20} className="text-pilot-orange" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Brain Dump</h3>
              <p className="text-xs text-white/40 mt-0.5">
                {mode === 'planner' ? 'Speak to plan your week' : 'Speak your mind, AI creates tasks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} className="text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Microphone Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-2xl shadow-red-500/30'
                  : 'bg-pilot-orange hover:bg-pilot-orange/90 shadow-xl shadow-pilot-orange/20'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
            >
              {isListening ? (
                <MicOff size={32} className="text-white" />
              ) : (
                <Mic size={32} className="text-white" />
              )}
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              )}
            </button>
            <p className="text-sm font-bold text-white/60 uppercase tracking-wider">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                Transcript
              </label>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-sm text-white/70 leading-relaxed">{transcript}</p>
              </div>

              {!generatedTasks.length && (
                <button
                  onClick={handleGenerateTasks}
                  disabled={isProcessing}
                  className="w-full py-3 bg-pilot-orange hover:bg-pilot-orange/90 rounded-lg text-sm font-bold text-white uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating Tasks...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Generate Tasks
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Generated Tasks Preview */}
          {generatedTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Generated Tasks ({generatedTasks.length})
                </label>
                <button
                  onClick={() => setGeneratedTasks([])}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-2">
                {generatedTasks.map((task, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-pilot-orange/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white/80">{task.title}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                            task.energyRequired === 'High' ? 'bg-red-500/20 text-red-400' :
                            task.energyRequired === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {task.energyRequired}
                          </span>
                          {task.projectId && (
                            <span className="text-[10px] font-bold text-white/40">
                              {projects.find(p => p.id === task.projectId)?.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[10px] font-bold text-white/40">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 size={18} className="text-pilot-orange shrink-0" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddTasks}
                className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-bold text-white uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Add {generatedTasks.length} Task{generatedTasks.length !== 1 ? 's' : ''} to {mode === 'planner' ? 'Planner' : 'Workday'}
              </button>
            </div>
          )}

          {/* Instructions */}
          {!transcript && !isListening && (
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <h4 className="text-xs font-black text-white/60 uppercase tracking-wider mb-3">How it works</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li className="flex items-start gap-2">
                  <span className="text-pilot-orange mt-0.5">•</span>
                  <span>Tap the microphone and speak naturally about what you want to accomplish</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pilot-orange mt-0.5">•</span>
                  <span>Use action verbs like "write", "create", "build", "fix", "update"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pilot-orange mt-0.5">•</span>
                  <span>Mention project names to auto-assign tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pilot-orange mt-0.5">•</span>
                  <span>Say "today", "tomorrow", or "next week" to set due dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pilot-orange mt-0.5">•</span>
                  <span>AI detects task complexity and assigns energy levels</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrainDump;
