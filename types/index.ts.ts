// =============================================================================
// MIDDLEMAN.COM — CENTRALIZED TYPE DEFINITIONS
// Path: @/types/index.ts
// 1:1 mapping to Supabase schema (001_schema.sql) + UI/module prop types.
// =============================================================================

import type { ReactNode } from "react";

// -----------------------------------------------------------------------------
// 1. DATABASE ENUMS
// -----------------------------------------------------------------------------
export type UserRole = "BROKER" | "BUYER" | "ADMIN";

export type SubscriptionTier = "STARTER" | "PRO" | "ENTERPRISE";

export type ThemePreference = "DARK" | "LIGHT" | "SYSTEM";

export type ListingStatus =
  | "DRAFT"
  | "ACTIVE"
  | "UNDER_NDA"
  | "IN_DUE_DILIGENCE"
  | "CLOSED";

export type PofStatus =
  | "NOT_SUBMITTED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export type VaultStatus = "LOCKED" | "PENDING_REVIEW" | "UNLOCKED";

// -----------------------------------------------------------------------------
// 2. DATABASE ROW TYPES (1:1 with SQL tables)
// -----------------------------------------------------------------------------
export interface Profile {
  id: string;
  role: UserRole;
  company_name: string | null;
  aum_usd: number | null;
  verified_license_id: string | null;
  subscription_tier: SubscriptionTier;
  deals_closed_count: number;
  is_2fa_enabled: boolean;
  theme_preference: ThemePreference;
  created_at: string;
  updated_at: string;
}

