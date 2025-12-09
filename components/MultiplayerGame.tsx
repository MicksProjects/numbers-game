"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Badge } from "@/components/ui/badge"
import { Room, submitGuess } from "@/lib/services/roomService"
import { toast } from "sonner"
import { Share2 } from "lucide-react"
import { shareRoom } from "@/lib/utils/shareRoom"
import { HowToPlay } from "@/components/HowToPlay"

export function MultiplayerGame({
  room,
  userId,
  onLeave,
}: {
  room: Room
  userId: string
  onLeave: () => void
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

    const result = await submitGuess(room, userId, value)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setValue("")
    // Room update will come via realtime subscription
  }

  const leaveGame = () => {
    // Leave logic is now handled by parent component via useRoomManagement hook
    onLeave()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 justify-between items-center">
        <Button onClick={leaveGame} variant="outline" size="sm">
          Leave Game
        </Button>
        <HowToPlay />
      </div>
      <Card className="w-full max-w-sm mx-auto p-4 shadow-lg rounded-2xl relative">
        {/* Leave Game Button */}

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
                Your code: <span className="font-mono ml-1">{mySecret}</span>
              </Badge>
            )}
          </div>

          {/* ===== Opponent's Last Guess ===== */}
          {opponentSecretReady && opponentLastGuess && (
            <div className="flex items-center justify-between py-2 px-4 w-full text-sm">
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                Their last guess
              </span>

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
            <div className="flex flex-col items-center gap-3">
              <p className="text-center text-muted-foreground">
                {room.player2_id
                  ? "Waiting for opponent to set their secret..."
                  : "Waiting for opponent to join..."}
              </p>
              {!room.player2_id && (
                <Button
                  onClick={() => shareRoom(room.id, room.room_name)}
                  variant="default"
                  className="w-full gap-2"
                  size="lg"
                >
                  <Share2 className="h-5 w-5" />
                  Share Room with Friend
                </Button>
              )}
            </div>
          )}

          {/* ===== Guess History ===== */}
          {opponentSecretReady && (
            <div className="pt-4 border-t text-center">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground mb-3">
                Your Guesses
              </h3>

              <div className="max-h-48 overflow-y-auto space-y-2 px-1">
                {myGuesses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No guesses yet.
                  </p>
                ) : (
                  myGuesses
                    .slice()
                    .reverse()
                    .map((g, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-muted/40 px-3"
                      >
                        <div className="flex justify-center gap-3 text-lg font-semibold text-foreground">
                          {g.guess.split("").map((digit, idx) => (
                            <span
                              key={idx}
                              className="inline-block w-3 text-center"
                            >
                              {digit}
                            </span>
                          ))}
                        </div>
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
    </div>
  )
}
