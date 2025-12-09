import { toast } from "sonner"

/**
 * Share a room with friends using Web Share API (mobile) or clipboard (desktop)
 */
export async function shareRoom(roomId: string, roomName?: string | null) {
  // Build the share URL
  const url = `${window.location.origin}?room=${roomId}`
  const title = roomName || "Numbers Game"
  const text = `Join my room in Numbers Game! ${roomName ? `"${roomName}"` : ""}`

  // Try Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      })
      toast.success("Room shared!")
      return true
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err)
        // Fall through to clipboard
      } else {
        // User cancelled, don't show error
        return false
      }
    }
  }

  // Fallback to clipboard (desktop)
  try {
    await navigator.clipboard.writeText(url)
    toast.success("Room link copied to clipboard!")
    return true
  } catch (err) {
    console.error("Clipboard failed:", err)
    toast.error("Failed to share room")
    return false
  }
}
