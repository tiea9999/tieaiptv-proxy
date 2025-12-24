import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// ===== CONFIG =====
const BASE_URL = "http://119.59.118.159/live";
const TOKEN = "Mariogogo007";
const MAX_CH = 200;

// ===== TEST =====
app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy FAST MODE is running");
});

// ===== FAST PLAYLIST PROXY (NO REWRITE) =====
app.get("/ch/:id", async (req, res) => {
  const chNum = parseInt(req.params.id.replace("ch", ""));

  if (isNaN(chNum) || chNum < 1 || chNum > MAX_CH) {
    return res.status(404).send("Channel not found");
  }

  const url = `${BASE_URL}/ch${chNum}/${TOKEN}/index.m3u8`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE_URL,
        "Connection": "keep-alive"
      }
    });

    if (!response.ok) {
      return res.status(502).send("Source error");
    }

    // headers สำคัญ ช่วยให้ player start เร็ว
    res.set({
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });

    // 🔥 ส่งตรง ไม่แตะข้อมูล
    response.body.pipe(res);

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ===== START =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("FAST IPTV Proxy running on port " + PORT);
});











