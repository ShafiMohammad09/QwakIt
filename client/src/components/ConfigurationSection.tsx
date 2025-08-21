import { useState } from "react";

interface ConfigurationSectionProps {
  sessionId: string | null;
  disabled: boolean;
}

export default function ConfigurationSection({ sessionId, disabled }: ConfigurationSectionProps) {
  const [config, setConfig] = useState({
    apiKey: '',
    additionalInstructions: '',
    autoSendEnabled: true,
    countdownDuration: 5,
    connectionDelay: '2-6'
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const handleConfigChange = async (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    
    // Save API key to session when changed
    if (key === 'apiKey' && sessionId && value.trim()) {
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: value.trim() })
        });
      } catch (error) {
        console.error('Failed to save API key:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-cogs text-blue-500 mr-2"></i>
        Configuration
      </h2>
      
      {/* AI API Key */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">AI API Key (Gemini)</label>
        <div className="relative">
          <input 
            type={showApiKey ? "text" : "password"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" 
            placeholder="Enter your Gemini API key"
            value={config.apiKey}
            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
            disabled={disabled}
          />
          <button 
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowApiKey(!showApiKey)}
            type="button"
          >
            <i className={`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'} text-gray-400 hover:text-gray-600`}></i>
          </button>
        </div>
        {!config.apiKey && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-info-circle text-yellow-600 mr-2"></i>
              <span className="text-sm text-yellow-800">
                Without an API key, the system will use basic template messages instead of AI-generated personalized content.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional Instructions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Instructions</label>
        <textarea 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
          rows={3} 
          placeholder="e.g., Keep messages friendly and concise, mention their recent post if relevant"
          value={config.additionalInstructions}
          onChange={(e) => handleConfigChange('additionalInstructions', e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Automation Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Auto-send after countdown</label>
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
            checked={config.autoSendEnabled}
            onChange={(e) => handleConfigChange('autoSendEnabled', e.target.checked)}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Countdown duration</label>
          <select 
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            value={config.countdownDuration}
            onChange={(e) => handleConfigChange('countdownDuration', parseInt(e.target.value))}
            disabled={disabled}
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Delay between connections</label>
          <select 
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            value={config.connectionDelay}
            onChange={(e) => handleConfigChange('connectionDelay', e.target.value)}
            disabled={disabled}
          >
            <option value="2-6">2-6 seconds</option>
            <option value="5-10">5-10 seconds</option>
            <option value="10-15">10-15 seconds</option>
          </select>
        </div>
      </div>
    </div>
  );
}
