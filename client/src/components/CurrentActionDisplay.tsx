interface CurrentActionDisplayProps {
  automationStatus: 'idle' | 'running' | 'paused' | 'stopped' | 'completed';
  currentConnection: any;
  generatedMessage: string;
  countdownValue: number;
  sessionId: string | null;
}

export default function CurrentActionDisplay({ 
  automationStatus, 
  currentConnection, 
  generatedMessage, 
  countdownValue,
  sessionId 
}: CurrentActionDisplayProps) {
  
  const isIdle = automationStatus === 'idle';
  const isActive = automationStatus === 'running' && currentConnection;
  const showCountdown = countdownValue > 0;

  const handleCancelSend = async () => {
    if (!sessionId) return;
    
    try {
      await fetch(`/api/sessions/${sessionId}/pause`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to cancel send:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-eye text-blue-500 mr-2"></i>
        Current Action
      </h2>
      
      {/* Idle State */}
      {isIdle && (
        <div className="text-center py-8">
          <i className="fas fa-clock text-gray-400 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900">Ready to Start</h3>
          <p className="text-gray-600">Upload your files and click "Start Automation" to begin</p>
        </div>
      )}

      {/* Active Processing State */}
      {isActive && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <i className="fas fa-user text-blue-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{currentConnection.name}</h3>
                <p className="text-sm text-gray-600">{currentConnection.position}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Connection Processing</div>
              <div className="text-xs text-gray-400">{currentConnection.url}</div>
            </div>
          </div>

          {/* Current Step */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-spinner fa-spin text-white text-xs"></i>
              </div>
              <span className="text-blue-800 font-medium">
                {generatedMessage ? 'Message generated' : 'Generating personalized message...'}
              </span>
            </div>
          </div>

          {/* Message Preview */}
          {generatedMessage && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Generated Message Preview</h4>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {generatedMessage}
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {showCountdown && (
            <div className="flex items-center justify-center space-x-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none"/>
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    stroke="#3b82f6" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="176" 
                    strokeDashoffset={176 - (countdownValue / 5) * 176}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">{countdownValue}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">Auto-sending in</div>
                <div className="text-xs text-gray-600">Click to cancel or edit message</div>
              </div>
              <button 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                onClick={handleCancelSend}
              >
                Cancel Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paused State */}
      {automationStatus === 'paused' && (
        <div className="text-center py-8">
          <i className="fas fa-pause-circle text-yellow-400 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900">Automation Paused</h3>
          <p className="text-gray-600">Click Resume to continue processing connections</p>
        </div>
      )}

      {/* Completed State */}
      {automationStatus === 'completed' && (
        <div className="text-center py-8">
          <i className="fas fa-check-circle text-green-400 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900">Automation Complete</h3>
          <p className="text-gray-600">All connections have been processed successfully</p>
        </div>
      )}
    </div>
  );
}
