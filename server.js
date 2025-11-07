import express from "express";
import fetch from "node-fetch";

const app = express();

// ใช้ port จาก Render
const PORT = process.env.PORT || 10000;

app.get("/", async (req, res) => {
  const urlParam = req.query.u;
  if (!urlParam) {
    return res.status(400).send("Missing ?u= parameter");
  }

  try {
    const decodedUrl = Buffer.from(urlParam, "base64").toString("utf-8").trim();

    console.log("Fetching URL:", decodedUrl);

    const response = await fetch(decodedUrl);
    if (!response.ok) {
      console.error("Fetch error:", response.status, response.statusText);
      return res.status(502).send("Bad gateway fetching HLS");
    }

    // กำหนด headers สำหรับ HLS
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Stream data
    response.body.pipe(res);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => console.log(`TIEA IPTV Proxy is running on port ${PORT}!`));

