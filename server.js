import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get("/", async (req, res) => {
  const target = req.query.u;
  if (!target) {
    return res.send("✅ TIEA IPTV Proxy is running! Use ?u=Base64URL to stream.");
  }

  try {
    const decodedUrl = Buffer.from(target, "base64").toString("utf-8");
    const response = await fetch(decodedUrl, { timeout: 15000 });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.statusText}`);
    }

    res.set("Content-Type", response.headers.get("content-type") || "application/vnd.apple.mpegurl");
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`✅ TIEA IPTV Proxy is running on port ${PORT}`);
});
