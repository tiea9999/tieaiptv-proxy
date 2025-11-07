import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

// อนุญาต CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// ฟังก์ชัน decode Base64
function decodeBase64(u) {
  return Buffer.from(u, "base64").toString("utf-8").trim();
}

// route หลัก
app.get("/", async (req, res) => {
  const { u } = req.query;
  if (!u) return res.status(400).send("Missing ?u= parameter");

  try {
    const url = decodeBase64(u);
    console.log("Fetching URL:", url);

    // ตรวจสอบ .m3u8 / .ts
    const isM3U8 = url.endsWith(".m3u8");
    const isTS = url.endsWith(".ts");

    if (!isM3U8 && !isTS) {
      return res.status(400).send("Only .m3u8 and .ts files supported");
    }

    // fetch แบบ streaming
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).send("Failed to fetch");

    // ตั้ง Content-Type ให้ browser / VLC เล่นได้
    res.header("Content-Type", isM3U8 ? "application/vnd.apple.mpegurl" : "video/mp2t");
    res.header("Cache-Control", "no-cache");

    // pipe streaming
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// start server
app.listen(PORT, () => console.log(`🎬 TIEA IPTV HLS Proxy running on port ${PORT}!`));
