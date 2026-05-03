import { ImageResponse } from "next/og";

export const alt = "BatiFlow - Devis & factures pour artisans";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#F8FAFC",
          color: "#0F172A",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(135deg, #F8FAFC 0%, #EEF6FF 48%, #FFF7ED 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 70,
            right: 70,
            bottom: 70,
            display: "flex",
            border: "1px solid rgba(30, 58, 138, 0.14)",
            borderRadius: 28,
            background: "rgba(255, 255, 255, 0.78)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "82px 88px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 600,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 46,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: "#1E3A8A",
                    color: "#FFFFFF",
                    fontSize: 30,
                    fontWeight: 800,
                  }}
                >
                  B
                </div>
                <div
                  style={{
                    marginLeft: 18,
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#1E3A8A",
                  }}
                >
                  BatiFlow
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: 68,
                    lineHeight: 1.02,
                    fontWeight: 900,
                    color: "#0F172A",
                  }}
                >
                  Devis & factures pour artisans
                </div>
                <div
                  style={{
                    marginTop: 26,
                    maxWidth: 560,
                    fontSize: 30,
                    lineHeight: 1.35,
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Créez, envoyez et faites signer vos devis en quelques clics.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#475569",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#F97316",
                  marginRight: 12,
                }}
              />
              Pensé pour les artisans du bâtiment
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 18,
                top: 38,
                display: "flex",
                flexDirection: "column",
                width: 360,
                height: 430,
                borderRadius: 22,
                border: "1px solid #D8E2F0",
                background: "#FFFFFF",
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#1E3A8A",
                  }}
                >
                  FACTURE
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "#DCFCE7",
                    color: "#166534",
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  Signé
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {[88, 220, 180].map((width, index) => (
                  <div
                    key={index}
                    style={{
                      width,
                      height: 12,
                      borderRadius: 999,
                      background: "#E2E8F0",
                      marginBottom: 14,
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 24,
                  borderTop: "1px solid #E2E8F0",
                  borderBottom: "1px solid #E2E8F0",
                  padding: "20px 0",
                }}
              >
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: row === 2 ? 0 : 16,
                    }}
                  >
                    <div
                      style={{
                        width: row === 0 ? 145 : row === 1 ? 120 : 164,
                        height: 13,
                        borderRadius: 999,
                        background: "#E2E8F0",
                      }}
                    />
                    <div
                      style={{
                        width: 72,
                        height: 13,
                        borderRadius: 999,
                        background: "#CBD5E1",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    color: "#64748B",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Total TVAC
                </div>
                <div
                  style={{
                    color: "#0F172A",
                    fontSize: 34,
                    fontWeight: 900,
                  }}
                >
                  1 863 €
                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                right: 300,
                bottom: 42,
                display: "flex",
                flexDirection: "column",
                width: 230,
                borderRadius: 20,
                background: "#1E3A8A",
                padding: "22px 24px",
                color: "#FFFFFF",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, opacity: 0.8 }}>
                Signature
              </div>
              <div
                style={{
                  marginTop: 16,
                  width: 155,
                  height: 18,
                  borderBottom: "4px solid #F97316",
                  transform: "skewX(-18deg)",
                }}
              />
              <div
                style={{
                  marginTop: 18,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#DBEAFE",
                }}
              >
                Accepté en ligne
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
