import { useEffect, useRef, useState } from "react"

type Props = {
  onScan: (code: string) => void
}

export function ScannerInput({ onScan }: Props) {
  const [value, setValue] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (value.trim()) onScan(value.trim())
          setValue("")
        }
      }}
      style={{
        position: "inherit",
        width: 350,
        top: 10,
        left: 10
      }}
    />
  )
}