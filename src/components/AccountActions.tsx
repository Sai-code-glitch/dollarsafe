"use client";

import { useState } from "react";
import { api } from "./api";

export function AccountActions({ hasBilling }: { hasBilling: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      {hasBilling && (
        <button
          className="btn-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const { url } = await api<{ url: string }>("/api/billing/portal", { body: {} });
              window.location.href = url;
            } catch (e) {
              alert((e as Error).message);
              setBusy(false);
            }
          }}
        >
          Manage billing
        </button>
      )}
      <a className="btn-secondary" href="/api/account/export">Download my data</a>
      <button
        className="btn-danger"
        onClick={async () => {
          const typed = prompt("This cancels any subscription and permanently deletes your account, profiles and conversations. Type DELETE to confirm.");
          if (typed !== "DELETE") return;
          try {
            await api("/api/account/delete", { body: { confirm: "DELETE" } });
            window.location.href = "/";
          } catch (e) {
            alert((e as Error).message);
          }
        }}
      >
        Delete account
      </button>
    </>
  );
}
