import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", async (req, res) => {
  const url = req.query.u;
  if (!url) {
    return res.status(400).send("Missing ?u= parameter");
  }

  try {
    const decodedUrl = Buffer.from(url, "base64").toString("utf-8");
    const response = await fetch(decodedUrl);
    const contentType = response.headers.get("content-type");
    res.setHeader("Content-Type", contentType || "application/vnd.apple.mpegurl");
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ TIEA IPTV Proxy is running on port ${PORT}`));
