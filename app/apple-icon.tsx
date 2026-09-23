import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon: same mark as app/icon.svg, full-bleed (iOS applies its own rounding).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7B61FF 0%, #B455F0 60%, #F062A8 100%)",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round">
          <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="none" />
          <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-28 12 12)" opacity={0.9} />
        </svg>
      </div>
    ),
    size
  );
}
