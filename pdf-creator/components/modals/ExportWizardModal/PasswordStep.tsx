"use client";

import { useState, useEffect, type RefObject } from "react";
import type { WizardResult } from "./types";

interface PasswordStepProps {
  resultRef: RefObject<WizardResult>;
  setReady: (ready: boolean) => void;
}

export function PasswordStep({ resultRef, setReady }: Readonly<PasswordStepProps>) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = password !== confirm;
  const empty = password.length === 0;

  useEffect(() => { setReady(false); }, [setReady]);

  const updateReady = (pw: string, cf: string) => {
    const valid = pw.length > 0 && pw === cf;
    setReady(valid);
    if (valid) {
      resultRef.current.password = pw;
    } else {
      resultRef.current.password = undefined;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div className="step-header">
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Password Protection</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
          Set a password that will be required to open the exported PDF.
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
          <div>
            <label className="step-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                updateReady(e.target.value, confirm);
              }}
              placeholder="Enter password"
              className="modal-input pw-field-input"
              autoFocus
            />
          </div>

          <div>
            <label className="step-label">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                updateReady(password, e.target.value);
              }}
              placeholder="Confirm password"
              className="modal-input pw-field-input"
            />
            {!empty && mismatch && (
              <div className="pw-error">
                Passwords do not match.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
