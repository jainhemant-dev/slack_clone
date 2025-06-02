// In-memory storage for threads and messages
const inMemoryStore = {
  threads: [],
  messages: [],
  channels: {
    general: {
      id: 'general',
      name: 'General',
      description: 'Company-wide announcements and work-based matters',
      members: ['user1', 'user2', 'user3']
    },
    random: {
      id: 'random',
      name: 'Random',
      description: 'Non-work banter and water cooler conversation',
      members: ['user1', 'user2']
    }
  },
  workspaces: {
    workspace1: {
      id: 'workspace1',
      name: 'Workspace 1',
      description: 'Main workspace'
    }
  }
};

// Initialize with some sample data if empty
if (inMemoryStore.threads.length === 0) {
  // Create a test thread
  const testThread = {
    id: 'thread1',
    content: 'Let\'s discuss the new feature implementation plan',
    sender: { id: 'user1', fullName: 'Test User' },
    channelId: 'general',
    workspaceId: 'workspace1',
    createdAt: new Date().toISOString()
  };
  inMemoryStore.threads.push(testThread);
  
  // Add some messages to the test thread
  inMemoryStore.messages = [
    testThread,
    {
      id: 'msg1',
      content: 'I think we should start with the authentication module',
      sender: { id: 'user2', fullName: 'Jane Smith' },
      parentMessage: 'thread1',
      channelId: 'general',
      workspaceId: 'workspace1',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'msg2',
      content: 'Good point. Let\'s also consider how it integrates with the user profiles',
      sender: { id: 'user1', fullName: 'Test User' },
      parentMessage: 'thread1',
      channelId: 'general',
      workspaceId: 'workspace1',
      createdAt: new Date(Date.now() - 3500000).toISOString()
    },
    {
      id: 'msg3',
      content: 'Should we use JWT or session-based authentication?',
      sender: { id: 'user3', fullName: 'Alex Johnson' },
      parentMessage: 'thread1',
      channelId: 'general',
      workspaceId: 'workspace1',
      createdAt: new Date(Date.now() - 3400000).toISOString()
    },
    {
      id: 'msg4',
      content: 'For this project, JWT makes more sense given our microservices architecture',
      sender: { id: 'user2', fullName: 'Jane Smith' },
      parentMessage: 'thread1',
      channelId: 'general',
      workspaceId: 'workspace1',
      createdAt: new Date(Date.now() - 3300000).toISOString()
    },
    {
      id: 'msg5',
      content: 'Let\'s plan to implement it by next Friday',
      sender: { id: 'user1', fullName: 'Test User' },
      parentMessage: 'thread1',
      channelId: 'general',
      workspaceId: 'workspace1',
      createdAt: new Date(Date.now() - 3200000).toISOString()
    }
  ];
  
  // Add some standalone messages to the general channel
  inMemoryStore.messages.push(
    {
      id: 'standalone1',
      content: 'Welcome everyone to the general channel!',
      sender: { id: 'user1', fullName: 'Test User' },
      channelId: 'general',
      workspaceId: 'workspace1',
      createdAt: new Date(Date.now() - 4000000).toISOString()
    },
    {
      id: 'standalone2',
      content: 'I\'ve shared the project roadmap in the shared drive',
      sender: { id: 'user2', fullName: 'Jane Smith' },
      channelId: 'general',
      workspaceId: 'workspace1',
      createdAt: new Date(Date.now() - 3800000).toISOString()
    }
  );
}

// Ensure data persists between API calls by attaching to global object
global.inMemoryStore = global.inMemoryStore || inMemoryStore;

export default global.inMemoryStore;
