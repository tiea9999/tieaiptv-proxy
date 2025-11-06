import express from "express";
import fetch from "node-fetch";
import { URL } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

// ฟังก์ชันช่วยเข้ารหัส Base64
function decodeBase64(u) {
  return Buffer.from(u, "base64").toString("utf-8").trim();
}

// Middleware สำหรับ CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Route หลัก proxy
app.get("/", async (req, res) => {
  const { u } = req.query;
  if (!u) return res.status(400).send("Missing ?u= parameter");

  try {
    const url = decodeBase64(u);

    // ตรวจสอบว่าเป็น .m3u8 หรือ .ts
    if (url.endsWith(".m3u8") || url.endsWith(".ts")) {
      // Fetch แบบ streaming
      const response = await fetch(url);
      if (!response.ok) return res.status(response.status).send("Failed to fetch");

      // ตั้ง Content-Type ตามไฟล์
      res.header("Content-Type", url.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t");

      // Stream data ตรงไปยัง client
      response.body.pipe(res);
    } else {
      res.status(400).send("Only .m3u8 and .ts files supported");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🎬 TIEA IPTV HLS Proxy running on port ${PORT}!`);
});
