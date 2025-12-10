import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy is running!");
});

app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url parameter");

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Connection": "keep-alive",
      "Referer": "http://localhost/",
      "Origin": "http://localhost/"
    };

    const response = await fetch(url, {
      headers,
      redirect: "follow"
    });

    if (!response.ok) {
      return res.status(500).send("Source error: " + response.status);
    }

    const contentType = response.headers.get("content-type");
    if (contentType) res.set("Content-Type", contentType);

    response.body.pipe(res);

  } catch (err) {
    res.status(500).send("Proxy error: " + err);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`TIEA IPTV Proxy running on port ${PORT}`);
});








