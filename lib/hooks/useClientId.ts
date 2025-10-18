// hooks/useClientId.ts
import { useMemo } from "react"
import { v4 as uuidv4 } from "uuid"

export function useClientId() {
  return useMemo(() => {
    if (typeof window === "undefined") return ""
    const stored = window.localStorage.getItem("user_id")
    if (stored) return stored
    const id = uuidv4()
    localStorage.setItem("user_id", id)
    return id
  }, [])
}
