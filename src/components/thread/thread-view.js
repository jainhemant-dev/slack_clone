"use client"

import { useState, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { X, Send, Loader2 } from "lucide-react"
import { fetchThreadMessages, addThreadComment, clearActiveThread } from "@/lib/features/threads/threadsSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import EmojiPicker from "@/components/emoji/emoji-picker"
import Image from "next/image"

export default function ThreadView() {
  const [comment, setComment] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef(null)
  const dispatch = useDispatch()
  const { activeThreadId, threads, loading } = useSelector((state) => state.threads)
  const { users } = useSelector((state) => state.data)
  const { user } = useSelector((state) => state.auth)

  const threadMessages = activeThreadId ? threads[activeThreadId]?.messages || [] : []
  const parentMessage = threadMessages[0] || null

  useEffect(() => {
    if (activeThreadId) {
      dispatch(fetchThreadMessages(activeThreadId))
    }
  }, [activeThreadId, dispatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threadMessages])

  const handleSendComment = () => {
    if (comment.trim() && activeThreadId) {
      dispatch(addThreadComment({ threadId: activeThreadId, comment }))
      setComment("")
    }
  }

  const handleEmojiSelect = (emoji) => {
    setComment((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  if (!activeThreadId) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#1a1d29] border-l border-[#2c2d33] z-20 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[#2c2d33]">
        <h2 className="text-lg font-semibold text-white">Thread</h2>
        <Button variant="ghost" size="icon" onClick={() => dispatch(clearActiveThread())}>
          <X className="h-5 w-5 text-[#611f69]" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading && threadMessages.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#611f69]" />
          </div>
        ) : (
          <>
            {parentMessage && (
              <div className="pb-4 border-b border-[#2c2d33]">
                <div className="flex gap-3">
                  <Avatar className="w-9 h-9 mt-1">
                    <Image
                      height={36}
                      width={36}
                      src={
                        users.find((u) => u.id === parentMessage.userId)?.avatar ||
                        "/placeholder.svg?height=36&width=36" ||
                        "/placeholder.svg"
                      }
                      alt="User avatar"
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#350d36]">
                        {users.find((u) => u.id === parentMessage.userId)?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-[#611f69]">{parentMessage.time}</span>
                    </div>
                    <div className="text-[#350d36] whitespace-pre-wrap leading-relaxed">{parentMessage.content}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {threadMessages.slice(1).map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 mt-1">
                    <Image
                      height={32}
                      width={32}
                      src={users.find((u) => u.id === msg.userId)?.avatar || "/placeholder.svg?height=32&width=32"}
                      alt="User avatar"
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#350d36]">
                        {users.find((u) => u.id === msg.userId)?.name || msg.userName || "Unknown User"}
                      </span>
                      <span className="text-xs text-[#611f69]">
                        {msg.time ||
                          new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-[#350d36] whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-[#2c2d33]">
        <div className="relative">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Reply in thread..."
            className="bg-white border-gray-300 text-[#350d36] placeholder-[#611f69] pr-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendComment()
              }
            }}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <span className="text-lg">😊</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400"
              onClick={handleSendComment}
              disabled={!comment.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {showEmojiPicker && (
            <div className="absolute right-0 bottom-full mb-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
