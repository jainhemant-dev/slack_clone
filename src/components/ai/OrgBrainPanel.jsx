import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queryOrgBrain, clearAiResponse } from '@/store/app/aiSlice';
import { FaRobot, FaSpinner, FaTimes, FaPaperPlane, FaUser } from 'react-icons/fa';

const OrgBrainPanel = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const chatContainerRef = useRef(null);
  const dispatch = useDispatch();
  
  // We'll still use Redux state for reference, but implement direct API call
  const { orgBrainResponse, loading, error } = useSelector(state => state.ai);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim()) {
      const userQuery = query.trim();
      
      // Add user message to chat history
      setChatHistory(prev => [...prev, { type: 'user', content: userQuery }]);
      
      // Set local loading state
      setLocalLoading(true);
      setLocalError(null);
      
      try {
        // Make direct API call to org-brain endpoint
        const response = await fetch("/api/ai/generate/org-brain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: userQuery }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch AI response");
        }

        const data = await response.json();
        console.log("Direct API response:", data);
        
        // Add AI response to chat history
        if (data.success && data.response) {
          setChatHistory(prev => [...prev, { type: 'ai', content: data.response }]);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error in direct API call:", err);
        setLocalError(err.message);
        // Add error message to chat
        setChatHistory(prev => [...prev, { 
          type: 'error', 
          content: "Sorry, I couldn't process your request. Please try again."
        }]);
      } finally {
        setLocalLoading(false);
        setQuery('');
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setChatHistory([]);
    dispatch(clearAiResponse());
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Don't clear previous responses when opening
      // This allows the chat history to persist
    }
  };
  
  // Scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <>
      {/* Floating button to toggle the panel */}
      <button 
        onClick={togglePanel}
        className="fixed bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50"
        title="Org Brain AI"
      >
        <FaRobot size={20} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/30">
            <h3 className="font-medium flex items-center">
              <FaRobot className="mr-2 text-indigo-600 dark:text-indigo-400" />
              <span className="text-indigo-700 dark:text-indigo-300">Org Brain</span>
            </h3>
            <button 
              onClick={togglePanel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </div>
          
          <div ref={chatContainerRef} className="p-3 h-96 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {chatHistory.length > 0 ? (
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                        {message.type === 'user' ? (
                          <div className="bg-indigo-600 p-1 rounded-full">
                            <FaUser className="text-white" size={12} />
                          </div>
                        ) : message.type === 'error' ? (
                          <div className="bg-red-500 p-1 rounded-full">
                            <FaTimes className="text-white" size={12} />
                          </div>
                        ) : (
                          <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
                            <FaRobot className="text-indigo-600 dark:text-indigo-400" size={12} />
                          </div>
                        )}
                      </div>
                      <div 
                        className={`p-3 rounded-lg ${message.type === 'user' 
                          ? 'bg-indigo-600 text-white' 
                          : message.type === 'error'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                      >
                        <div className="whitespace-pre-wrap overflow-auto prose prose-sm dark:prose-invert max-w-none">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {localLoading && (
                  <div className="flex items-center">
                    <div className="mr-2">
                      <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
                        <FaRobot className="text-indigo-600 dark:text-indigo-400" size={12} />
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg inline-flex items-center">
                      <FaSpinner className="animate-spin text-indigo-600" size={16} />
                      <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm">Searching workspace...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaRobot size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Ask anything about your organization</p>
                <p className="text-sm mt-2">
                  Example: "What's the latest on Project Atlas?"
                </p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your organization..."
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full disabled:opacity-50 transition-colors duration-200"
                title="Send message"
              >
                <FaPaperPlane size={16} />
              </button>
            </form>
            
            {chatHistory.length > 0 && (
              <button
                onClick={handleClear}
                className="w-full mt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm flex items-center justify-center"
              >
                <FaTimes className="mr-1" size={12} />
                Clear conversation
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default OrgBrainPanel;
