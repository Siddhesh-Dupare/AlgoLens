"use client";

import { X } from "lucide-react";

interface AboutDialogProps {
  onClose: () => void;
}

export default function AboutDialog({ onClose }: AboutDialogProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "90vw",
          background: "#1e1e1e",
          border: "1px solid #3c3c3c",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "8px 10px",
            borderBottom: "1px solid #2d2d2d",
          }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8a8a8a",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "8px 24px 24px", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "8px auto 12px",
              borderRadius: 12,
              background: "#534AB7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            A
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#e2e8f0" }}>
            AlgoLens
          </div>
          <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
            Version 1.0.0
          </div>

          <p
            style={{
              fontSize: 13,
              color: "#a1a1aa",
              lineHeight: 1.6,
              margin: "14px 0",
            }}
          >
            A cross-platform DSA algorithm visualization system with hybrid
            AI-assisted pattern recognition.
          </p>

          <div style={{ fontSize: 12, color: "#cca700", marginBottom: 12 }}>
            Built for IEEE PuneCon 2026
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#a1a1aa",
              lineHeight: 1.8,
              textAlign: "left",
              background: "#18181b",
              border: "1px solid #2a2a2f",
              borderRadius: 6,
              padding: "10px 14px",
            }}
          >
            <div>
              <strong style={{ color: "#cccccc" }}>Author:</strong> Siddhesh
              Anandrao Dupare
            </div>
            <div>
              <strong style={{ color: "#cccccc" }}>Supervisor:</strong> Dr.
              Netraja C. Mulay
            </div>
            <div>
              <strong style={{ color: "#cccccc" }}>Institution:</strong>{" "}
              Progressive Education Society&apos;s Modern College of
              Engineering, Pune
            </div>
          </div>

          <a
            href="https://github.com/Siddhesh-Dupare/AlgoLens"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 14,
              fontSize: 12,
              color: "#60a5fa",
              textDecoration: "none",
            }}
          >
            GitHub Repository ↗
          </a>

          <div>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 16,
                background: "#2563eb",
                border: "none",
                borderRadius: 5,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                padding: "7px 20px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
