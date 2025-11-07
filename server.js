import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

function decodeBase64(u) {
  return Buffer.from(u, "base64").toString("utf-8").trim();
}

app.get("/", async (req, res) => {
  const { u } = req.query;
  if (!u) return res.status(400).send("Missing ?u= parameter");

  try {
    const url = decodeBase64(u);

    if (url.endsWith(".m3u8") || url.endsWith(".ts")) {
      const response = await fetch(url);
      if (!response.ok) return res.status(response.status).send("Failed to fetch");

      res.header("Content-Type", url.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t");

      response.body.pipe(res);
    } else {
      res.status(400).send("Only .m3u8 and .ts files supported");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => console.log(`🎬 TIEA IPTV HLS Proxy running on port ${PORT}!`));
