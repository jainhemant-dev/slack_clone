import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateMeetingNotes } from '@/store/app/aiSlice';
import MeetingNotesModal from './MeetingNotesModal';

/**
 * Button component to trigger meeting notes generation
 * Can be used in both channel and thread views
 */
const MeetingNotesButton = ({ channelId, threadId, workspaceId }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get AI state from Redux store
  const { loading, meetingNotes, error } = useSelector((state) => state.ai);

  // Handler to generate meeting notes
  const handleGenerateMeetingNotes = async () => {
    try {
      await dispatch(generateMeetingNotes({
        channelId,
        threadId,
        workspaceId
      })).unwrap();

      // Open modal to display meeting notes
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to generate meeting notes:', error);
    }
  };

  // Close modal handler
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleGenerateMeetingNotes}
        disabled={loading}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md 
                   bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:outline-none 
                   focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
      >
        {loading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-0.5 mr-2 h-3 w-3 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Generate Meeting Notes</span>
          </div>
        )}
      </button>

      {/* Modal for displaying generated meeting notes */}
      {isModalOpen && (
        <MeetingNotesModal
          isOpen={isModalOpen}
          onClose={closeModal}
          meetingNotes={meetingNotes}
          error={error}
          loading={loading}
        />
      )}
    </>
  );
};

export default MeetingNotesButton;
