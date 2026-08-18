// =============================================================================
// MIDDLEMAN.COM — VIDEO CALL INTEGRATION
// Path: @/components/deal-room/VideoCallRoom.tsx
//
// Fetches a Daily.co room + scoped meeting token from create-video-room, then
// embeds Daily's prebuilt call UI in an iframe — wrapped in the SAME
// WatermarkOverlay used for CIM viewing, so video calls get the identical
// email/IP/timestamp leak-deterrence watermark (Core Logic Rule #5).
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import WatermarkOverlay from "@/components/vault/WatermarkOverlay";
import { createClient } from "@/lib/supabase/client";
import type { VideoCallRoomProps } from "@/types";

interface VideoRoomData {
  room_url: string;
  meeting_token: string;
}

export default function VideoCallRoom({ dealRoomId, listingId }: VideoCallRoomProps) {
  const [videoRoom, setVideoRoom] = useState<VideoRoomData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  async function fetchRoom(): Promise<VideoRoomData | null> {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setErrorMessage("You must be signed in to join this call.");
      return null;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-video-room`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ deal_room_id: dealRoomId }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      setErrorMessage(result.error ?? "Could not start the video call.");
      return null;
    }

    return { room_url: result.room_url, meeting_token: result.meeting_token };
  }

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        const room = await fetchRoom();
        if (!cancelled && room) setVideoRoom(room);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load video call.");
        }
      }
    }

    loadRoom();
    return () => {
      cancelled = true;
    };
  }, [dealRoomId]);

  // Fail-safe: network heartbeat. If the browser goes offline mid-call, show
  // "Reconnecting..." instead of a crashed/frozen frame, and re-fetch a fresh
  // single-use meeting token (Daily.co tokens are short-lived) once back online.
  useEffect(() => {
    function handleOffline() {
      setIsReconnecting(true);
    }

    async function handleOnline() {
      if (!isReconnecting) return;
      try {
        const room = await fetchRoom();
        if (room) setVideoRoom(room);
      } finally {
        setIsReconnecting(false);
      }
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReconnecting, dealRoomId]);

  if (isReconnecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg bg-[#111827]">
        <p className="text-sm text-slate-400">Reconnecting to Encrypted Room…</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-red-500/30 bg-[#111827] p-8 text-center">
        <p className="text-sm text-red-400">{errorMessage}</p>
      </div>
    );
  }

  if (!videoRoom) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg bg-[#111827]">
        <p className="text-sm text-slate-400">Connecting to secure video room…</p>
      </div>
    );
  }

  const embedUrl = `${videoRoom.room_url}?t=${videoRoom.meeting_token}`;

  return (
    <WatermarkOverlay listingId={listingId} sessionType="VIDEO_CALL">
      <iframe
        src={embedUrl}
        allow="camera; microphone; fullscreen; display-capture"
        className="h-[500px] w-full rounded-lg border-0"
        title="Middleman.com Secure Deal Room Video Call"
      />
    </WatermarkOverlay>
  );
}