export interface SellerListing {
  id: string;
  broker_id: string;
  anonymized_title: string;
  industry: string;
  ebitda_usd: number | null;
  asking_price_usd: number | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

/** Only ever fetched for a listing owner or a buyer with an UNLOCKED vault row. */
export interface SellerListingConfidential {
  listing_id: string;
  confidential_cim_url: string;
  created_at: string;
  updated_at: string;
}

export interface BuyerThesis {
  id: string;
  buyer_id: string;
  target_industries: string[];
  min_ebitda_usd: number | null;
  max_ebitda_usd: number | null;
  thesis_summary: string | null;
  // thesis_embedding intentionally omitted client-side (Phase 2 server-only field)
  created_at: string;
  updated_at: string;
}

export interface GatekeeperVaultAccess {
  id: string;
  listing_id: string;
  buyer_id: string;
  match_percentage_verified: boolean;
  pof_document_url: string | null;
  pof_status: PofStatus;
  nda_signed_at: string | null;
  vault_status: VaultStatus;
  verified_liquid_funds_usd: number | null;
  pof_verification_method: "MANUAL_UPLOAD" | "PLAID_AUTO" | null;
  created_at: string;
  updated_at: string;
}

export interface DealRoom {
  id: string;
  listing_id: string;
  buyer_id: string;
  broker_id: string;
  is_active: boolean;
  daily_room_name: string | null;
  daily_room_url: string | null;
  final_deal_value_usd: number | null;
  success_fee_percentage: number;
  success_fee_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface DealMessage {
  id: string;
  deal_room_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

export type ViewSessionType = "CIM_VIEW" | "VIDEO_CALL" | "DEAL_ROOM_CHAT";

export interface DocumentViewSession {
  id: string;
  listing_id: string;
  buyer_id: string;
  session_type: ViewSessionType;
  ip_address: string;
  user_agent: string | null;
  viewed_at: string;
}

// -----------------------------------------------------------------------------
// 3. COMPOSITE / JOINED VIEW TYPES (client-side convenience shapes)
// -----------------------------------------------------------------------------
export interface ListingWithMatch extends SellerListing {
  match_percentage: number;
  hard_filters_passed: boolean;
  vault_status: VaultStatus | null; // null = buyer has not requested access yet
}

export interface UnlockedListing extends SellerListing {
  confidential: SellerListingConfidential;
}

export interface DealRoomWithParticipants extends DealRoom {
  buyer: Pick<Profile, "id" | "company_name">;
  broker: Pick<Profile, "id" | "company_name">;
  listing: Pick<SellerListing, "id" | "anonymized_title">;
}

// -----------------------------------------------------------------------------
// 4. UI COLOR TOKENS (design system constants)
// -----------------------------------------------------------------------------
export const DARK_THEME_TOKENS = {
  background: "#0A0F1E",
  surface: "#111827",
  accent: "#2563EB",
  gold: "#F59E0B",
  success: "#10B981",
  textPrimary: "#F8FAFC",
  border: "#1F2937",
} as const;

export const LIGHT_THEME_TOKENS = {
  background: "#FFFFFF",
  surface: "#F8FAFC",
  accent: "#2563EB",
  gold: "#B45309",
  success: "#059669",
  textPrimary: "#0F172A",
  border: "#E2E8F0",
} as const;

export const THEME_TOKENS: Record<"DARK" | "LIGHT", typeof DARK_THEME_TOKENS> = {
  DARK: DARK_THEME_TOKENS,
  LIGHT: LIGHT_THEME_TOKENS,
};

// Retained for backward compatibility with earlier components referencing DESIGN_TOKENS.
export const DESIGN_TOKENS = DARK_THEME_TOKENS;

// -----------------------------------------------------------------------------
// 5. MODULE PROP TYPES
// -----------------------------------------------------------------------------

// --- Module A: Seller Studio ---------------------------------------------
export interface SellerStudioProps {
  broker: Profile;
  existingListing?: SellerListing | null;
  onSubmit: (payload: SellerStudioFormValues) => Promise<void>;
}

export interface SellerStudioFormValues {
  anonymized_title: string;
  industry: string;
  ebitda_usd: number | null;
  asking_price_usd: number | null;
  raw_confidential_cim_url: string; // sent to server for storage in confidential table
}

export interface PiiRedactionSpan {
  start: number;
  end: number;
  original_text: string;
  replacement_label: string; // e.g. "[Company Name]" -> "Project Stealth"
}

// --- Module B: Buyer Thesis Builder ----------------------------------------
export interface BuyerThesisBuilderProps {
  buyer: Profile;
  existingThesis?: BuyerThesis | null;
  onSubmit: (payload: BuyerThesisFormValues) => Promise<void>;
}

export interface BuyerThesisFormValues {
  target_industries: string[];
  min_ebitda_usd: number | null;
  max_ebitda_usd: number | null;
  thesis_summary: string;
}

// --- Module C: Match Feed ----------------------------------------------------
export interface MatchFeedProps {
  buyerId: string;
  listings: ListingWithMatch[];
  onRequestAccess: (listingId: string) => Promise<void>;
}

export interface MatchScoreBreakdown {
  hard_filters_passed: boolean;
  ebitda_in_range: boolean;
  industry_match: boolean;
  cosine_similarity: number; // 0-1
  final_score_percentage: number; // 0-100
}

// --- Module D: Gatekeeper Vault ----------------------------------------------
export interface GatekeeperVaultProps {
  listingId: string;
  buyerId: string;
  vaultAccess: GatekeeperVaultAccess | null;
  onSubmitPof: (fileUrl: string) => Promise<void>;
  onSignNda: () => Promise<void>;
}

export interface VaultGateState {
  matchGatePassed: boolean;
  pofGatePassed: boolean;
  ndaGatePassed: boolean;
  isFullyUnlocked: boolean;
}

// --- Deal Room / Messaging ----------------------------------------------------
export interface DealRoomProps {
  dealRoom: DealRoomWithParticipants;
  messages: DealMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => Promise<void>;
}

// --- Watermarking / Audit Trail ----------------------------------------------
export interface WatermarkData {
  email: string;
  ip_address: string;
  server_timestamp: string;
}

export interface WatermarkOverlayProps {
  listingId: string;
  sessionType: ViewSessionType;
  children: ReactNode;
  /** How often to refresh the watermark timestamp + re-verify the session, in ms. Default 60s. */
  refreshIntervalMs?: number;
}

// --- Video Call ----------------------------------------------------------------
export interface VideoCallRoomProps {
  dealRoomId: string;
  listingId: string;
}

// --- Seller Studio Screen ------------------------------------------------------
export interface ListingDetailsFormProps {
  onCreated: (listingId: string) => void;
}

export interface CimUploaderProps {
  listingId: string;
  onUploaded: () => void;
}

export interface RedactionSpanDraft {
  category: string;
  original_text: string;
  replacement_label: string;
  start_offset: number;
  end_offset: number;
  dismissed?: boolean;
}

export interface RedactionReviewCanvasProps {
  listingId: string;
  onConfirmed: () => void;
}

export interface AuditTrailPanelProps {
  listingId: string;
}

// --- Buyer Workspace Screen ------------------------------------------------------
export interface ThesisFormProps {
  onSaved: () => void;
}

export interface MatchFeedGridProps {
  onRequestAccess: (listingId: string) => void;
}

export interface VaultUnlockCardProps {
  listingId: string;
  onUnlocked: (dealRoomId: string) => void;
}

// --- Deal Room Screen ------------------------------------------------------------
export interface ChatPanelProps {
  dealRoomId: string;
  currentUserId: string;
}

// --- Plaid Proof of Funds --------------------------------------------------------
export interface PlaidConnectionStatus {
  connected: boolean;
  institution_name: string | null;
}

export interface ProofOfFundsResult {
  pof_status: "VERIFIED" | "REJECTED";
  verified_liquid_funds_usd: number;
  required_threshold_usd: number;
}

// -----------------------------------------------------------------------------
// 6. ERROR & ASYNC STATE HANDLING
// -----------------------------------------------------------------------------
export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: AppError | null;
}

export interface AppError {
  code: string;
  message: string;
  // Optional field-level validation errors (form use cases)
  fieldErrors?: Record<string, string>;
}

export const initialAsyncState = <T>(): AsyncState<T> => ({
  status: "idle",
  data: null,
  error: null,
});

// -----------------------------------------------------------------------------
// 7. SUPABASE DATABASE GENERIC (for typed client, e.g. createClient<Database>())
// -----------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      seller_listings: {
        Row: SellerListing;
        Insert: Omit<SellerListing, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<SellerListing>;
      };
      seller_listing_confidential: {
        Row: SellerListingConfidential;
        Insert: Omit<SellerListingConfidential, "created_at" | "updated_at">;
        Update: Partial<SellerListingConfidential>;
      };
      buyer_theses: {
        Row: BuyerThesis;
        Insert: Omit<BuyerThesis, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<BuyerThesis>;
      };
      gatekeeper_vault_access: {
        Row: GatekeeperVaultAccess;
        Insert: Omit<GatekeeperVaultAccess, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<GatekeeperVaultAccess>;
      };
      deal_rooms: {
        Row: DealRoom;
        Insert: Omit<DealRoom, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<DealRoom>;
      };
      deal_messages: {
        Row: DealMessage;
        Insert: Omit<DealMessage, "id" | "created_at"> & { id?: string };
        Update: Partial<DealMessage>;
      };
    };
  };
}

// =============================================================================
// END OF types/index.ts
// =============================================================================
