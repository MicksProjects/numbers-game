import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Room, leaveRoom } from "@/lib/services/roomService"
import { toast } from "sonner"

interface UseRoomManagementProps {
  roomId: string | undefined
  userId: string
  onRoomDeleted?: () => void
  onOpponentLeft?: () => void
}

export function useRoomManagement({
  roomId,
  userId,
  onRoomDeleted,
  onOpponentLeft,
}: UseRoomManagementProps) {
  const [room, setRoom] = useState<Room | undefined>()

  /**
   * Unified leave handler (used by both button and beforeunload)
   */
  const handleLeave = useCallback(
    async (useBeacon = false) => {
      if (!roomId || !room) return

      if (useBeacon) {
        // Browser is closing - use fetch with keepalive
        try {
          const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/leave_room`
          const headers = {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          }

          await fetch(baseUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ room_id: roomId, player_id: userId }),
            keepalive: true,
          })
        } catch (err) {
          console.warn("Failed to leave room on beforeunload:", err)
        }
      } else {
        // Normal leave via button
        const result = await leaveRoom(roomId, userId)

        if (!result.success) {
          toast.error(result.error)
          return
        }

        const { action } = result.data

        if (action === "deleted") {
          toast("Room deleted (no players left)")
        } else if (action === "promoted_guest") {
          toast("You left — opponent became new host")
        } else if (action === "guest_left") {
          toast("You left the game")
        }
      }
    },
    [roomId, userId, room]
  )

  /**
   * Setup beforeunload handler
   */
  useEffect(() => {
    if (!roomId || !userId || !room) return

    const handleBeforeUnload = () => {
      handleLeave(true)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [handleLeave, roomId, userId, room])

  /**
   * Setup realtime subscription
   */
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
            console.log("Room deleted")
            onRoomDeleted?.()
            return
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Room
            setRoom(updated)

            // Check if opponent left
            const isHost = updated.player1_id === userId
            const opponentLeft =
              (updated.player2_id === null && isHost) ||
              (updated.player1_id !== userId && !isHost)

            if (
              opponentLeft &&
              updated.game_state === "waiting_for_players"
            ) {
              toast("Your opponent left — the game has been reset")
              onOpponentLeft?.()
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, userId, onRoomDeleted, onOpponentLeft])

  return {
    room,
    setRoom,
    handleLeave,
  }
}
