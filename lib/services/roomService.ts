import { supabase } from "@/lib/supabaseClient"

export interface Room {
  id: string
  room_name: string | null
  player1_id: string | null
  player2_id: string | null
  player1_secret: string | null
  player2_secret: string | null
  player1_guesses: Array<{ guess: string; correct: number }>
  player2_guesses: Array<{ guess: string; correct: number }>
  turn: number | null
  winner: number | null
  game_state:
    | "waiting_for_players"
    | "waiting_for_secrets"
    | "in_progress"
    | "finished"
  created_at: string
  password: string | null
  deleted_at: string | null
}

export type RoomServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

/**
 * Create a new room
 */
export async function createRoom(
  hostId: string,
  roomName: string,
  password?: string
): Promise<RoomServiceResult<Room>> {
  const { data, error } = await supabase
    .from("rooms")
    .insert([
      {
        player1_id: hostId,
        room_name: roomName.trim(),
        game_state: "waiting_for_players",
        password: password?.trim() || null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Failed to create room:", error)
    return { success: false, error: "Failed to create room" }
  }

  return { success: true, data: data as Room }
}

/**
 * Join an existing room using RPC function
 */
export async function joinRoom(
  roomId: string,
  playerId: string,
  password?: string
): Promise<RoomServiceResult<Room>> {
  const { data, error } = await supabase.rpc("join_room", {
    room_id: roomId,
    player_id: playerId,
    password_attempt: password || null,
  })

  if (error) {
    console.error("Failed to join room:", error)

    if (error.message.includes("invalid_password")) {
      return {
        success: false,
        error: "Incorrect password",
        code: "INVALID_PASSWORD",
      }
    }

    if (error.message.includes("room_full_or_invalid")) {
      return {
        success: false,
        error: "Room is full or no longer available",
        code: "ROOM_FULL",
      }
    }

    return { success: false, error: "Failed to join room" }
  }

  return { success: true, data: data as Room }
}

/**
 * Set player secret using RPC function
 */
export async function setPlayerSecret(
  roomId: string,
  playerId: string,
  secret: string
): Promise<RoomServiceResult<Room>> {
  const { data, error } = await supabase.rpc("set_player_secret", {
    room_id: roomId,
    player_id: playerId,
    secret,
  })

  if (error) {
    console.error("Failed to set secret:", error)
    return { success: false, error: "Failed to set secret" }
  }

  return { success: true, data: data as Room }
}

/**
 * Leave room using RPC function (works for both host and guest)
 */
export async function leaveRoom(
  roomId: string,
  playerId: string
): Promise<RoomServiceResult<{ action: string; new_host_id?: string }>> {
  const { data, error } = await supabase.rpc("leave_room", {
    room_id: roomId,
    player_id: playerId,
  })

  if (error) {
    console.error("Failed to leave room:", error)
    return { success: false, error: "Failed to leave room" }
  }

  return {
    success: true,
    data: data as { action: string; new_host_id?: string },
  }
}

/**
 * Fetch available rooms for lobby
 */
export async function fetchAvailableRooms(): Promise<
  RoomServiceResult<Room[]>
> {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, room_name, player1_id, player2_id, game_state, created_at, password"
    )
    .eq("game_state", "waiting_for_players")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch rooms:", error)
    return { success: false, error: "Failed to fetch rooms" }
  }

  return { success: true, data: data as Room[] }
}

/**
 * Get room by ID
 */
export async function getRoom(
  roomId: string
): Promise<RoomServiceResult<Room>> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single()

  if (error) {
    console.error("Failed to fetch room:", error)
    return { success: false, error: "Failed to fetch room" }
  }

  return { success: true, data: data as Room }
}

/**
 * Check if user is already in a room
 */
export async function findUserRoom(
  userId: string
): Promise<RoomServiceResult<Room | null>> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    console.error("Failed to check existing room:", error)
    return { success: false, error: "Failed to check existing room" }
  }

  return { success: true, data: data as Room | null }
}

/**
 * Submit a guess
 */
export async function submitGuess(
  room: Room,
  playerId: string,
  guess: string
): Promise<RoomServiceResult<Room>> {
  const isPlayer1 = room.player1_id === playerId
  const playerNum = isPlayer1 ? 1 : 2
  const opponentSecret = isPlayer1 ? room.player2_secret : room.player1_secret

  // Calculate correct digits
  const correct = guess
    .split("")
    .reduce(
      (acc, digit, i) => (digit === opponentSecret?.[i] ? acc + 1 : acc),
      0
    )

  const currentGuesses = isPlayer1 ? room.player1_guesses : room.player2_guesses
  const newGuesses = [...currentGuesses, { guess, correct }]
  const nextTurn = isPlayer1 ? 2 : 1
  const winner = correct === 4 ? playerNum : null

  const updatePayload = {
    [`player${playerNum}_guesses`]: newGuesses,
    turn: winner ? room.turn : nextTurn, // Don't change turn if game over
    ...(winner && { winner, game_state: "finished" }),
  }

  const { data, error } = await supabase
    .from("rooms")
    .update(updatePayload)
    .eq("id", room.id)
    .select()
    .single()

  if (error) {
    console.error("Failed to submit guess:", error)
    return { success: false, error: "Failed to submit guess" }
  }

  return { success: true, data: data as Room }
}
