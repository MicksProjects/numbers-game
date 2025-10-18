"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { useClientId } from "@/lib/hooks/useClientId"
import { Loader2 } from "lucide-react"

interface Room {
  id: string
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

  // Fetch open rooms
  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, player1_id, player2_id, created_at")
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
          // Refresh list whenever a room changes
          await fetchRooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createRoom = async () => {
    setCreating(true)
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ player1_id: userId }])
      .select()
      .single()
    setCreating(false)
    if (error) {
      console.error(error)
      return
    }
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
      return
    }
    if (data) onJoin(roomId, false)
  }

  return (
    <Card className="w-full max-w-sm mx-auto mt-10 p-6 text-center space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Join a Room</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
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
              <span className="font-mono text-sm truncate">{room.id}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => joinRoom(room.id)}
                disabled={loading}
              >
                Join
              </Button>
            </div>
          ))}
        </div>

        <Button
          onClick={createRoom}
          disabled={creating}
          className="w-full h-12 text-lg mt-4"
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
      </CardContent>
    </Card>
  )
}
