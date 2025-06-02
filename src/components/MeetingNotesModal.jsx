import React from 'react';
import { useDispatch } from 'react-redux';
import { clearMeetingNotes } from '@/store/app/aiSlice';

/**
 * Modal component to display generated meeting notes
 */
const MeetingNotesModal = ({ isOpen, onClose, meetingNotes, error, loading }) => {
  const dispatch = useDispatch();

  // Handle modal close
  const handleClose = () => {
    // Clear meeting notes from Redux store when closing
    dispatch(clearMeetingNotes());
    onClose();
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Modal backdrop */}
      <div
        className={`fixed inset-0 backdrop-blur-sm bg-opacity-50 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      ></div>

      {/* Modal content */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Modal header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Meeting Notes
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal body */}
          <div className="p-6 overflow-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg text-gray-600">Generating meeting notes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Error Generating Meeting Notes</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : meetingNotes ? (
              <div className="space-y-6">
                {/* Meeting header */}
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{meetingNotes.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Date:</span> {formatDate(meetingNotes.date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Participants:</span> {meetingNotes.participants?.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {meetingNotes.summary && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                    <p className="mt-2 text-gray-700">{meetingNotes.summary}</p>
                  </div>
                )}

                {/* Topics discussed */}
                {meetingNotes.topics?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Topics Discussed</h3>
                    <ul className="mt-2 space-y-2">
                      {meetingNotes.topics.map((topic, index) => (
                        <li key={index} className="bg-gray-50 p-3 rounded-md">
                          <h4 className="font-medium text-gray-900">{topic.topic}</h4>
                          <ul className="mt-1 list-disc list-inside text-gray-700 ml-2">
                            {topic.keyPoints?.map((point, pointIndex) => (
                              <li key={pointIndex} className="text-sm mt-1">{point}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Decisions */}
                {meetingNotes.decisions?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Decisions Made</h3>
                    <ul className="mt-2 space-y-2">
                      {meetingNotes.decisions.map((decision, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 h-5 w-5 inline-flex items-center justify-center rounded-full bg-green-100 text-green-500 mr-2">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                          </span>
                          <span className="text-gray-700">{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action items */}
                {meetingNotes.actionItems?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Action Items</h3>
                    <ul className="mt-2 space-y-3">
                      {meetingNotes.actionItems.map((item, index) => (
                        <li key={index} className="bg-yellow-50 p-3 rounded-md flex items-start">
                          <span className="flex-shrink-0 h-5 w-5 inline-flex items-center justify-center rounded-full bg-yellow-200 text-yellow-600 mr-2 mt-0.5">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                            </svg>
                          </span>
                          <div>
                            <p className="text-gray-700">{item.task}</p>
                            <div className="mt-1 flex flex-wrap gap-x-4 text-xs">
                              {item.assignee && (
                                <span className="text-gray-600">
                                  <span className="font-medium">Assignee:</span> {item.assignee}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="text-gray-600">
                                  <span className="font-medium">Due:</span> {formatDate(item.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next steps */}
                {meetingNotes.nextSteps?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Next Steps</h3>
                    <ul className="mt-2 space-y-2">
                      {meetingNotes.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 h-5 w-5 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-500 mr-2">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No meeting notes available.</p>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingNotesModal;
