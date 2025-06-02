"use client";
import { useAuth } from "@/providers/AuthProvider";
import React, { useState, useEffect, useRef } from "react";
import { FiHash, FiUser, FiSearch, FiBell, FiHelpCircle, FiSmile, FiPaperclip, FiX, FiLoader, FiAlertCircle, FiCheckCircle, FiMessageSquare, FiSend } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { createChannel } from "@/store/app/channelSlice";
import { fetchMe, selectChannel, selectMe, selectSelectedChannel, selectSelectedWorkspace, selectWorkspace } from "@/store/app/profileSlice";
import { createMessage, selectMessagesByKey, fetchMessagesByChannel } from "@/store/app/messageSlice";
import { inviteWorkspaceMember, resetInviteStatus, selectInviteStatus, selectWorkspaceError, selectWorkspaceSuccessMessage, selectIsWorkspaceLoading, selectCurrentWorkspace } from "@/store/app/workspaceSlice";
import { generateReply } from "@/store/app/aiSlice";
import MessageInputBox from "@/components/message-input";
import OrgBrainPanel from "@/components/ai/OrgBrainPanel";
import MeetingNotesButton from "@/components/MeetingNotesButton";
import Image from "next/image";

function WorkspaceHeader({ workspace: selectedWorkspace, workspaces, onSelectWorkspace }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    // Add event listener when dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleWorkspaceSelect = (workspaceId) => {
    onSelectWorkspace(workspaceId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#532753] relative">
      <Image
        width={32}
        height={32}
        src={process.env.NEXT_PUBLIC_SLACKIFY_LOGO || "/slackify-logo.png"}
        alt="Slackify"
        className="h-8 w-8 rounded"
      />
      <span className="font-bold text-lg">{selectedWorkspace.name}</span>
      <button
        className="ml-auto flex items-center justify-center w-6 h-6 rounded hover:bg-[#421f44] text-gray-400"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="Toggle workspace dropdown"
      >
        <span className={`transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isDropdownOpen && workspaces && workspaces.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-2 mt-1 w-48 bg-[#350d36] rounded-md shadow-lg z-10 border border-[#532753] overflow-hidden"
        >
          <div className="py-1">
            {workspaces.map(workspace => (
              <button
                key={workspace.id}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-[#421f44] ${workspace.id === selectedWorkspace.id ? 'bg-[#611f69] font-semibold' : ''}`}
                onClick={() => handleWorkspaceSelect(workspace.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="bg-[#b794f4] text-[#350d36] rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                    {workspace.name[0].toUpperCase()}
                  </span>
                  <span>{workspace.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarSection({ title, children, displayPlusButton, onClick }) {
  return (
    <div className="mb-4">
      <div className={`px-4 py-2 text-xs font-semibold text-gray-400 uppercase ${displayPlusButton ? "flex items-center justify-between" : ""} `}>{title} {displayPlusButton && <button onClick={onClick} className="ml-2 px-2 py-1 rounded text-xs hover:bg-[#7b2fa0] font-bold bg-[#611f69]">+</button>}</div>
      {children}
    </div>
  );
}

function InviteUserModal({ isOpen, onClose, workspaceId }) {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const inviteStatus = useSelector(selectInviteStatus);
  const isLoading = useSelector(selectIsWorkspaceLoading);
  const error = useSelector(selectWorkspaceError);
  const successMessage = useSelector(selectWorkspaceSuccessMessage);

  useEffect(() => {
    // Reset invite status when component unmounts or modal closes
    return () => {
      if (inviteStatus !== 'idle') {
        dispatch(resetInviteStatus());
      }
    };
  }, [dispatch, inviteStatus]);

  useEffect(() => {
    // Close modal after successful invitation after a short delay
    if (inviteStatus === 'succeeded') {
      const timer = setTimeout(() => {
        onClose();
        dispatch(resetInviteStatus());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [inviteStatus, onClose, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      dispatch(inviteWorkspaceMember({
        workspaceId,
        email: email.trim(),
      }));

      // Only clear the email field if the invitation was successful
      if (inviteStatus === 'succeeded') {
        setEmail("");
        onClose();
      }
    }
  };

  return (
    <div className="fixed text-gray-950 inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-96 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#350d36]">Invite User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
            disabled={isLoading}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Status messages */}
        {inviteStatus === 'succeeded' && (
          <div className="mb-4 p-2 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            <span>{successMessage || 'User invited successfully!'}</span>
          </div>
        )}

        {inviteStatus === 'failed' && (
          <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <FiAlertCircle className="text-red-500" />
            <span>{error || 'Failed to invite user. Please try again.'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#611f69]"
              placeholder="user@example.com"
              required
              disabled={isLoading || inviteStatus === 'succeeded'}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#611f69] rounded-md hover:bg-[#7b2fa0] disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading || !email.trim() || inviteStatus === 'succeeded'}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin"><FiLoader /></span>
                  <span>Inviting...</span>
                </>
              ) : (
                'Invite'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Sidebar({
  workspace,
  channels,
  currentChannel,
  onSelectChannel,
  onCreateChannel,
  dms,
  currentDm,
  onSelectDm,
  onCreateDm,
  users,
  onAddUser,
  handleSelectWorkspace
}) {
  const [newChannel, setNewChannel] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [newDm, setNewDm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const user = useSelector(selectMe)
  const dispatch = useDispatch();

  return (
    <aside className="bg-[#350d36] text-white w-80 flex flex-col h-full border-r border-[#532753]">
      <WorkspaceHeader
        workspace={workspace}
        workspaces={user?.workspaces || []}
        onSelectWorkspace={handleSelectWorkspace}
      />
      <div className="flex-1 overflow-y-auto">
        <SidebarSection title="Browse">
          <div className="flex flex-col gap-1 px-4">
            <button className="flex items-center gap-2 text-sm hover:bg-[#421f44] px-2 py-1 rounded">
              <FiHash className="text-[#b794f4]" /> Threads
            </button>
            <button className="flex items-center gap-2 text-sm hover:bg-[#421f44] px-2 py-1 rounded">
              <FiHash className="text-[#b794f4]" /> Mentions & reactions
            </button>
            <button className="flex items-center gap-2 text-sm hover:bg-[#421f44] px-2 py-1 rounded">
              <FiHash className="text-[#b794f4]" /> Saved items
            </button>
          </div>
        </SidebarSection>
        <SidebarSection title="Channels">
          <div className="flex items-center px-4 mb-2">
            <input
              className="flex-1 px-2 py-1 rounded text-white text-sm border-1"
              placeholder="New channel"
              value={newChannel}
              onChange={e => setNewChannel(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newChannel.trim()) {
                  onCreateChannel(newChannel.trim());
                  setNewChannel("");
                }
              }}
            />
            <button
              className="ml-2 bg-[#611f69] px-2 py-1 rounded text-xs hover:bg-[#7b2fa0]"
              onClick={() => {
                if (newChannel.trim()) {
                  onCreateChannel(newChannel.trim());
                  setNewChannel("");
                }
              }}
              title="Create Channel"
            >
              +
            </button>
          </div>
          <ul>
            {channels.map((ch) => (
              <li
                key={ch.id}
                className={`px-4 py-2 cursor-pointer flex items-center gap-2 rounded hover:bg-[#421f44] ${ch.id === currentChannel?.id ? "bg-[#611f69] font-semibold" : ""
                  }`}
                onClick={() => dispatch(selectChannel(ch.id))}
              >
                <FiHash className="text-[#b794f4]" /> {ch.name}
              </li>
            ))}
          </ul>
        </SidebarSection>
        <SidebarSection title="Direct Messages">
          <button
            className="ml-4 mb-2 bg-[#611f69] px-2 py-1 rounded text-xs hover:bg-[#7b2fa0]"
            onClick={() => setShowNewDm((v) => !v)}
            title="Start DM"
          >
            + New DM
          </button>
          {showNewDm && (
            <div className="mb-2 px-4">
              <input
                className="w-full px-2 py-1 rounded text-black text-sm"
                placeholder="User name"
                value={newDm}
                onChange={e => setNewDm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newDm.trim()) {
                    onCreateDm(newDm.trim());
                    setNewDm("");
                    setShowNewDm(false);
                  }
                }}
              />
              <button
                className="w-full mt-1 bg-[#611f69] text-white py-1 rounded text-xs font-semibold hover:bg-[#7b2fa0] transition"
                onClick={() => {
                  if (newDm.trim()) {
                    onCreateDm(newDm.trim());
                    setNewDm("");
                    setShowNewDm(false);
                  }
                }}
              >
                Start
              </button>
            </div>
          )}
          <ul>
            {dms.map((dm) => (
              <li
                key={dm}
                className={`px-4 py-2 cursor-pointer flex items-center gap-2 rounded hover:bg-[#421f44] ${dm === currentDm ? "bg-[#611f69] font-semibold" : ""
                  }`}
                onClick={() => onSelectDm(dm)}
              >
                <FiUser className="text-[#b794f4]" />
                <span className="relative">
                  {dm}
                  {dm === user && (
                    <span className="ml-1 text-xs text-gray-400">({user.fullName[0]})</span>
                  )}
                  <span className="absolute right-[-12px] top-1 w-2 h-2 bg-green-400 rounded-full border-2 border-[#350d36]" />
                </span>
              </li>
            ))}
          </ul>
        </SidebarSection>
        <SidebarSection title="Users" displayPlusButton={true} onClick={() => setShowInviteModal(true)}>
          <ul className="px-4 pb-4">
            {users.map((user) => (
              <li key={user} className="py-1 flex items-center gap-2">
                <span className="bg-[#b794f4] text-[#350d36] rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                  {user[0].toUpperCase()}
                </span>
                <span className="text-sm">{user}</span>
              </li>
            ))}
          </ul>

          <InviteUserModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            workspaceId={workspace.id}
          />
        </SidebarSection>
      </div>
    </aside>
  );
}

function Topbar({ workspaceName = "Slackify", user = "You", onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 flex items-center justify-between h-14">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-[#4A154B]">{workspaceName}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <FiSearch className="absolute left-2 top-2 text-gray-400" />
          <input
            className="pl-8 pr-2 py-1 rounded bg-[#f8f8fa] border border-gray-200 text-sm"
            placeholder="Search Slackify"
          />
        </div>
        <FiBell className="text-[#4A154B] text-xl cursor-pointer" />
        <FiHelpCircle className="text-[#4A154B] text-xl cursor-pointer" />
        <span className="bg-[#611f69] px-3 py-1 rounded-full text-xs font-semibold text-white">{user}</span>
        <button
          className="ml-2 px-3 py-1 rounded bg-[#611f69] hover:bg-[#7b2fa0] text-xs font-semibold text-white"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function MessageList({ channelId }) {
  const [activeThread, setActiveThread] = useState(null);
  const [threadReply, setThreadReply] = useState("");
  const [suggestedReply, setSuggestedReply] = useState("");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const threadMessages = useSelector((state) => selectMessagesByKey(state, activeThread?.id)) || [];

  const dispatch = useDispatch();
  const messages = useSelector((state) => selectMessagesByKey(state, channelId)) || [];
  const workspace = useSelector(selectSelectedWorkspace);

  // Close thread panel
  const closeThread = () => {
    setActiveThread(null);
    setThreadReply("");
    setSuggestedReply("");
  };

  // Open thread panel for a message
  const openThread = (message) => {
    setActiveThread(message);
  };

  // Send a reply in thread
  const sendThreadReply = async () => {
    if (!threadReply.trim()) return;

    try {
      // Create message with parentMessage set to the thread parent message ID
      await dispatch(createMessage({
        channelId,
        messagebody: {
          content: threadReply,
          parentMessage: activeThread.id
        },
        workspaceId: workspace.id,
        thread: activeThread.id
      })).unwrap();

      // Add the new reply to thread messages
      const newReply = {
        id: Date.now().toString(), // temporary ID
        content: threadReply,
        sender: { fullName: "You" }, // This should be the current user
        createdAt: new Date().toLocaleTimeString(),
        parentMessage: activeThread.id
      };
      setThreadReply("");
    } catch (error) {
      console.error("Failed to send thread reply:", error);
    }
  };

  useEffect(() => {
    async function fetchMessages() {
      if (activeThread) {
        await dispatch(fetchMessagesByChannel({ channelId: channelId, workspaceId: workspace.id, thread: activeThread.id })).unwrap();
      }
    }
    fetchMessages();
  }, [channelId, dispatch, workspace.id, activeThread]);

  return (
    <div className={`flex-1 flex ${activeThread ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {/* Main message list */}
      <div className={`${activeThread ? 'w-7/12' : 'w-full'} overflow-y-auto px-6 py-4 space-y-4 bg-[#f3f3f7] text-blue-800`}>
        {/* Channel tools bar with Meeting Notes button */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <FiHash className="mr-1 text-[#611f69]" />
            {/* {channelId} */}
          </h2>
          <MeetingNotesButton
            channelId={channelId}
            workspaceId={workspace?.id}
          />
        </div>
        {messages.length === 0 && (
          <div className="text-center text-gray-800 mt-10">No messages yet.</div>
        )}

        {messages.map((msg, idx) => {
          // Only show parent messages in the main list
          if (msg.parentMessage) return null;

          return (
            <div key={idx} className="flex items-start gap-3 group">
              <div className="bg-[#611f69] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                {msg.sender?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#350d36]">{msg.sender?.fullName || msg.user}</span>
                  <span className="text-xs text-gray-900 opacity-30 group-hover:opacity-100 transition">
                    {msg.createdAt}
                  </span>
                </div>

                {/* Tone Analysis Display */}
                {msg.tone && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {/* Sentiment Tag */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${msg.tone.sentiment === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : msg.tone.sentiment === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'}`}
                    >
                      {msg.tone.sentiment}
                    </span>

                    {/* Impact Tag */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${msg.tone.impact === 'high'
                        ? 'bg-purple-100 text-purple-800'
                        : msg.tone.impact === 'low'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'}`}
                    >
                      {msg.tone.impact} impact
                    </span>

                    {/* Category Tag */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${msg.tone.category === 'aggressive' ? 'bg-red-100 text-red-800' :
                        msg.tone.category === 'weak' ? 'bg-yellow-100 text-yellow-800' :
                          msg.tone.category === 'confusing' ? 'bg-orange-100 text-orange-800' :
                            msg.tone.category === 'assertive' ? 'bg-indigo-100 text-indigo-800' :
                              msg.tone.category === 'friendly' ? 'bg-green-100 text-green-800' :
                                msg.tone.category === 'professional' ? 'bg-blue-100 text-blue-800' :
                                  msg.tone.category === 'clear' ? 'bg-teal-100 text-teal-800' :
                                    msg.tone.category === 'casual' ? 'bg-pink-100 text-pink-800' :
                                      'bg-gray-100 text-gray-800'}`}
                    >
                      {msg.tone.category}
                    </span>

                    {/* Score Indicator */}
                    {/* <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${msg.tone.score >= 70 ? 'bg-green-100 text-green-800' :
                        msg.tone.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}
                    >
                      score: {msg.tone.score} 
                  </span> */}
                  </div>
                )}

                <div className="text-sm">{msg.content}</div>

                {/* Thread replies count and button */}
                <div className="mt-1 flex items-center gap-3">
                  <button
                    onClick={() => openThread(msg)}
                    className="text-xs text-[#611f69] hover:underline flex items-center gap-1 mt-1"
                  >
                    <FiMessageSquare size={12} />
                    {threadMessages.length > 0 && activeThread?.id === msg.id
                      ? `${threadMessages.length} ${threadMessages.length === 1 ? 'reply' : 'replies'} in thread`
                      : 'Reply in thread'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Thread panel */}
      {
        activeThread && (
          <div className="w-5/12 border-l border-gray-200 h-full flex flex-col bg-white">
            {/* Thread header */}
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Thread</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!activeThread) return;

                    setIsGeneratingReply(true);
                    try {
                      // First, check if we need to fetch thread messages
                      if (!threadMessages || threadMessages.length === 0) {
                        console.log('Fetching thread messages for thread:', activeThread.id);
                        // Fetch thread messages if they don't exist
                        await dispatch(fetchMessagesByChannel({
                          channelId: channelId,
                          workspaceId: workspace?.id,
                          thread: activeThread.id
                        })).unwrap();
                      }

                      // Now generate the reply with proper thread data
                      console.log('Generating reply for thread:', activeThread.id, 'with messages:', threadMessages);
                      const result = await dispatch(generateReply({
                        threadId: activeThread.id,
                        messageId: activeThread.id,
                        // Pass the threadMessages directly to avoid state access issues
                        messages: [activeThread, ...threadMessages]
                      })).unwrap();

                      setSuggestedReply(result.reply);
                    } catch (error) {
                      console.error('Failed to generate reply:', error);
                      alert('Failed to generate reply: ' + error.message);
                    } finally {
                      setIsGeneratingReply(false);
                    }
                  }}
                  disabled={isGeneratingReply}
                  className={`text-xs font-medium py-1 px-2 rounded ${isGeneratingReply ? 'bg-gray-300 text-gray-600' : 'bg-[#611f69] text-white hover:bg-[#7b2fa0]'}`}
                  title="Get AI suggested reply"
                >
                  {isGeneratingReply ? 'Generating...' : 'Suggest Reply'}
                </button>
                <MeetingNotesButton
                  channelId={channelId}
                  threadId={activeThread?.id}
                  workspaceId={workspace?.id}
                />
                <button onClick={closeThread} className="text-gray-500 hover:text-gray-700">
                  <FiX />
                </button>
              </div>
            </div>

            {/* Thread messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Original message */}
              <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                <div className="bg-[#611f69] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  {activeThread.sender?.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{activeThread.sender?.fullName || activeThread.user}</span>
                    <span className="text-xs text-gray-900">{activeThread.createdAt}</span>
                  </div>

                  {/* Thread Original Message Tone Display */}
                  {activeThread.tone && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {/* Sentiment Tag */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeThread.tone.sentiment === 'positive'
                          ? 'bg-green-100 text-green-800'
                          : activeThread.tone.sentiment === 'negative'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'}`}
                      >
                        {activeThread.tone.sentiment}
                      </span>

                      {/* Impact Tag */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeThread.tone.impact === 'high'
                          ? 'bg-purple-100 text-purple-800'
                          : activeThread.tone.impact === 'low'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'}`}
                      >
                        {activeThread.tone.impact} impact
                      </span>

                      {/* Category Tag */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeThread.tone.category === 'aggressive' ? 'bg-red-100 text-red-800' :
                          activeThread.tone.category === 'weak' ? 'bg-yellow-100 text-yellow-800' :
                            activeThread.tone.category === 'confusing' ? 'bg-orange-100 text-orange-800' :
                              activeThread.tone.category === 'assertive' ? 'bg-indigo-100 text-indigo-800' :
                                activeThread.tone.category === 'friendly' ? 'bg-green-100 text-green-800' :
                                  activeThread.tone.category === 'professional' ? 'bg-blue-100 text-blue-800' :
                                    activeThread.tone.category === 'clear' ? 'bg-teal-100 text-teal-800' :
                                      activeThread.tone.category === 'casual' ? 'bg-pink-100 text-pink-800' :
                                        'bg-gray-100 text-gray-800'}`}
                      >
                        {activeThread.tone.category}
                      </span>
                    </div>
                  )}

                  <div className="text-sm mt-1 text-gray-800">{activeThread.content}</div>
                </div>
              </div>

              {/* Thread replies */}
              {threadMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-4">No replies yet</div>
              ) : (
                threadMessages.map((reply, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="bg-[#611f69] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                      {reply.sender?.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">{reply.sender?.fullName || reply.user}</span>
                        <span className="text-xs text-gray-800">{reply.createdAt}</span>
                      </div>

                      {/* Thread Reply Tone Display */}
                      {reply.tone && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {/* Sentiment Tag */}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${reply.tone.sentiment === 'positive'
                              ? 'bg-green-100 text-green-800'
                              : reply.tone.sentiment === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'}`}
                          >
                            {reply.tone.sentiment}
                          </span>

                          {/* Impact Tag */}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${reply.tone.impact === 'high'
                              ? 'bg-purple-100 text-purple-800'
                              : reply.tone.impact === 'low'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'}`}
                          >
                            {reply.tone.impact} impact
                          </span>

                          {/* Category Tag */}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${reply.tone.category === 'aggressive' ? 'bg-red-100 text-red-800' :
                              reply.tone.category === 'weak' ? 'bg-yellow-100 text-yellow-800' :
                                reply.tone.category === 'confusing' ? 'bg-orange-100 text-orange-800' :
                                  reply.tone.category === 'assertive' ? 'bg-indigo-100 text-indigo-800' :
                                    reply.tone.category === 'friendly' ? 'bg-green-100 text-green-800' :
                                      reply.tone.category === 'professional' ? 'bg-blue-100 text-blue-800' :
                                        reply.tone.category === 'clear' ? 'bg-teal-100 text-teal-800' :
                                          reply.tone.category === 'casual' ? 'bg-pink-100 text-pink-800' :
                                            'bg-gray-100 text-gray-800'}`}
                          >
                            {reply.tone.category}
                          </span>
                        </div>
                      )}

                      <div className="text-sm text-gray-800">{reply.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Suggested Reply */}
            {suggestedReply && (
              <div className="px-4 py-3 border-t border-gray-200 bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-blue-700">AI Suggested Reply:</h4>
                  <div className="flex gap-2">
                    <button
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                      onClick={() => {
                        setThreadReply(suggestedReply);
                        setSuggestedReply("");
                      }}
                      title="Use this reply"
                    >
                      Use
                    </button>
                    <button
                      className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition"
                      onClick={() => setSuggestedReply("")}
                      title="Dismiss this suggestion"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-800 p-2 bg-white rounded border border-blue-200">
                  {suggestedReply}
                </div>
              </div>
            )}

            {/* Thread reply input */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                <input
                  type="text"
                  value={threadReply}
                  onChange={(e) => setThreadReply(e.target.value)}
                  placeholder="Reply in thread..."
                  className="flex-1 text-gray-900 bg-transparent border-none outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && sendThreadReply()}
                />
                <button
                  className="p-1 rounded-md text-white bg-[#611f69] hover:bg-[#7b2fa0] disabled:opacity-50"
                  onClick={sendThreadReply}
                  disabled={!threadReply.trim()}
                >
                  <FiSend size={16} />
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

function MessageInput({ onSend, placeholder, channelId }) {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex gap-2 p-4 border-t border-gray-200 bg-white items-center"
      onSubmit={e => {
        e.preventDefault();
        if (value.trim()) {
          onSend({ messagebody: { content: value }, channelId });
          setValue("");
        }
      }}
    >
      <button type="button" className="text-xl text-gray-400 hover:text-[#4A154B]">
        <FiSmile />
      </button>
      <input
        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="button" className="text-xl text-gray-400 hover:text-[#4A154B]">
        <FiPaperclip />
      </button>
      <button
        type="submit"
        className="bg-[#4A154B] text-white px-4 py-2 rounded font-semibold hover:bg-[#350d36] transition"
      >
        Send
      </button>
    </form>
  );
}

export default function Home() {

  const workspace = useSelector(selectSelectedWorkspace)
  const channels = workspace?.channels || [];
  const [, setCurrentChannel] = useState("general");
  const currentChannel = useSelector(selectSelectedChannel);
  const [dms, setDms] = useState(["Alice", "Bob", "You"]);
  const [currentDm, setCurrentDm] = useState(null);
  const [messages, setMessages] = useState({
    general: [
      {
        user: "Alice",
        text: "Welcome to #general!",
        time: "09:00 AM",
      },
    ],
    random: [],
  });
  const [dmMessages, setDmMessages] = useState({
    Alice: [
      {
        user: "Alice",
        text: "Hey there!",
        time: "09:10 AM",
      },
    ],
    Bob: [],
    You: [],
  });
  const [users, setUsers] = useState(["Alice", "Bob", "You"]);
  const user = useSelector(selectMe)
  const { logout } = useAuth();

  const dispatch = useDispatch();

  const handleCreateChannel = async (name) => {
    if (!channels.includes(name)) {
      setMessages({ ...messages, [name]: [] });
    }
    await dispatch(createChannel({ name, workspaceId: workspace.id, createdBy: user.id })).unwrap();
    await dispatch(fetchMe()).unwrap();
    setCurrentChannel(name);
    setCurrentDm(null);
  };

  const handleAddUser = (name) => {
    if (!users.includes(name)) {
      setUsers([...users, name]);
      setDms([...dms, name]);
      setDmMessages({ ...dmMessages, [name]: [] });
      // In a real app, this would send an invitation email
      console.log(`Invitation sent to ${name}`);
    }
  };

  const handleCreateDm = (name) => {
    if (!dms.includes(name)) {
      setDms([...dms, name]);
      setDmMessages({ ...dmMessages, [name]: [] });
    }
    setCurrentDm(name);
    setCurrentChannel(null);
  };

  const handleSelectDm = (name) => {
    setCurrentDm(name);
    setCurrentChannel(null);
  };

  const handleSelectChannel = (name) => {
    setCurrentChannel(name);
    setCurrentDm(null);
  };

  const handleSendMessage = async ({ messagebody, channelId }) => {
    try {
      await dispatch(createMessage({ channelId, messagebody, workspaceId: workspace.id })).unwrap();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Handle selecting a workspace from dropdown
  const handleSelectWorkspace = (workspaceId) => {
    dispatch(selectWorkspace(workspaceId));
  };

  // const mainTitle = currentDm
  //   ? dms.includes(currentDm)
  //     ? `@${currentDm}`
  //     : ""
  //   : currentChannel
  //     ? `#${currentChannel}`
  //     : "";

  useEffect(() => {
    async function fetchMessages() {
      if (currentChannel) {
        await dispatch(fetchMessagesByChannel({ channelId: currentChannel.id, workspaceId: workspace.id })).unwrap();
      }
    }
    fetchMessages();
  }, [currentChannel, dispatch, workspace.id]);

  return (
    <div className="flex h-screen">
      <Sidebar
        workspace={workspace}
        channels={channels}
        currentChannel={currentChannel}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={handleCreateChannel}
        dms={dms}
        currentDm={currentDm}
        onSelectDm={handleSelectDm}
        onCreateDm={handleCreateDm}
        users={users}
        onAddUser={handleAddUser}
        user={user}
        handleSelectWorkspace={handleSelectWorkspace}

      />
      <div className="flex-1 flex flex-col h-full bg-[#f8f8fa]">
        <Topbar workspaceName="Slackify" user={user?.fullName.split(' ')[0]} onLogout={handleLogout} />
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-14">
          <div className="text-xl font-bold text-[#4A154B] flex items-center gap-2">
            {currentDm ? (
              <>
                <span className="bg-[#b794f4] text-[#350d36] rounded-full w-7 h-7 flex items-center justify-center font-bold text-base">
                  {currentDm[0].toUpperCase()}
                </span>
                @{currentDm}
              </>
            ) : (
              <>
                <span className="text-[#b794f4] text-2xl">#</span> {currentChannel?.name}
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">Slackify Dashboard</div>
        </div>
        <MessageList channelId={currentChannel?.id || currentDm} />
        <MessageInputBox
          onSend={handleSendMessage}
          channelId={currentChannel?.id || currentDm}
        />

        {/* <MessageInput
          onSend={handleSendMessage}
          channelId={currentChannel?.id || currentDm}
          placeholder={currentDm ? `Message @${currentDm}` : `Message #${currentChannel?.name}`}
        />{" "} */}
      </div>

      {/* Org Brain AI Panel */}
      <OrgBrainPanel />
    </div>
  );
}