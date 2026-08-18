// =============================================================================
// MIDDLEMAN.COM — SELLER STUDIO (Step 2: CIM Upload)
// Path: @/components/seller/CimUploader.tsx
// Enforces Core Logic Rule #2: max 25MB, .pdf only.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { UploadCloud, FileWarning } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CimUploaderProps } from "@/types";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export default function CimUploader({ listingId, onUploaded }: CimUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function validateFile(file: File): string | null {
    if (file.type !== "application/pdf") {
      return "Please upload a valid PDF document under 25MB.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "Please upload a valid PDF document under 25MB.";
    }
    return null;
  }

  async function handleFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFileName(file.name);
    setIsUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to upload a document.");
        return;
      }

      const storagePath = `${session.user.id}/${listingId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("cim-documents")
        .upload(storagePath, file, { upsert: true, contentType: "application/pdf" });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Trigger the AI auto-redaction pipeline.
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sanitize-cim-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ storage_path: storagePath, listing_id: listingId }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Non-fatal: document is uploaded and safely stored; redaction
        // processing can be retried from the review step.
        setError(
          "Document uploaded — automated redaction is still processing. You can continue and refresh the review step shortly."
        );
      }

      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listingId]
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors"
        style={{
          borderColor: isDragging ? "var(--accent)" : "var(--border)",
          background: "var(--surface)",
        }}
      >
        <UploadCloud size={28} style={{ color: "var(--text-secondary)" }} />
        <p style={{ color: "var(--text-primary)" }}>
          {isUploading
            ? "Uploading…"
            : fileName
            ? fileName
            : "Drag & drop your CIM PDF here, or click to browse"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          PDF only · Max 25MB
        </p>
        <input
          type="file"
          accept="application/pdf"
          className="absolute h-0 w-0 opacity-0"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-500">
          <FileWarning size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
