import { ImageResponse } from "next/og";
import { experience, profile } from "@/data/profile";

export const alt = `${profile.name} · ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const current = experience.find((job) => job.end === null) ?? experience[0];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#14171f",
          color: "#e5e9f0",
          border: "2px solid #2e3440",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#8590a4" }}>
          <span style={{ color: "#e5e9f0" }}>fidel</span>
          <span>@</span>
          <span style={{ color: "#58a6ff" }}>fedora</span>
          <span>:~$ whoami</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            {profile.name}
            <span style={{ color: "#e5a50a" }}>.</span>
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#94a3b8" }}>
            {profile.role} · <span style={{ color: "#58a6ff", marginLeft: 12 }}>{profile.focus.join(" · ")}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#8590a4" }}>
          <span>
            {current.role} @ {current.company}
          </span>
          <span style={{ color: "#10b981" }}>● {profile.location.short}</span>
        </div>
      </div>
    ),
    size,
  );
}
