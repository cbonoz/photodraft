import { ImageResponse } from "next/og";

export const alt = "PhotoDraft";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="url(#g)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#22d3ee" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M21 12h-3" />
        </svg>
        <div
          style={{
            marginTop: 24,
            fontSize: 64,
            fontWeight: 700,
            background: "linear-gradient(90deg, #22d3ee, #3b82f6, #a78bfa)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          PhotoDraft
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 24,
            color: "#94a3b8",
          }}
        >
          Upload photos, add players, and draft them turn by turn.
        </div>
      </div>
    ),
    { ...size }
  );
}
