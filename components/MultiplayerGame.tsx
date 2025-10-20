"use client"

import { useState, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Badge } from "@/components/ui/badge"
import { Room } from "@/app/page"

export function MultiplayerGame({
  room,
  userId,
}: {
  room: Room
  userId: string
}) {
  const [value, setValue] = useState("")
  const isPlayer1 = room.player1_id === userId
  const myNum = isPlayer1 ? 1 : 2
  const opponentNum = isPlayer1 ? 2 : 1
  const myGuesses = room[`player${myNum}_guesses`] || []
  const myTurn = room.turn === myNum
  const mySecret = isPlayer1 ? room.player1_secret : room.player2_secret
  const opponentSecretReady = isPlayer1
    ? !!room.player2_secret
    : !!room.player1_secret

  const opponentGuesses = useMemo(() => {
    return room[`player${opponentNum}_guesses`] || []
  }, [room, opponentNum])

  const opponentLastGuess = useMemo(() => {
    const last = opponentGuesses[opponentGuesses.length - 1]
    return last ? last : null
  }, [opponentGuesses])

  const handleChange = (v: string) => setValue(v.replace(/[^0-9]/g, ""))

  const makeGuess = async () => {
    if (value.length !== 4 || !myTurn) return

    const opponentSecret = isPlayer1 ? room.player2_secret : room.player1_secret
    const correct = value
      .split("")
      .reduce((acc, d, i) => (d === opponentSecret?.[i] ? acc + 1 : acc), 0)

    const guesses = [...myGuesses, { guess: value, correct }]
    const nextTurn = isPlayer1 ? 2 : 1
    const winner = correct === 4 ? myNum : null

    await supabase
      .from("rooms")
      .update({
        [`player${myNum}_guesses`]: guesses,
        turn: nextTurn,
        winner,
      })
      .eq("id", room.id)

    setValue("")
  }

  return (
    <Card className="w-full max-w-sm mx-auto p-5 shadow-lg rounded-2xl">
      <CardContent className="space-y-4">
        {/* ===== Turn Indicator ===== */}
        <div className="flex items-center text-center justify-between border-b pb-4">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`h-3 w-3 rounded-full animate-pulse ${
                myTurn ? "bg-green-500" : "bg-orange-500"
              }`}
            />
            <p
              className={`font-semibold text-base ${
                myTurn ? "text-green-600" : "text-orange-600"
              }`}
            >
              {myTurn ? "Your turn" : "Their turn"}
            </p>
          </div>

          {mySecret && (
            <Badge
              variant="secondary"
              className="bg-green-600/10 text-muted-foreground text-sm px-3 py-1 rounded-lg"
            >
              Your code: <span className="f">{mySecret}</span>
            </Badge>
          )}
        </div>

        {/* ===== Opponent's Last Guess (compact inline) ===== */}
        {opponentSecretReady && opponentLastGuess && (
          <div className="flex items-center justify-between  py-2 px-4 w-full text-sm">
            {/* Left: Label */}
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              Their last guess
            </span>

            {/* Right: Guess + Correct */}
            <div className="flex text-muted-foreground items-baseline gap-2">
              <span>{opponentLastGuess.guess}</span>
              <span className="text-xs text-muted-foreground font-medium">
                {opponentLastGuess.correct}/4
              </span>
            </div>
          </div>
        )}

        {/* ===== Guess Input ===== */}
        {opponentSecretReady ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-center ">
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
              onClick={makeGuess}
              disabled={!myTurn || value.length < 4}
              className={`w-4/5 h-12 text-lg rounded-xl font-semibold mx-auto ${
                myTurn
                  ? ""
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {myTurn ? "Submit Guess" : "Waiting..."}
            </Button>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            Waiting for opponent to set their secret...
          </p>
        )}

        {/* ===== Guess History ===== */}
        {opponentSecretReady && (
          <div className="pt-4 border-t text-center">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground mb-3">
              Your Guesses
            </h3>

            <div className="max-h-48 overflow-y-auto space-y-2 px-1">
              {myGuesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No guesses yet.</p>
              ) : (
                myGuesses
                  .slice()
                  .reverse()
                  .map((g, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-muted/40 px-3"
                    >
                      {/* spaced-out digits like OTP slots */}
                      <div className="flex justify-center gap-2 text-lg font-semibold text-foreground">
                        {g.guess.split("").map((digit, idx) => (
                          <span
                            key={idx}
                            className="inline-block w-2 text-center"
                          >
                            {digit}
                          </span>
                        ))}
                      </div>

                      {/* correct count */}
                      <span
                        className={
                          g.correct > 0
                            ? "text-green-500"
                            : "text-muted-foreground" +
                              `text-xs ml-2 font-medium`
                        }
                      >
                        {g.correct}/4
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
