import { configureStore } from '@reduxjs/toolkit'
import userSlice from '@/store/app/userSlice'
import profileSlice from '@/store/app/profileSlice'
import messageSlice from '@/store/app/messageSlice'
import channelSlice from '@/store/app/channelSlice'
import workspaceSlice from '@/store/app/workspaceSlice'
import aiSlice from '@/store/app/aiSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      user: userSlice,
      profile: profileSlice,
      messages: messageSlice,
      channel: channelSlice,
      workspace: workspaceSlice,
      ai: aiSlice,
    }
  })
}
