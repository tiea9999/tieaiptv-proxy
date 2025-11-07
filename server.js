import express from "express";
import fetch from "node-fetch";
import { URL } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

// Helper: fetch content จาก URL และ pipe ไป res
async function fetchAndPipe(url, res, contentType) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Fetch error:", response.status, response.statusText);
      res.status(502).send("Bad gateway fetching HLS");
      return false;
    }
    if (contentType) res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    response.body.pipe(res);
    return true;
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Internal server error");
    return false;
  }
}

// Main route
app.get("/", async (req, res) => {
  const urlParam = req.query.u;
  if (!urlParam) return res.status(400).send("Missing ?u= parameter");

  try {
    const decodedUrl = Buffer.from(urlParam, "base64").toString("utf-8").trim();
    console.log("Proxying HLS URL:", decodedUrl);

    // ตรวจสอบว่า URL เป็น .m3u8 หรือไม่
    if (decodedUrl.endsWith(".m3u8")) {
      // Fetch playlist และ pipe ไป client
      await fetchAndPipe(decodedUrl, res, "application/vnd.apple.mpegurl");
    } else if (decodedUrl.endsWith(".ts")) {
      // Fetch segment .ts และ pipe
      await fetchAndPipe(decodedUrl, res, "video/mp2t");
    } else {
      // ถ้า URL เป็น master playlist หรืออื่น ๆ ให้ pipe ปกติ
      await fetchAndPipe(decodedUrl, res, "application/vnd.apple.mpegurl");
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => console.log(`TIEA IPTV Smart Proxy is running on port ${PORT}!`));


