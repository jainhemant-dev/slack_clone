"use client"

import { useState, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Smile,
  Paperclip,
  AtSign,
  Mic,
  Send,
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Code,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
// import { sendWebSocketMessage } from "@/lib/middleware/websocketMiddleware"
// import { addMessage } from "@/lib/features/data/dataSlice"
import ToneAnalyzer from "@/components/tone-analyzer"
import EmojiPicker from "@/components/emoji/emoji-picker"
import { v4 as uuidv4 } from "uuid"
import { selectMe } from "@/store/app/profileSlice"

export default function MessageInputBox({ channelId, directMessageTo, onSend }) {   //  onSend({ messagebody: { content: value }, channelId });
  const [message, setMessage] = useState("")
  const [showToneAnalyzer, setShowToneAnalyzer] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiButtonRef = useRef(null)
  const dispatch = useDispatch()
  // const { connected } = useSelector((state) => state.websocket)
  const user = useSelector(selectMe)
  // const isOfflineMode = useSelector((state) => state.websocket.reconnectAttempts >= 2)

  // Show tone analyzer when message is long enough
  const handleMessageChange = (e) => {
    setMessage(e.target.value)
    // setShowToneAnalyzer(e.target.value.trim().length > 10)
  }

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      onSend({ messagebody: { content: message }, channelId });
      // Generate a unique ID for the message
      // const messageId = uuidv4()

      // const newMessage = {
      //   id: messageId,
      //   userId: user?.id || "user-current", // Use authenticated user ID if available
      //   channelId,
      //   directMessageTo,
      //   content: message,
      //   time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      //   reactions: [],
      // }

      // Add message to local state immediately for responsive UI
      // dispatch(addMessage(newMessage))

      // Send message through WebSocket
      // if (connected || isOfflineMode) {
      //   try {
      //     dispatch(
      //       sendWebSocketMessage({
      //         type: "NEW_MESSAGE",
      //         payload: newMessage,
      //       }),
      //     )
      //   } catch (error) {
      //     console.error("Error sending message:", error)
      //   }
      // }

      setMessage("")
      setShowToneAnalyzer(false)
    }
  }

  return (
    <div className="p-6 border-t border-[#2c2d33]">
      <div className="w-2/3 bg-[#1a1d29] border border-gray-600 rounded-lg">
        <div className="flex items-center gap-2 p-2 border-b border-gray-600">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-4 bg-gray-600" />
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
            <Code className="w-4 h-4" />
          </Button>
        </div>

        {showToneAnalyzer && (
          <div className="px-3 pt-2">
            <ToneAnalyzer content={message} onClose={() => setShowToneAnalyzer(false)} />
          </div>
        )}

        <div className="p-3">
          <Input
            value={message}
            onChange={handleMessageChange}
            placeholder={`Message ${channelId ? "#" + channelId : directMessageTo}   `}
            // ${isOfflineMode ? " (offline mode)" : !connected ? " (offline)" : ""
            //   }


            className="bg-transparent border-none text-white placeholder-gray-400 focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between p-3 pt-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="relative">
              <Button
                ref={emojiButtonRef}
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-400"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-4 h-4" />
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-50">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
              <AtSign className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            // className={`${connected || isOfflineMode ? "bg-green-600 hover:bg-green-700" : "bg-gray-600"} text-white`}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
