// =============================================================================
// MIDDLEMAN.COM — ENCRYPTED DEAL ROOM
// Path: app/deal-room/[id]/page.tsx
// Server Component: verifies the caller is a participant before rendering
// anything confidential (RLS also enforces this at the DB level — this is a
// UX-level early exit, not the source of truth for security).
// =============================================================================

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WatermarkOverlay from "@/components/vault/WatermarkOverlay";
import VideoCallRoom from "@/components/deal-room/VideoCallRoom";
import ChatPanel from "@/components/deal-room/ChatPanel";
import SuccessFeeLedger from "@/components/deal-room/SuccessFeeLedger";

export default async function DealRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: dealRoom } = await supabase
    .from("deal_rooms")
    .select(
      "id, listing_id, buyer_id, broker_id, is_active, final_deal_value_usd, success_fee_percentage, success_fee_amount"
    )
    .eq("id", id)
    .maybeSingle();

  if (!dealRoom) {
    notFound();
  }

  const isParticipant = user.id === dealRoom.buyer_id || user.id === dealRoom.broker_id;
  if (!isParticipant) {
    redirect("/buyer");
  }

  const isBroker = user.id === dealRoom.broker_id;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16" style={{ background: "var(--bg)" }}>
      <h1
        className="mb-8 text-3xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Encrypted Deal Room
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WatermarkOverlay listingId={dealRoom.listing_id} sessionType="VIDEO_CALL">
            <VideoCallRoom dealRoomId={dealRoom.id} listingId={dealRoom.listing_id} />
          </WatermarkOverlay>

          <WatermarkOverlay listingId={dealRoom.listing_id} sessionType="DEAL_ROOM_CHAT">
            <ChatPanel dealRoomId={dealRoom.id} currentUserId={user.id} />
          </WatermarkOverlay>
        </div>

        <div>
          <SuccessFeeLedger
            dealRoomId={dealRoom.id}
            isBroker={isBroker}
            finalDealValueUsd={dealRoom.final_deal_value_usd}
            successFeePercentage={dealRoom.success_fee_percentage}
            successFeeAmount={dealRoom.success_fee_amount}
          />
        </div>
      </div>
    </main>
  );
}
