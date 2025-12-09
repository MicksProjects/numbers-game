"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Share2 } from "lucide-react"
import { shareRoom } from "@/lib/utils/shareRoom"
import { Room } from "@/lib/services/roomService"
import { HowToPlay } from "@/components/HowToPlay"

export function SecretEntry({
  onSetSecret,
  room,
  userId,
}: {
  onSetSecret: (secret: string) => void
  room?: Room
  userId?: string
}) {
  const [value, setValue] = useState("")

  const handleChange = (v: string) => setValue(v.replace(/[^0-9]/g, ""))

  // Check if user is waiting for opponent (is host and no player2)
  const isWaitingForOpponent = room && room.player1_id === userId && !room.player2_id

  return (
    <Card className="w-full max-w-sm mx-auto p-6 text-center space-y-4">
      <CardHeader className="space-y-3">
        <CardTitle className="text-xl font-bold">
          Enter your secret code
        </CardTitle>
        <HowToPlay />
      </CardHeader>

      <CardContent className="flex flex-col justify-center items-center w-full">
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
          onClick={() => onSetSecret(value)}
          disabled={value.length < 4}
          className="w-full mt-6"
        >
          Confirm Secret
        </Button>

        {isWaitingForOpponent && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Waiting for opponent to join...
            </p>
            <Button
              onClick={() => room && shareRoom(room.id, room.room_name)}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              <Share2 className="h-5 w-5" />
              Share Room with Friend
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
