"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Lobby } from "@/components/Lobby"
import { SecretEntry } from "@/components/SecretEntry"
import { MultiplayerGame } from "@/components/MultiplayerGame"
import { useClientId } from "@/lib/hooks/useClientId"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface Room {
  id: string
  player1_id: string | null
  player2_id: string | null
  player1_secret: string | null
  player2_secret: string | null
  player1_guesses: Array<{ guess: string; correct: number }>
  player2_guesses: Array<{ guess: string; correct: number }>
  turn: number | null
  winner: number | null
}

export default function PlayPage() {
  const userId = useClientId()
  const [roomId, setRoomId] = useState<string>()
  const [isHost, setIsHost] = useState(false)
  const [room, setRoom] = useState<Room>()
  const [hasSecret, setHasSecret] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const handleJoin = async (id: string, host: boolean) => {
    setIsHost(host)
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("❌ Failed to fetch room:", error)
      return
    }

    setRoom(data as Room)
    setRoomId(id)
  }

  const handleSetSecret = async (secret: string) => {
    const field = isHost ? "player1_secret" : "player2_secret"
    const { data, error } = await supabase
      .from("rooms")
      .update({ [field]: secret })
      .eq("id", roomId)
      .select()

    if (error) {
      console.error("❌ Failed to update secret:", error)
      return
    }
    if (data && data.length > 0) setRoom(data[0] as Room)
    setHasSecret(true)
  }

  const handleExitToLobby = useCallback(async () => {
    if (roomId) {
      await supabase.from("rooms").delete().eq("id", roomId)
    }
    // Reset all game state
    setRoom(undefined)
    setRoomId(undefined)
    setHasSecret(false)
    setGameOver(false)
  }, [roomId])

  // inside PlayPage
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (roomId) {
        await supabase.from("rooms").delete().eq("id", roomId)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            console.log("Room deleted — opponent left or game ended.")
            handleExitToLobby()
            return
          }

          const updated = payload.new as Room
          setRoom(updated)
          if (updated.winner !== null) {
            setGameOver(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [handleExitToLobby, roomId])

  // Inside PlayPage component
  useEffect(() => {
    const checkExistingRoom = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .maybeSingle()

      if (error) {
        console.error("❌ Failed to check existing room:", error)
        return
      }

      if (data) {
        setRoom(data as Room)
        setRoomId(data.id)
        setIsHost(data.player1_id === userId)
        setHasSecret(!!(data.player1_secret || data.player2_secret))
      }
    }

    checkExistingRoom()
  }, [userId])

  // Flow
  if (!roomId) return <Lobby onJoin={handleJoin} />
  if (!room) return <p className="text-center mt-10">Connecting...</p>
  if (!hasSecret) return <SecretEntry onSetSecret={handleSetSecret} />

  return (
    <>
      <MultiplayerGame
        room={room}
        userId={userId}
        onLeave={() => {
          setRoom(undefined)
          setRoomId(undefined)
          setHasSecret(false)
        }}
      />

      {/* Game Over Dialog */}
      <Dialog open={gameOver} onOpenChange={setGameOver}>
        <DialogContent className="text-center rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-600">
              Game Over 🎉
            </DialogTitle>
            <DialogDescription className="mt-2 text-base">
              {room?.winner
                ? room.winner === 1
                  ? "Player 1 wins!"
                  : "Player 2 wins!"
                : "Game finished!"}
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full mt-4" onClick={handleExitToLobby}>
            Back to Lobby
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
