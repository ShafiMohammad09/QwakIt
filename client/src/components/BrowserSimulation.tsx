interface BrowserSimulationProps {
  currentConnection: any;
  generatedMessage: string;
  showMessageModal: boolean;
}

export default function BrowserSimulation({ currentConnection, generatedMessage, showMessageModal }: BrowserSimulationProps) {
  const currentURL = currentConnection?.url || 'https://www.linkedin.com';
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fab fa-chrome text-blue-500 mr-2"></i>
        Browser Automation View
        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
      </h2>
      
      {/* Browser Window Mockup */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Browser Header */}
        <div className="bg-gray-100 px-4 py-2 flex items-center space-x-2 border-b border-gray-300">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 truncate">
              <i className="fas fa-lock text-green-500 mr-1"></i>
              <span>{currentURL}</span>
            </div>
          </div>
        </div>
        
        {/* LinkedIn Profile Mockup */}
        <div className="p-6 bg-gray-50 min-h-96 relative">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-gray-500 text-2xl"></i>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentConnection?.name || 'LinkedIn Profile'}
                  </h1>
                  <p className="text-lg text-gray-700">
                    {currentConnection?.position || 'Professional Title'}
                  </p>
                  <p className="text-gray-600">
                    {currentConnection?.company || 'Company Name'}
                  </p>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-map-marker-alt text-gray-400 mr-1"></i>
                    <span className="text-gray-600 text-sm">Location</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {/* Message Button (highlighted when active) */}
                  <button className={`px-4 py-2 rounded-lg font-medium flex items-center transition-all ${
                    currentConnection 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    <i className="fas fa-envelope mr-2"></i>
                    Message
                  </button>
                  <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Message Modal Overlay */}
          {showMessageModal && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Message {currentConnection?.name || 'Connection'}
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="p-4">
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none" 
                    rows={8} 
                    value={generatedMessage}
                    readOnly
                  />
                </div>
                <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium ring-4 ring-blue-200 animate-pulse">
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
