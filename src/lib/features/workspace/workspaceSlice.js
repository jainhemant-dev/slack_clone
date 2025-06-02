import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Async thunks for workspace operations
export const createWorkspace = createAsyncThunk("workspace/create", async (workspaceData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workspaceData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to create workspace")
    }

    const data = await response.json()
    return data.workspace
  } catch (error) {
    return rejectWithValue(error.message || "Failed to create workspace")
  }
})

export const fetchWorkspaceDetails = createAsyncThunk(
  "workspace/fetchDetails",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`)

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to fetch workspace details")
      }

      const data = await response.json()
      return data.workspace
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch workspace details")
    }
  },
)

export const createChannel = createAsyncThunk(
  "workspace/createChannel",
  async ({ workspaceId, channelData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(channelData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to create channel")
      }

      const data = await response.json()
      return data.channel
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create channel")
    }
  },
)

export const inviteUserToWorkspace = createAsyncThunk(
  "workspace/inviteUser",
  async ({ workspaceId, email }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to invite user")
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message || "Failed to invite user")
    }
  },
)

const initialState = {
  currentWorkspace: null,
  channels: [],
  members: [],
  loading: false,
  error: null,
}

export const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    clearWorkspaceError: (state) => {
      state.error = null
    },
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload
    },
    addChannel: (state, action) => {
      state.channels.push(action.payload)
    },
    updateChannel: (state, action) => {
      const index = state.channels.findIndex((c) => c.id === action.payload.id)
      if (index !== -1) {
        state.channels[index] = action.payload
      }
    },
    addMember: (state, action) => {
      state.members.push(action.payload)
    },
    removeMember: (state, action) => {
      state.members = state.members.filter((m) => m.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Create workspace
      .addCase(createWorkspace.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.loading = false
        state.currentWorkspace = action.payload
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to create workspace"
      })

      // Fetch workspace details
      .addCase(fetchWorkspaceDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWorkspaceDetails.fulfilled, (state, action) => {
        state.loading = false
        state.currentWorkspace = action.payload
        state.channels = action.payload.channels || []
        state.members = action.payload.members || []
      })
      .addCase(fetchWorkspaceDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to fetch workspace details"
      })

      // Create channel
      .addCase(createChannel.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.loading = false
        state.channels.push(action.payload)
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to create channel"
      })

      // Invite user
      .addCase(inviteUserToWorkspace.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(inviteUserToWorkspace.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(inviteUserToWorkspace.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to invite user"
      })
  },
})

export const { clearWorkspaceError, setCurrentWorkspace, addChannel, updateChannel, addMember, removeMember } =
  workspaceSlice.actions

export default workspaceSlice.reducer
