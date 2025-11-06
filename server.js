import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Proxy endpoint
app.get("/", async (req, res) => {
  const target = req.query.u;
  if (!target) {
    return res.status(400).send("❌ Missing ?u= parameter");
  }

  try {
    const decodedUrl = Buffer.from(target, "base64").toString("utf-8");
    console.log("Proxying:", decodedUrl);

    const response = await fetch(decodedUrl);
    if (!response.ok) {
      return res.status(response.status).send("⚠️ Error fetching stream");
    }

    // กำหนด header สำหรับ video m3u8
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).send("🔥 Internal Proxy Error");
  }
});

app.listen(PORT, () => {
  console.log(`✅ TIEA IPTV Proxy is running on port ${PORT}`);
});
