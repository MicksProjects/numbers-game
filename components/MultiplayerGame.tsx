"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
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
  const myGuesses = room[`player${myNum}_guesses`] || []
  const myTurn = room.turn === myNum
  const opponentSecretReady = isPlayer1
    ? !!room.player2_secret
    : !!room.player1_secret

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
    <Card className="w-full max-w-sm mx-auto mt-10 p-6 text-center space-y-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {myTurn ? "Your Turn" : "Waiting for Opponent..."}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col justify-center items-center w-full">
        {!opponentSecretReady ? (
          <p className="text-muted-foreground">
            Waiting for opponent to set their secret...
          </p>
        ) : (
          <>
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

            <Button
              onClick={makeGuess}
              disabled={!myTurn || value.length < 4}
              className="w-full mt-4 h-12 text-lg rounded-xl"
            >
              Guess
            </Button>

            <div className="mt-6 text-left max-h-64 overflow-y-auto">
              {myGuesses.toReversed().map((g, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b py-1 font-mono"
                >
                  <span>{g.guess}</span>
                  <span className="text-muted-foreground">{g.correct}/4</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
