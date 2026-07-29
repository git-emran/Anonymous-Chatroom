import { NextRequest, NextResponse } from "next/server"
import { redis } from "./lib/redis"
import { nanoid } from "nanoid"

export const proxy = async(req: NextRequest) => {
  const pathname = req.nextUrl.pathname
  const roomMatch = pathname.match(/^\/room\/([^/]+)$/)

  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url))

  const roomId = roomMatch[1]
  const meta = await redis.hgetall<{connected: string[]; createdAt: number}>(`meta:${roomId}`)

  if (!meta){
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url))
  }

  const existingToken = req.cookies.get("x-auth-token")?.value

  //USER IS ALLOWED TO JOIN: Some one refreshing
  if (existingToken && meta.connected.includes(existingToken)){
    return NextResponse.next()
  }


  //USER IS NOT ALLOWED TO JOIN
  //

  if (meta.connected.length >= 2){
    return NextResponse.redirect(new URL("/?error=room-full", req.url))
  }




  const response = NextResponse.next()

  const token = nanoid()

  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  })

  // Normalize connected array in case it was stored as string
  let connected = meta.connected;
  if (typeof connected === "string") connected = JSON.parse(connected);

  await redis.hset(`meta:${roomId}`, {
    connected: [...connected, token]
  })

  try {
    const { realtime } = await import("./lib/realtime")
    const joinMessage = {
      id: nanoid(),
      sender: "System",
      text: connected.length === 0 ? "Room creator joined." : "A user joined the room.",
      timeStamp: Date.now(),
      roomId
    }
    
    await redis.rpush(`messages:${roomId}`, { ...joinMessage, token: "system" })
    await realtime.channel(roomId).emit("chat.message", joinMessage)
  } catch (err) {
    console.error("Failed to emit join message", err)
  }

  return response

}

export const config = {
  matcher: "/room/:path*"
}
