"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AlertTriangle, CheckCircle, HelpCircle, AlertCircle, Loader2, X } from "lucide-react"
import { analyzeTone, clearToneAnalysis } from "@/store/app/aiSlice"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ToneAnalyzer({ content, onClose }) {
  const dispatch = useDispatch()
  const { toneAnalysis, loading } = useSelector((state) => state.ai)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (content && content.trim().length > 10) {
      dispatch(analyzeTone({ messageContent: content }))
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }

    return () => {
      dispatch(clearToneAnalysis())
    }
  }, [content, dispatch])

  if (!isVisible || !content) return null
  console.log(toneAnalysis)
  const getToneIcon = () => {
    if (!toneAnalysis) return <Loader2 className="h-4 w-4 animate-spin" />

    switch (toneAnalysis?.category) {
      case "aggressive":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "weak":
        return <HelpCircle className="h-4 w-4 text-blue-400" />
      case "confusing":
        return <AlertCircle className="h-4 w-4 text-purple-400" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getImpactIcon = () => {
    if (!toneAnalysis) return <Loader2 className="h-4 w-4 animate-spin" />

    switch (toneAnalysis.impact.level) {
      case "high":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "low":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <HelpCircle className="h-4 w-4 text-blue-400" />
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-[#222529] rounded-md text-xs">
      {loading ? (
        <div className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
          <span className="text-gray-400">Analyzing...</span>
        </div>
      ) : (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <span className="text-gray-300">Tone:</span>
                  {getToneIcon()}
                  <span className="capitalize text-gray-300">{toneAnalysis?.tone.category || "Analyzing..."}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{toneAnalysis?.tone.explanation}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-gray-500">|</span>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <span className="text-gray-300">Impact:</span>
                  {getImpactIcon()}
                  <span className="capitalize text-gray-300">{toneAnalysis?.impact.level || "Analyzing..."}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{toneAnalysis?.impact.explanation}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {toneAnalysis?.suggestions?.length > 0 && (
            <>
              <span className="text-gray-500">|</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <HelpCircle className="h-3 w-3 text-blue-400" />
                      <span className="text-blue-400">Suggestions</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <ul className="list-disc pl-4">
                      {toneAnalysis.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={onClose}>
            <X className="h-3 w-3 text-gray-400" />
          </Button>
        </>
      )}
    </div>
  )
}
