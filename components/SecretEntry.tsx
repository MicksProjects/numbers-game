"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function SecretEntry({
  onSetSecret,
}: {
  onSetSecret: (secret: string) => void
}) {
  const [value, setValue] = useState("")

  const handleChange = (v: string) => setValue(v.replace(/[^0-9]/g, ""))

  return (
    <Card className="w-full max-w-sm mx-auto p-6 text-center space-y-4">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Enter your secret code
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col justify-center items-center w-full">
        <InputOTP maxLength={4} value={value} onChange={handleChange}>
          <InputOTPGroup>
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="w-14 h-16 text-2xl border-1"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Button
          onClick={() => onSetSecret(value)}
          disabled={value.length < 4}
          className="w-full mt-6"
        >
          Confirm Secret
        </Button>
      </CardContent>
    </Card>
  )
}
