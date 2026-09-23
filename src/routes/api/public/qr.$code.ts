import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";

export const Route = createFileRoute("/api/public/qr/$code")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const code = params.code.toUpperCase();
        if (!/^[A-Z0-9]{4,16}$/.test(code)) return new Response("Invalid code", { status: 400 });
        const origin = new URL(request.url).origin;
        const png = await QRCode.toBuffer(`${origin}/checkin/${code}`, { type: "png", margin: 2, width: 320, color: { dark: "#4a1424", light: "#ffffff" } });
        return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "public, max-age=31536000, immutable" } });
      },
    },
  },
});
