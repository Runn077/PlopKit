import { useState, useRef } from 'react'

export function useToast() {
  const [message, setMessage] = useState('')
  const [fading, setFading] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const show = (msg: string) => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    setMessage(msg)
    setFading(false)

    timers.current.push(setTimeout(() => setFading(true), 2500))
    timers.current.push(
      setTimeout(() => {
        setMessage('')
        setFading(false)
      }, 3000)
    )
  }

  return { message, fading, show }
}