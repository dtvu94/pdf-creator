"use client";

import { useState, useRef, type RefObject } from "react";
import type { WizardResult } from "./types";

interface SignatureStepProps {
  resultRef: RefObject<WizardResult>;
  setReady: (ready: boolean) => void;
}

export function SignatureStep({ resultRef, setReady }: Readonly<SignatureStepProps>) {
  const [fileName, setFileName] = useState<string>("");
  const [keystoreBase64, setKeystoreBase64] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const updateResult = (ks: string, pw: string, r: string, loc: string, ci: string) => {
    const valid = ks.length > 0 && pw.length > 0;
    setReady(valid);
    if (valid) {
      resultRef.current.signature = {
        keystoreBase64: ks,
        keystorePassword: pw,
        reason: r || undefined,
        location: loc || undefined,
        contactInfo: ci || undefined,
      };
    } else {
      resultRef.current.signature = undefined;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1] ?? "";
      setKeystoreBase64(base64);
      updateResult(base64, password, reason, location, contactInfo);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div className="step-header">
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Digital Signature</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
          Sign the PDF with a digital certificate to prove its authenticity and integrity.
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>

          <div className="step-info-box">
            <strong style={{ color: "#1E293B" }}>What you need</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
              <li>A <strong>PKCS#12 keystore</strong> file (<code>.p12</code> or <code>.pfx</code>) containing your private key and certificate.</li>
              <li style={{ marginTop: 4 }}>The <strong>password</strong> for the keystore.</li>
            </ul>
          </div>

          {/* Keystore file upload */}
          <div>
            <label className="step-label">Keystore File (.p12 / .pfx)</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => fileRef.current!.click()}
                className="sig-upload-btn"
              >
                Choose File
              </button>
              <span style={{ fontSize: 12, color: fileName ? "#1E293B" : "#94A3B8" }}>
                {fileName || "No file selected"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".p12,.pfx"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Keystore password */}
          <div>
            <label className="step-label">Keystore Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                updateResult(keystoreBase64, e.target.value, reason, location, contactInfo);
              }}
              placeholder="Enter keystore password"
              className="modal-input step-field-input"
            />
          </div>

          {/* Optional fields */}
          <div className="sig-optional-section">
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>
              Optional — these fields appear in the signature properties when viewed in a PDF reader.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="step-label">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    updateResult(keystoreBase64, password, e.target.value, location, contactInfo);
                  }}
                  placeholder="e.g. Document approval"
                  className="modal-input step-field-input"
                />
              </div>

              <div>
                <label className="step-label">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    updateResult(keystoreBase64, password, reason, e.target.value, contactInfo);
                  }}
                  placeholder="e.g. Ho Chi Minh City, Vietnam"
                  className="modal-input step-field-input"
                />
              </div>

              <div>
                <label className="step-label">Contact Info</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => {
                    setContactInfo(e.target.value);
                    updateResult(keystoreBase64, password, reason, location, e.target.value);
                  }}
                  placeholder="e.g. signer@example.com"
                  className="modal-input step-field-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
