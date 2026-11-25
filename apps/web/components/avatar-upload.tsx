"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./avatar";

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads a profile photo straight to Supabase Storage and puts its URL in a hidden field. */
export function AvatarUpload({ userId, name, initial }: { userId: string; name: string; initial: string | null }) {
  const [url, setUrl] = useState(initial ?? "");
  const [status, setStatus] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setStatus("Use a JPG, PNG or WebP photo.");
    if (file.size > MAX_BYTES) return setStatus("That photo is over 5 MB. Try a smaller one.");
    setStatus("Uploading…");
    const ext = file.type.split("/")[1];
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) return setStatus(`Upload failed: ${error.message}`);
    setUrl(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
    setStatus("Photo ready. Press Save to keep it.");
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} url={url || null} size={72} />
      <div className="space-y-1">
        <label className="btn-secondary cursor-pointer py-1.5">
          {url ? "Change photo" : "Add a photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {url && (
          <button type="button" className="ml-2 text-sm text-slate-500 hover:text-red-600" onClick={() => { setUrl(""); setStatus("Photo removed. Press Save to confirm."); }}>
            Remove
          </button>
        )}
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>
      <input type="hidden" name="avatar_url" value={url} />
    </div>
  );
}
