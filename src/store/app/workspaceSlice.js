import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/client";

// Async thunk for inviting a user to a workspace
export const inviteWorkspaceMember = createAsyncThunk(
  "workspace/inviteWorkspaceMember",
  async ({ workspaceId, email, role = 'member' }, { rejectWithValue }) => {
    try {
      const response = await apiFetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to invite user');
    }
  }
);

// Async thunk for fetching workspace members
export const fetchWorkspaceMembers = createAsyncThunk(
  "workspace/fetchWorkspaceMembers",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await apiFetch(`/api/workspaces/${workspaceId}/members`);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch workspace members');
    }
  }
);

// Async thunk for updating workspace members
export const updateWorkspaceMembers = createAsyncThunk(
  "workspace/updateWorkspaceMembers",
  async ({ workspaceId, updates }, { rejectWithValue }) => {
    try {
      const response = await apiFetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'PATCH',
        body: JSON.stringify({ updates }),
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update workspace members');
    }
  }
);

const initialState = {
  currentWorkspace: null,
  workspaces: [],
  members: [],
  isLoading: false,
  inviteStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  successMessage: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    resetInviteStatus: (state) => {
      state.inviteStatus = 'idle';
      state.error = null;
      state.successMessage = null;
    },
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle inviteWorkspaceMember
      .addCase(inviteWorkspaceMember.pending, (state) => {
        state.isLoading = true;
        state.inviteStatus = 'loading';
        state.error = null;
      })
      .addCase(inviteWorkspaceMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inviteStatus = 'succeeded';
        state.successMessage = 'User invited successfully';
        
        // Add the new member to the members array if it exists
        if (action.payload && action.payload.member) {
          state.members.push(action.payload.member);
        }
      })
      .addCase(inviteWorkspaceMember.rejected, (state, action) => {
        state.isLoading = false;
        state.inviteStatus = 'failed';
        state.error = action.payload || 'Failed to invite user';
      })
      
      // Handle fetchWorkspaceMembers
      .addCase(fetchWorkspaceMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = action.payload.members || [];
      })
      .addCase(fetchWorkspaceMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch workspace members';
      })
      
      // Handle updateWorkspaceMembers
      .addCase(updateWorkspaceMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWorkspaceMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Process the results to update or remove members
        if (action.payload && action.payload.results) {
          action.payload.results.forEach(result => {
            if (result.success) {
              if (result.action === 'remove') {
                // Remove member
                state.members = state.members.filter(member => 
                  member.id.toString() !== result.userId.toString()
                );
              } else if (result.action === 'update' && result.role) {
                // Update member role
                const memberIndex = state.members.findIndex(
                  member => member.id.toString() === result.userId.toString()
                );
                if (memberIndex !== -1) {
                  state.members[memberIndex].role = result.role;
                }
              }
            }
          });
        }
      })
      .addCase(updateWorkspaceMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update workspace members';
      });
  },
});

export const { resetInviteStatus, setCurrentWorkspace } = workspaceSlice.actions;

// Selectors
export const selectWorkspaceMembers = (state) => state.workspace.members;
export const selectCurrentWorkspace = (state) => state.workspace.currentWorkspace;
export const selectInviteStatus = (state) => state.workspace.inviteStatus;
export const selectWorkspaceError = (state) => state.workspace.error;
export const selectWorkspaceSuccessMessage = (state) => state.workspace.successMessage;
export const selectIsWorkspaceLoading = (state) => state.workspace.isLoading;

export default workspaceSlice.reducer;
