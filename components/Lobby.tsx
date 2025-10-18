"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { useClientId } from "@/lib/hooks/useClientId"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Room {
  id: string
  room_name: string | null
  player1_id: string
  player2_id: string | null
  created_at: string
}

export function Lobby({
  onJoin,
}: {
  onJoin: (roomId: string, isHost: boolean) => void
}) {
  const userId = useClientId()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState("")

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, room_name, player1_id, player2_id, created_at")
      .is("player2_id", null)
      .order("created_at", { ascending: false })
    if (!error && data) setRooms(data)
  }

  useEffect(() => {
    fetchRooms()
    const channel = supabase
      .channel("rooms-lobby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
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
      toast.warning("Please enter a room name.")
      return
    }
    setCreating(true)
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ player1_id: userId, room_name: roomName.trim() }])
      .select()
      .single()
    setCreating(false)

    if (error) {
      console.error(error)
      toast.error("Failed to create room.")
      return
    }

    toast.success("Room created successfully!")
    if (data) onJoin(data.id, true)
  }

  const joinRoom = async (roomId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from("rooms")
      .update({ player2_id: userId })
      .eq("id", roomId)
      .is("player2_id", null)
      .select()
      .single()
    setLoading(false)

    if (error) {
      console.error(error)
      toast.error("Failed to join room.")
      return
    }
    if (!data) {
      toast.info("Room is already full or no longer available.")
      return
    }

    toast.success("Joined room successfully!")
    onJoin(roomId, false)
  }

  return (
    <Card className="w-full max-w-sm mx-auto mt-10 p-6 text-center space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Join a Room</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Room list */}
        <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-2">
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
                  Host: {room.player1_id.slice(0, 6)}...
                </p>
              </div>

              {room.player1_id !== userId ? (
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
                  variant="outline"
                  disabled
                  className="opacity-50"
                >
                  Your Room
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Create room */}
        <div className="space-y-2">
          <Input
            placeholder="Enter a room name"
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
