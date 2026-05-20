'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function FeedPhotoSlider() {
  const [urls, setUrls] = useState<string[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const load = () => {
      fetch('/api/feed/thumbnails')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setUrls(data)
            setCurrent(0)
          }
        })
        .catch(() => {})
    }
    load()
    const t = setInterval(load, 3 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (urls.length < 2) return
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % urls.length)
    }, 3000)
    return () => clearInterval(t)
  }, [urls.length])

  if (urls.length === 0) return null

  return (
    <div className="relative flex-1 w-full overflow-hidden rounded-2xl">
      {urls.map((url, i) => (
        <div
          key={url}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ))}
    </div>
  )
}
