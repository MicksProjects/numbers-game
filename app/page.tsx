"use client"

import { useCallback, useEffect, useState } from "react"
import { Lobby } from "@/components/Lobby"
import { SecretEntry } from "@/components/SecretEntry"
import { MultiplayerGame } from "@/components/MultiplayerGame"
import { useClientId } from "@/lib/hooks/useClientId"
import { useRoomManagement } from "@/lib/hooks/useRoomManagement"
import {
  Room,
  getRoom,
  setPlayerSecret,
  findUserRoom,
  joinRoom as joinRoomService,
} from "@/lib/services/roomService"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export type { Room }

export default function PlayPage() {
  const userId = useClientId()
  const [roomId, setRoomId] = useState<string>()
  const [gameOver, setGameOver] = useState(false)

  // Room management hook handles realtime subscription and leave logic
  const { room, setRoom, handleLeave } = useRoomManagement({
    roomId,
    userId,
    onRoomDeleted: () => {
      // Reset to lobby
      setRoomId(undefined)
      setRoom(undefined)
      setGameOver(false)
    },
    onOpponentLeft: () => {
      // Opponent left, no action needed - game_state already updated
    },
  })

  // Join room handler (from Lobby)
  const handleJoin = useCallback(
    async (id: string) => {
      const result = await getRoom(id)
      if (result.success) {
        setRoom(result.data)
        setRoomId(id)
      } else {
        toast.error(result.error)
      }
    },
    [setRoom]
  )

  // Set secret handler (from SecretEntry)
  const handleSetSecret = useCallback(
    async (secret: string) => {
      if (!roomId) return

      const result = await setPlayerSecret(roomId, userId, secret)
      if (result.success) {
        setRoom(result.data)
      } else {
        toast.error(result.error)
      }
    },
    [roomId, userId, setRoom]
  )

  // Exit to lobby handler (from game over dialog)
  const handleExitToLobby = useCallback(async () => {
    await handleLeave(false)
    setRoomId(undefined)
    setRoom(undefined)
    setGameOver(false)
  }, [handleLeave, setRoom])

  // Check for game over
  useEffect(() => {
    if (room?.game_state === "finished") {
      setGameOver(true)
    }
  }, [room?.game_state])

  // Check if user was already in a room (reconnection) or joining via URL
  useEffect(() => {
    const checkExistingRoom = async () => {
      // Check for room ID in URL parameter
      const params = new URLSearchParams(window.location.search)
      const urlRoomId = params.get("room")

      if (urlRoomId) {
        // Try to join room from URL
        const roomResult = await getRoom(urlRoomId)
        if (roomResult.success) {
          const urlRoom = roomResult.data

          // Check if user is already in this room
          const isInRoom =
            urlRoom.player1_id === userId || urlRoom.player2_id === userId

          if (isInRoom) {
            // Already in room, just reconnect
            setRoom(urlRoom)
            setRoomId(urlRoom.id)
          } else if (urlRoom.game_state === "waiting_for_players") {
            // Check if room is password protected
            if (urlRoom.password) {
              // Password required - user will need to enter it in lobby
              toast.info("This room requires a password. Enter it to join.")
              // Don't auto-join, let them go to lobby
            } else {
              // Room is available, actually join it
              const joinResult = await joinRoomService(urlRoomId, userId)
              if (joinResult.success) {
                toast.success("Joined room successfully!")
                setRoom(joinResult.data)
                setRoomId(urlRoomId)
              } else {
                if (joinResult.code === "ROOM_FULL") {
                  toast.info(joinResult.error)
                } else {
                  toast.error(joinResult.error)
                }
              }
            }
          } else {
            toast.info("This room is no longer available")
          }
        } else {
          toast.error("Room not found")
        }

        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname)
        return
      }

      // Check for existing room (normal reconnection)
      const result = await findUserRoom(userId)

      if (result.success && result.data) {
        const existingRoom = result.data

        // Only rejoin if room is still valid
        if (existingRoom.game_state !== "finished") {
          setRoom(existingRoom)
          setRoomId(existingRoom.id)
        }
      }
    }

    if (userId) {
      checkExistingRoom()
    }
  }, [userId, setRoom])

  // Determine current view based on game state
  const renderView = () => {
    if (!roomId || !room) {
      return <Lobby onJoin={handleJoin} userId={userId} />
    }

    const isHost = room.player1_id === userId
    const mySecret = isHost ? room.player1_secret : room.player2_secret

    // Need to set secret
    if (!mySecret && room.game_state !== "finished") {
      return (
        <SecretEntry
          onSetSecret={handleSetSecret}
          room={room}
          userId={userId}
        />
      )
    }

    // In game
    return (
      <MultiplayerGame
        room={room}
        userId={userId}
        onLeave={async () => {
          await handleLeave(false)
          // Reset to lobby
          setRoomId(undefined)
          setRoom(undefined)
        }}
      />
    )
  }

  return (
    <>
      {renderView()}

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
