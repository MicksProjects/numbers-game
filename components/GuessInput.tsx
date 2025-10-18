"use client"

import { useRef, useState } from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function NumberGuessGame() {
  const [value, setValue] = useState("")
  const [guesses, setGuesses] = useState<{ number: string; correct: number }[]>(
    []
  )
  const [win, setWin] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const secret = useRef(
    Math.floor(1000 + Math.random() * 9000).toString()
  ).current

  const handleChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "")
    setValue(numeric)
  }

  const handleGuess = () => {
    if (value.length !== 4) return
    const correct = value
      .split("")
      .reduce((acc, digit, i) => (digit === secret[i] ? acc + 1 : acc), 0)

    setGuesses([...guesses, { number: value, correct }])
    setValue("")

    if (correct === 4) setWin(true)
  }

  return (
    <>
      <Card className="mt-4 p-4 w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Numbers Game</CardTitle>
          <p className="text-sm text-muted-foreground">
            Guess the 4-digit secret
          </p>
        </CardHeader>

        <CardContent>
          <div className="flex justify-center mb-4">
            <InputOTP maxLength={4} value={value} onChange={handleChange}>
              <InputOTPGroup>
                {[0, 1, 2, 3].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-14 h-16 text-2xl border-1"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleGuess}
            disabled={value.length < 4}
            className="w-full mt-4 h-12 text-lg rounded-xl"
          >
            Guess
          </Button>

          {/* Reveal button */}
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevealed(!revealed)}
            >
              {revealed ? "Hide Answer" : "Reveal Answer"}
            </Button>
          </div>

          {/* Revealed answer display */}
          {revealed && (
            <div className="mt-2 text-center">
              <Badge variant="secondary" className="text-base py-1 px-3">
                Secret: <span className="font-mono ml-1">{secret}</span>
              </Badge>
            </div>
          )}

          <div className="mt-6 max-h-64 overflow-y-auto scroll-smooth">
            {guesses.toReversed().map((g, i) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b text-base font-mono"
              >
                <span>{g.number}</span>
                <span className="text-muted-foreground">{g.correct}/4</span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="text-center text-sm text-muted-foreground">
          Guess the 4-digit secret number
        </CardFooter>
      </Card>

      <Dialog open={win} onOpenChange={setWin}>
        <DialogContent className="rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-600">
              You Won! 🎉
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              You guessed the secret number{" "}
              <span className="font-mono">{secret}</span> in {guesses.length}{" "}
              tries.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="w-full mt-4"
            onClick={() => {
              setGuesses([])
              setValue("")
              setWin(false)
            }}
          >
            Play Again
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
