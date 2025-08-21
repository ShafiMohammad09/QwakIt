import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import FileUploadSection from "@/components/FileUploadSection";
import ConfigurationSection from "@/components/ConfigurationSection";
import ControlPanel from "@/components/ControlPanel";
import CurrentActionDisplay from "@/components/CurrentActionDisplay";
import BrowserSimulation from "@/components/BrowserSimulation";
import ActivityLog from "@/components/ActivityLog";

export default function Dashboard() {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [automationStatus, setAutomationStatus] = useState<'idle' | 'running' | 'paused' | 'stopped' | 'completed'>('idle');
  const [stats, setStats] = useState({ processed: 0, remaining: 0, total: 0 });
  const [currentConnection, setCurrentConnection] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [filesUploaded, setFilesUploaded] = useState({ resume: false, connections: false });

  const { isConnected, lastMessage } = useWebSocket(sessionId);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data } = lastMessage;

    switch (type) {
      case 'log':
        setActivityLogs(prev => [...prev, {
          id: Date.now(),
          type: data.type,
          title: data.title,
          description: data.description,
          timestamp: data.timestamp
        }]);
        break;
      
      case 'status_change':
        setAutomationStatus(data.status);
        break;
      
      case 'current_connection':
        setCurrentConnection(data);
        break;
      
      case 'message_generated':
        setGeneratedMessage(data.message);
        break;
      
      case 'countdown_start':
        setCountdownValue(data.duration);
        break;
      
      case 'countdown_tick':
        setCountdownValue(data.value);
        break;
      
      case 'progress_update':
        setStats(prev => ({
          ...prev,
          processed: data.processed,
          remaining: data.remaining
        }));
        break;
      
      case 'upload_complete':
        setFilesUploaded({
          resume: data.resumeUploaded,
          connections: data.connectionsCount > 0
        });
        setStats(prev => ({
          ...prev,
          total: data.connectionsCount,
          remaining: data.connectionsCount
        }));
        break;
    }
  }, [lastMessage]);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'idle',
            autoSendEnabled: true,
            countdownDuration: 5,
            connectionDelay: '2-6'
          })
        });
        
        if (!response.ok) throw new Error('Failed to create session');
        
        const session = await response.json();
        setSessionId(session.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize session",
          variant: "destructive"
        });
      }
    };

    initializeSession();
  }, [toast]);

  const progressPercentage = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fab fa-linkedin text-blue-600 text-2xl mr-3"></i>
              <h1 className="text-xl font-semibold text-gray-900">LinkedIn Automation Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'System Online' : 'System Offline'}
                </span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Configuration & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <FileUploadSection 
              sessionId={sessionId}
              filesUploaded={filesUploaded}
              onUploadComplete={() => {}} 
            />
            
            <ConfigurationSection 
              sessionId={sessionId}
              disabled={automationStatus === 'running'}
            />
            
            <ControlPanel
              sessionId={sessionId}
              automationStatus={automationStatus}
              stats={stats}
              progressPercentage={progressPercentage}
              filesUploaded={filesUploaded}
              onStatusChange={setAutomationStatus}
            />
          </div>

          {/* Right Panel - Monitoring & Browser Simulation */}
          <div className="lg:col-span-2 space-y-6">
            <CurrentActionDisplay
              automationStatus={automationStatus}
              currentConnection={currentConnection}
              generatedMessage={generatedMessage}
              countdownValue={countdownValue}
              sessionId={sessionId}
            />
            
            <BrowserSimulation
              currentConnection={currentConnection}
              generatedMessage={generatedMessage}
              showMessageModal={automationStatus === 'running' && generatedMessage !== ''}
            />
            
            <ActivityLog
              logs={activityLogs}
              onClearLogs={() => setActivityLogs([])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
