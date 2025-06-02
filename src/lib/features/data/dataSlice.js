import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

const initialState = {
  users: [],
  usersLoading: false,
  usersError: null,
  channels: [],
  channelsLoading: false,
  channelsError: null,
  directMessages: [],
  dmLoading: false,
  dmError: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  typingUsers: {}, // { channelId: [userId1, userId2] }
}

// Async thunks for fetching data
export const fetchUsers = createAsyncThunk(
  'data/fetchUsers',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/workspaces/${workspaceId}/users`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch users')
    }
  }
)

export const fetchChannelMessages = createAsyncThunk(
  'data/fetchChannelMessages',
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/channels/${channelId}/messages`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch channel messages')
    }
  }
)

export const fetchDirectMessages = createAsyncThunk(
  'data/fetchDirectMessages',
  async ({ userId, otherUserId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/messages/direct?userId=${userId}&otherUserId=${otherUserId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch direct messages')
    }
  }
)

export const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      // Check if the message already exists to avoid duplicates
      const messageId = action.payload.id
      const exists = state.messages.some((msg) => msg.id === messageId)

      if (!exists) {
        const newMessage = {
          ...action.payload,
          reactions: action.payload.reactions || [],
          threadCount: action.payload.threadCount || 0,
          // Use timestamp if provided, otherwise create one
          timestamp: action.payload.timestamp || new Date().toISOString(),
        }
        state.messages.push(newMessage)
        
        // Clear typing indicator for this user if it exists
        if (newMessage.channelId && state.typingUsers[newMessage.channelId]) {
          state.typingUsers[newMessage.channelId] = state.typingUsers[newMessage.channelId]
            .filter(id => id !== newMessage.senderId)
        }
      } else {
        console.log("Duplicate message detected, ignoring:", messageId)
      }
    },
    
    setTypingStatus: (state, action) => {
      const { channelId, userId, isTyping } = action.payload
      
      if (!state.typingUsers[channelId]) {
        state.typingUsers[channelId] = []
      }
      
      if (isTyping) {
        // Add user to typing list if not already there
        if (!state.typingUsers[channelId].includes(userId)) {
          state.typingUsers[channelId].push(userId)
        }
      } else {
        // Remove user from typing list
        state.typingUsers[channelId] = state.typingUsers[channelId].filter(id => id !== userId)
      }
    },
    
    addThreadReply: (state, action) => {
      const { messageId, reply } = action.payload
      const message = state.messages.find(msg => msg.id === messageId)
      
      if (message) {
        // Increment thread count
        message.threadCount = (message.threadCount || 0) + 1
        message.lastReplyTime = reply.timestamp || new Date().toISOString()
      }
    },
    addReaction: (state, action) => {
      const { messageId, reaction } = action.payload
      const message = state.messages.find((m) => m.id === messageId)
      if (message) {
        const existingReaction = message.reactions.find((r) => r.emoji === reaction.emoji)
        if (existingReaction) {
          existingReaction.count += 1
        } else {
          message.reactions.push({ ...reaction, count: 1 })
        }
      }
    },
    updateUserStatus: (state, action) => {
      const { userId, online } = action.payload

      // Update in users array
      const user = state.users.find((u) => u.id === userId)
      if (user) {
        user.online = online
      }

      // Update in directMessages array
      const dm = state.directMessages.find((d) => d.id === userId)
      if (dm) {
        dm.online = online
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true
        state.usersError = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false
        state.users = action.payload
        
        // Also update directMessages array with the same users
        state.directMessages = action.payload.map(user => ({
          id: user.id,
          name: user.fullName || user.name,
          avatar: user.avatar || "/placeholder.svg",
          online: user.status === "online",
        }))
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false
        state.usersError = action.payload
      })
      
    // Handle fetchChannelMessages
    builder
      .addCase(fetchChannelMessages.pending, (state) => {
        state.messagesLoading = true
        state.messagesError = null
      })
      .addCase(fetchChannelMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        
        // Filter out existing messages for this channel and add new ones
        const channelId = action.meta.arg
        const existingMessageIds = state.messages
          .filter(msg => msg.channelId === channelId)
          .map(msg => msg.id)
          
        const newMessages = action.payload.filter(msg => !existingMessageIds.includes(msg.id))
        state.messages = [...state.messages, ...newMessages]
      })
      .addCase(fetchChannelMessages.rejected, (state, action) => {
        state.messagesLoading = false
        state.messagesError = action.payload
      })
      
    // Handle fetchDirectMessages
    builder
      .addCase(fetchDirectMessages.pending, (state) => {
        state.messagesLoading = true
        state.messagesError = null
      })
      .addCase(fetchDirectMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        
        // Get the user IDs from the action meta
        const { userId, otherUserId } = action.meta.arg
        
        // Filter out existing DMs between these users and add new ones
        const existingMessageIds = state.messages
          .filter(msg => 
            (msg.senderId === userId && msg.receiverId === otherUserId) ||
            (msg.senderId === otherUserId && msg.receiverId === userId)
          )
          .map(msg => msg.id)
          
        const newMessages = action.payload.filter(msg => !existingMessageIds.includes(msg.id))
        state.messages = [...state.messages, ...newMessages]
      })
      .addCase(fetchDirectMessages.rejected, (state, action) => {
        state.messagesLoading = false
        state.messagesError = action.payload
      })
  },
})

export const { addMessage, addReaction, updateUserStatus, setTypingStatus, addThreadReply } = dataSlice.actions

export default dataSlice.reducer
