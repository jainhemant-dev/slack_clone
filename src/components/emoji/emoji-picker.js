"use client"
import { useState } from "react"
import { Clock, Smile, Heart, ThumbsUp, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Emoji categories
const categories = [
  { id: "recent", name: "Recent", icon: Clock },
  { id: "smileys", name: "Smileys & Emotion", icon: Smile },
  { id: "people", name: "People & Body", icon: Heart },
  { id: "reactions", name: "Reactions", icon: ThumbsUp },
]

// Sample emoji data
const emojiData = {
  recent: ["👍", "❤️", "😊", "🎉", "🔥", "👏", "🙏", "🤔", "👀", "💯"],
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
  ],
  people: [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🫰",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🙏",
  ],
  reactions: [
    "👍",
    "👎",
    "❤️",
    "🎉",
    "🔥",
    "👀",
    "💯",
    "✅",
    "❌",
    "⭐",
    "🚀",
    "🙌",
    "👏",
    "🤔",
    "😂",
    "😢",
    "😡",
    "🤮",
    "👻",
    "💩",
  ],
}

export default function EmojiPicker({ onEmojiSelect }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("recent")

  // Filter emojis based on search query
  const filteredEmojis = searchQuery
    ? Object.values(emojiData)
        .flat()
        .filter((emoji) => emoji.includes(searchQuery))
    : emojiData[activeCategory]

  return (
    <div className="bg-[#222529] border border-[#2c2d33] rounded-lg shadow-lg w-64 overflow-hidden">
      <div className="p-2 border-b border-[#2c2d33]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis"
            className="bg-[#1a1d29] border-gray-600 pl-8 text-white placeholder-gray-400 h-8 text-sm"
          />
        </div>
      </div>

      {!searchQuery && (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-[#1a1d29] border-b border-[#2c2d33] w-full h-auto flex justify-between">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex-1 py-2 data-[state=active]:bg-[#222529] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-[#1264a3]"
              >
                <category.icon className="w-4 h-4" />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="p-2 max-h-60 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              className="w-6 h-6 flex items-center justify-center text-lg hover:bg-[#2c2d33] rounded"
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
