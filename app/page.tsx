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
import { toast } from "sonner"

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

  useEffect(() => {
    if (!roomId || !userId || !room) return

    const handleBeforeUnload = async () => {
      try {
        const isHost = room.player1_id === userId
        const isGuest = room.player2_id === userId

        if (!isHost && !isGuest) return

        const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rooms?id=eq.${roomId}`
        const headers = {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }

        let updatedBody = {}

        // 🔹 Case 1: Host leaves
        if (isHost) {
          if (room.player2_id) {
            // Promote player2 -> player1
            updatedBody = {
              player1_id: room.player2_id,
              player2_id: null,
              player1_secret: room.player2_secret,
              player2_secret: null,
              player1_guesses: room.player2_guesses,
              player2_guesses: [],
            }
          } else {
            // No one else in room
            updatedBody = { player1_id: null }
          }
        }

        // 🔹 Case 2: Guest leaves
        if (isGuest) {
          updatedBody = { player2_id: null }
        }

        // Step 1: update
        const res = await fetch(baseUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify(updatedBody),
          keepalive: true,
        })
        const updated = await res.json()

        // Step 2: if room empty → delete
        if (
          updated?.length > 0 &&
          !updated[0].player1_id &&
          !updated[0].player2_id
        ) {
          await fetch(baseUrl, {
            method: "DELETE",
            headers,
            keepalive: true,
          })
        }
      } catch (err) {
        console.warn("⚠️ Failed to handle beforeunload leave", err)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [roomId, userId, room])

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

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Room

            // Opponent left (you remain)
            const opponentLeft =
              (updated.player1_id === null && !isHost) ||
              (updated.player2_id === null && isHost)

            if (opponentLeft) {
              toast("Your opponent left — the game has been reset.")
              setHasSecret(false) // force re-enter secret
            }

            setRoom(updated)
            if (updated.winner !== null) setGameOver(true)
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
  }, [handleExitToLobby, isHost, roomId])

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
