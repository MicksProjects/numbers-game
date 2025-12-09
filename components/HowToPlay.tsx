"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle, Lightbulb } from "lucide-react"

export function HowToPlay() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        How to Play
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              How to Play Numbers Game
            </DialogTitle>
            <DialogDescription>
              A two-player code-breaking game
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {/* Game Overview */}
            <div>
              <h3 className="font-semibold text-base mb-2">🎯 Objective</h3>
              <p className="text-muted-foreground">
                Be the first to guess your opponent&apos;s 4-digit secret code!
              </p>
            </div>

            {/* How to Play */}
            <div>
              <h3 className="font-semibold text-base mb-2">📝 How to Play</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Create or join a room</strong> - Start a new game or join an existing one
                </li>
                <li>
                  <strong className="text-foreground">Choose your secret code</strong> - Pick any 4-digit number (e.g., 1234, 5678)
                </li>
                <li>
                  <strong className="text-foreground">Take turns guessing</strong> - Try to figure out your opponent&apos;s code
                </li>
                <li>
                  <strong className="text-foreground">Use the feedback</strong> - Each guess tells you how many digits are correct and in the right position
                </li>
                <li>
                  <strong className="text-foreground">First to 4/4 wins!</strong> - Get all 4 digits in the right spots to win
                </li>
              </ol>
            </div>

            {/* Understanding Feedback */}
            <div>
              <h3 className="font-semibold text-base mb-2">🔍 Understanding Feedback</h3>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div>
                  <p className="font-medium">Your guess: 1234</p>
                  <p className="text-muted-foreground text-xs">
                    Feedback: <span className="text-green-600 font-semibold">2/4</span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    → 2 digits are correct and in the right position
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 The feedback shows correct digits in correct positions only. Use logic to figure out which digits and where!
              </p>
            </div>

            {/* Pro Tip */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-2 items-start">
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Pro Tip
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Start with a guess like <strong>1234</strong> to see how many digits match.
                    Then try <strong>5678</strong> to narrow down which numbers are in the code.
                    Use the feedback to eliminate possibilities!
                  </p>
                </div>
              </div>
            </div>

            {/* Example Game */}
            <div>
              <h3 className="font-semibold text-base mb-2">🎮 Example</h3>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                <p className="font-medium">Opponent&apos;s secret: 7392 (hidden)</p>
                <div className="space-y-1">
                  <p>
                    <span className="font-mono">1234</span> → <span className="text-green-600">1/4</span> (one digit correct)
                  </p>
                  <p>
                    <span className="font-mono">5678</span> → <span className="text-green-600">1/4</span> (one digit correct)
                  </p>
                  <p>
                    <span className="font-mono">9012</span> → <span className="text-green-600">2/4</span> (two digits correct)
                  </p>
                  <p>
                    <span className="font-mono">7392</span> → <span className="text-green-600 font-bold">4/4</span> ✨ You win!
                  </p>
                </div>
              </div>
            </div>

            {/* Sharing */}
            <div>
              <h3 className="font-semibold text-base mb-2">📤 Playing with Friends</h3>
              <p className="text-muted-foreground">
                Created a room? Tap the <strong>Share</strong> button to send the link to a friend.
                They&apos;ll join automatically when they click it!
              </p>
            </div>
          </div>

          <Button onClick={() => setOpen(false)} className="w-full">
            Got it, let&apos;s play!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
