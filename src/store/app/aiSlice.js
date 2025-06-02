import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Async thunks for AI operations

export const fetchAiResponse = createAsyncThunk(
  "ai/fetchResponse",
  async ({ prompt, context, type }, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/ai/generate/org-brain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: prompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch AI response")
      }

      const data = await response.json()
      return { response: data.response, type }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const generateReply = createAsyncThunk(
  "ai/generateReply",
  async ({ threadId, messageId, messages }, { getState, rejectWithValue }) => {
    try {
      // If messages are provided directly from the component, use those
      let thread = messages || []
      
      // If no messages were provided, try to get them from the state
      if (!thread || thread.length === 0) {
        const state = getState()
        // Access messages from the correct slice of state
        const messagesObj = state.message?.messages || {}
        
        // Get the thread messages from the correct key
        thread = messagesObj[threadId] || []
        
        console.log('Thread from state for AI reply:', thread)
      } else {
        console.log('Thread provided directly for AI reply:', thread)
      }
      
      // If we don't have any messages for this thread, we cannot generate a reply
      if (!thread || thread.length === 0) {
        throw new Error('No messages found for this thread')
      }

      
      const response = await fetch("/api/ai/suggest-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ thread }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate reply")
      }

      const data = await response.json()
      return { messageId, reply: data.reply }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const analyzeTone = createAsyncThunk("ai/analyzeTone", async ({ messageContent, messageId }, { rejectWithValue }) => {
  try {
    console.log(`Analyzing tone for message: ${messageId}`);
    const response = await fetch("/api/ai/analyze-tone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: messageContent }),
    })

    if (!response.ok) {
      throw new Error("Failed to analyze tone")
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || "Tone analysis failed")
    }
    
    return { analysis: data.analysis, messageId }
  } catch (error) {
    console.error("Tone analysis error:", error);
    return rejectWithValue(error.message)
  }
})



export const queryOrgBrain = createAsyncThunk(
  "ai/queryOrgBrain",
  async ({ query }, { dispatch, rejectWithValue }) => {
    try {
      // Make a direct API call to the org-brain endpoint
      const response = await fetch("/api/ai/generate/org-brain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch AI response")
      }

      const data = await response.json()
      console.log("OrgBrain API response:", data);
      return data.response
    } catch (error) {
      console.error("Error in queryOrgBrain:", error);
      return rejectWithValue(error.message)
    }
  },
)

export const generateMeetingNotes = createAsyncThunk(
  "ai/generateMeetingNotes",
  async ({ channelId, threadId, workspaceId }, { rejectWithValue }) => {
    try {
      console.log(`Generating meeting notes for channel: ${channelId}, thread: ${threadId}`);
      const response = await fetch("/api/ai/generate-meeting-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          channelId, 
          threadId,
          workspaceId 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate meeting notes")
      }

      const data = await response.json()
      return data.meetingNotes
    } catch (error) {
      console.error("Error generating meeting notes:", error);
      return rejectWithValue(error.message)
    }
  },
)

const initialState = {
  orgBrainResponse: null,
  suggestedReplies: {},
  toneAnalysis: {},  // Changed to an object to store by messageId
  meetingNotes: null,
  loading: false,
  error: null,
}

export const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    clearAiResponse: (state) => {
      state.orgBrainResponse = null
    },
    clearSuggestedReply: (state, action) => {
      const { messageId } = action.payload
      delete state.suggestedReplies[messageId]
    },
    clearToneAnalysis: (state, action) => {
      if (action.payload && action.payload.messageId) {
        // Clear tone analysis for a specific message
        delete state.toneAnalysis[action.payload.messageId]
      } else {
        // Clear all tone analyses
        state.toneAnalysis = {}
      }
    },
    clearMeetingNotes: (state) => {
      state.meetingNotes = null
    },
  },
  extraReducers: (builder) => {
    builder
      // queryOrgBrain - handle Org Brain AI actions
      .addCase(queryOrgBrain.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(queryOrgBrain.fulfilled, (state, action) => {
        state.loading = false
        state.orgBrainResponse = action.payload
        console.log('Received orgBrainResponse:', action.payload) // Debug log
      })
      .addCase(queryOrgBrain.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // fetchAiResponse
      .addCase(fetchAiResponse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAiResponse.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.type === "orgBrain") {
          state.orgBrainResponse = action.payload.response
        }
      })
      .addCase(fetchAiResponse.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // generateReply
      .addCase(generateReply.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateReply.fulfilled, (state, action) => {
        state.loading = false
        state.suggestedReplies[action.payload.messageId] = action.payload.reply
      })
      .addCase(generateReply.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // analyzeTone
      .addCase(analyzeTone.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(analyzeTone.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload && action.payload.messageId) {
          // Store analysis by messageId
          state.toneAnalysis[action.payload.messageId] = action.payload.analysis
          console.log(`Stored tone analysis for message ${action.payload.messageId}:`, action.payload.analysis)
        }
      })
      .addCase(analyzeTone.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // generateMeetingNotes
      .addCase(generateMeetingNotes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateMeetingNotes.fulfilled, (state, action) => {
        state.loading = false
        state.meetingNotes = action.payload
      })
      .addCase(generateMeetingNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearAiResponse, clearSuggestedReply, clearToneAnalysis, clearMeetingNotes } = aiSlice.actions

export default aiSlice.reducer
