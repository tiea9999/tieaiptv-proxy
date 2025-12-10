import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

// ---------------------------
// CONFIG: แก้หรือเพิ่มช่องที่ต้องการที่นี่
// ---------------------------
// ตัวอย่าง: กรณีมี pattern เดียวกัน (ch9 -> ch66)
const channels = {};

// หาก base url รูปแบบเดียวกัน สามารถสร้างอัตโนมัติ:
for (let i = 9; i <= 66; i++) {
  const ch = `ch${i}`;
  channels[ch] = `http://119.59.118.159/live/${ch}/xxccxgd134/`;
}

// แต่ถ้าช่องบางช่องต่าง pattern ให้เพิ่มแบบแมนนวล เช่น:
// channels['ch13'] = 'http://119.59.118.159/live/ch13/xxccxgd134/';

// ---------------------------
// Helpers
// ---------------------------
function isAbsoluteUrl(s) {
  return /^https?:\/\//i.test(s);
}

function joinUrl(base, path) {
  if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
  return base + path;
}

// ---------------------------
// Home / health
// ---------------------------
app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy (Node.js) is running");
});

// ---------------------------
// Serve playlist for a channel
// Example: GET /ch/ch13  -> returns rewritten m3u8
// ---------------------------
app.get("/ch/:id", async (req, res) => {
  try {
    const id = req.params.id; // e.g., ch13
    const base = channels[id];
    if (!base) return res.status(404).send("Channel not found");

    // fetch index.m3u8
    const playlistUrl = joinUrl(base, "index.m3u8");
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": playlistUrl,
        "Origin": "null"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      return res.status(502).send(`Source returned ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const out = [];

    for (const line of lines) {
      if (line.trim() === "") {
        out.push(line);
        continue;
      }
      if (line.startsWith("#")) {
        // comment/metadata - preserve
        out.push(line);
      } else {
        // a URI line (segment or nested playlist)
        if (isAbsoluteUrl(line)) {
          // proxy absolute URL via /ch/:id/proxy?u=...
          const prox = `/ch/${encodeURIComponent(id)}/proxy?u=${encodeURIComponent(line)}`;
          out.push(prox);
        } else {
          // relative path -> proxy via /ch/:id/segment/<encoded>
          const prox = `/ch/${encodeURIComponent(id)}/segment/${encodeURIComponent(line)}`;
          out.push(prox);
        }
      }
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(out.join("\n"));
  } catch (err) {
    console.error("Playlist error:", err);
    res.status(500).send("Playlist proxy error");
  }
});

// ---------------------------
// Proxy for relative segment paths
// Example: GET /ch/ch13/segment/seg-1.ts
// ---------------------------
app.get("/ch/:id/segment/:seg", async (req, res) => {
  try {
    const id = req.params.id;
    const seg = decodeURIComponent(req.params.seg);
    const base = channels[id];
    if (!base) return res.status(404).send("Channel not found");

    const target = joinUrl(base, seg);

    const headers = {
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      "Referer": target,
      "Origin": "null"
    };

    // Forward Range header if present (important for .ts streaming)
    if (req.headers.range) headers["Range"] = req.headers.range;

    const resp = await fetch(target, { headers, redirect: "follow" });

    if (!resp.ok && resp.status !== 206) {
      // allow 206 Partial Content, but otherwise if not ok return status
      return res.status(502).send(`Segment source returned ${resp.status}`);
    }

    // copy useful headers
    const contentType = resp.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    const contentLength = resp.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    const acceptRanges = resp.headers.get("accept-ranges");
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

    // forward status (206 or 200) and stream body
    res.status(resp.status);
    resp.body.pipe(res);
  } catch (err) {
    console.error("Segment proxy error:", err);
    res.status(500).send("Segment proxy error");
  }
});

// ---------------------------
// Proxy for absolute URLs found in playlists
// Example: GET /ch/ch13/proxy?u=<absolute_url>
// ---------------------------
app.get("/ch/:id/proxy", async (req, res) => {
  try {
    const u = req.query.u;
    if (!u) return res.status(400).send("Missing u param");

    // optional security: ensure host is allowed? (skip for now)
    const headers = {
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      "Referer": u,
      "Origin": "null"
    };
    if (req.headers.range) headers["Range"] = req.headers.range;

    const resp = await fetch(u, { headers, redirect: "follow" });
    if (!resp.ok && resp.status !== 206) {
      return res.status(502).send(`Source returned ${resp.status}`);
    }

    const contentType = resp.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    const cl = resp.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);
    const ar = resp.headers.get("accept-ranges");
    if (ar) res.setHeader("Accept-Ranges", ar);

    res.status(resp.status);
    resp.body.pipe(res);
  } catch (err) {
    console.error("Proxy/u error:", err);
    res.status(500).send("Proxy error");
  }
});

// ---------------------------
// Generic fallback proxy (if you want direct /proxy?url=...)
// Example: /proxy?url=...
// ---------------------------
app.get("/proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send("Missing url");

    const headers = {
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      "Referer": url,
      "Origin": "null"
    };
    if (req.headers.range) headers["Range"] = req.headers.range;

    const resp = await fetch(url, { headers, redirect: "follow" });
    if (!resp.ok && resp.status !== 206) {
      return res.status(502).send(`Source returned ${resp.status}`);
    }

    const contentType = resp.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    const cl = resp.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);

    res.status(resp.status);
    resp.body.pipe(res);
  } catch (err) {
    console.error("Generic proxy error:", err);
    res.status(500).send("Generic proxy error");
  }
});

// ---------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`TIEA IPTV Proxy running on port ${PORT}`));









