"use client";

import { api } from "./api";

export function DeleteProfileButton({ id }: { id: string }) {
  return (
    <button
      className="btn-danger"
      onClick={async () => {
        if (!confirm("Remove this profile and its conversations?")) return;
        try {
          await api(`/api/profiles/${id}`, { method: "DELETE" });
          window.location.reload();
        } catch (e) {
          alert((e as Error).message);
        }
      }}
    >
      Remove
    </button>
  );
}
