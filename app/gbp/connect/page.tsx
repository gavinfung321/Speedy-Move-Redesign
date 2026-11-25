import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect Google reviews",
  robots: { index: false, follow: false },
};

export default function ConnectGoogleReviews() {
  return (
    <section style={{ maxWidth: "36rem", margin: "4rem auto", padding: "0 1rem", color: "#1e1912" }}>
      <h1 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "2.4rem", fontWeight: 500 }}>
        Connect Google reviews
      </h1>
      <p style={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
        Sign in with the Google account that manages the Speedy Move listing. Use speedymovehk@gmail.com.
      </p>
      <p>
        <a
          href="/api/gbp/start"
          style={{
            display: "inline-block",
            borderRadius: "4px",
            background: "#fbba25",
            padding: "0.7rem 1rem",
            color: "#1e1912",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Sign in with Google
        </a>
      </p>
    </section>
  );
}
