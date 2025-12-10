import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// Home
app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy is running!");
});

// Proxy for m3u8 or TS
app.get("/proxy", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("Missing url parameter. Example: /proxy?url=http://xxx/playlist.m3u8");
  }

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      "Referer": url,
      "Origin": url
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return res.status(500).send("Source Error: " + response.status);
    }

    res.set("Content-Type", response.headers.get("content-type"));
    response.body.pipe(res);

  } catch (err) {
    res.status(500).send("Proxy Error: " + err);
  }
});

// Render Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`TIEA IPTV Proxy running on port ${PORT}`);
});







