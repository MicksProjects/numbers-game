"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (password: string) => void
  roomName: string
  loading?: boolean
}

export function PasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  roomName,
  loading = false,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(password)
  }

  const handleClose = () => {
    setPassword("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            &quot;{roomName}&quot; is password-protected. Enter the password to
            join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter room password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !password.trim()}>
                {loading ? "Joining..." : "Join Room"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
