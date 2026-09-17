"use client";

import { useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className} !pr-12`.trim()}
      />
      <button
        type="button"
        data-password-toggle
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setVisible((v) => !v);
          // #region agent log
          fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" },
            body: JSON.stringify({
              sessionId: "bf3566",
              runId: "post-fix",
              hypothesisId: "P",
              location: "PasswordInput.tsx:toggle",
              message: "Password visibility toggled",
              data: { visible: !visible, path: typeof window !== "undefined" ? window.location.pathname : null },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        }}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-slate-200"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
