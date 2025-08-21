import { useToast } from "@/hooks/use-toast";

interface ControlPanelProps {
  sessionId: string | null;
  automationStatus: 'idle' | 'running' | 'paused' | 'stopped' | 'completed';
  stats: { processed: number; remaining: number; total: number };
  progressPercentage: number;
  filesUploaded: { resume: boolean; connections: boolean };
  onStatusChange: (status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed') => void;
}

export default function ControlPanel({ 
  sessionId, 
  automationStatus, 
  stats, 
  progressPercentage, 
  filesUploaded,
  onStatusChange 
}: ControlPanelProps) {
  const { toast } = useToast();

  const canStart = sessionId && filesUploaded.resume && filesUploaded.connections && automationStatus === 'idle';
  const isRunning = automationStatus === 'running';
  const isPaused = automationStatus === 'paused';

  const handleStart = async () => {
    if (!canStart) {
      toast({
        title: "Cannot Start",
        description: "Please upload both resume and connections CSV files first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to start automation');

      onStatusChange('running');
      toast({
        title: "Automation Started",
        description: "LinkedIn automation has been started successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start automation",
        variant: "destructive"
      });
    }
  };

  const handlePause = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/pause`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to pause automation');

      onStatusChange('paused');
      toast({
        title: "Automation Paused",
        description: "LinkedIn automation has been paused"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause automation",
        variant: "destructive"
      });
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/resume`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to resume automation');

      onStatusChange('running');
      toast({
        title: "Automation Resumed",
        description: "LinkedIn automation has been resumed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume automation",
        variant: "destructive"
      });
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/stop`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to stop automation');

      onStatusChange('stopped');
      toast({
        title: "Automation Stopped",
        description: "LinkedIn automation has been stopped"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop automation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-play-circle text-blue-500 mr-2"></i>
        Automation Control
      </h2>
      
      <div className="space-y-3">
        {/* Start Button */}
        {automationStatus === 'idle' && (
          <button 
            className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
              canStart 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleStart}
            disabled={!canStart}
          >
            <i className="fas fa-play mr-2"></i>
            Start Automation
          </button>
        )}
        
        {/* Control Buttons (shown when running or paused) */}
        {(isRunning || isPaused) && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {isRunning && (
                <button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  onClick={handlePause}
                >
                  <i className="fas fa-pause mr-2"></i>
                  Pause
                </button>
              )}
              
              {isPaused && (
                <button 
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  onClick={handleResume}
                >
                  <i className="fas fa-play mr-2"></i>
                  Resume
                </button>
              )}
              
              <button 
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                onClick={handleStop}
              >
                <i className="fas fa-stop mr-2"></i>
                Stop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.processed}</div>
            <div className="text-sm text-gray-600">Processed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.remaining}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-1">Progress</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
