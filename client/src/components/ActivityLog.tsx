import { useRef, useEffect } from "react";

interface ActivityLogProps {
  logs: Array<{
    id: number;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    description: string;
    timestamp: string;
  }>;
  onClearLogs: () => void;
}

export default function ActivityLog({ logs, onClearLogs }: ActivityLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle text-green-600';
      case 'warning':
        return 'fas fa-exclamation-triangle text-yellow-600';
      case 'error':
        return 'fas fa-times-circle text-red-600';
      default:
        return 'fas fa-info-circle text-blue-500';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-list-alt text-blue-500 mr-2"></i>
        Activity Log
        <button 
          className="ml-auto text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded" 
          onClick={onClearLogs}
        >
          Clear Log
        </button>
      </h2>
      
      <div 
        ref={logContainerRef}
        className="space-y-2 max-h-96 overflow-y-auto"
      >
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-clipboard-list text-4xl mb-2"></i>
            <p>No activity logs yet</p>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id}
              className={`log-entry flex items-start space-x-3 p-3 rounded-lg border ${getLogColor(log.type)}`}
            >
              <div className="flex-shrink-0">
                <i className={`${getLogIcon(log.type)} mt-1`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{log.title}</p>
                  <span className="text-xs text-gray-500">{formatTime(log.timestamp)}</span>
                </div>
                {log.description && (
                  <p className="text-sm text-gray-600">{log.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
