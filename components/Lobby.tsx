"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"
import {
  createRoom as createRoomService,
  joinRoom as joinRoomService,
  fetchAvailableRooms,
  Room,
} from "@/lib/services/roomService"
import { shareRoom } from "@/lib/utils/shareRoom"
import { HowToPlay } from "@/components/HowToPlay"

export function Lobby({
  onJoin,
  userId,
}: {
  onJoin: (roomId: string) => void
  userId: string
}) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState("")

  const fetchRooms = async () => {
    const result = await fetchAvailableRooms()
    if (result.success) {
      setRooms(result.data)
    }
  }

  useEffect(() => {
    fetchRooms()
    const channel = supabase
      .channel("rooms-lobby")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: "game_state=eq.waiting_for_players",
        },
        async () => {
          await fetchRooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createRoom = async () => {
    if (!roomName.trim()) {
      toast.warning("Please enter a room name")
      return
    }

    setCreating(true)
    const result = await createRoomService(userId, roomName)
    setCreating(false)

    if (result.success) {
      toast.success("Room created successfully!")
      onJoin(result.data.id)
    } else {
      toast.error(result.error)
    }
  }

  const joinRoom = async (roomId: string) => {
    setLoading(true)
    const result = await joinRoomService(roomId, userId)
    setLoading(false)

    if (result.success) {
      toast.success("Joined room successfully!")
      onJoin(roomId)
    } else {
      if (result.code === "ROOM_FULL") {
        toast.info(result.error)
      } else {
        toast.error(result.error)
      }
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto p-6 text-center gap-0">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold">Join a Room</CardTitle>
        <HowToPlay />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Room list */}
        <div className="space-y-2 max-h-80 overflow-y-auto p-2">
          {rooms.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No open rooms yet. Create one below!
            </p>
          )}

          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex justify-between items-center border-b last:border-none py-2 px-1"
            >
              <div className="text-left">
                <p className="font-semibold truncate">
                  {room.room_name || "Unnamed Room"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Host: {room.player1_id?.slice(0, 6)}...
                </p>
              </div>

              {room.player1_id !== userId && room.player2_id !== userId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => joinRoom(room.id)}
                  disabled={loading}
                >
                  Join
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => shareRoom(room.id, room.room_name)}
                  className="gap-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Create room */}
        <div className="space-y-2">
          <Input
            placeholder="Enter a room name..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <Button
            onClick={createRoom}
            disabled={creating}
            className="w-full h-12 text-lg mt-2"
          >
            {creating ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Creating Room...
              </>
            ) : (
              "Create New Room"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
