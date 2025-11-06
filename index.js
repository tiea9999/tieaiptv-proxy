import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy is running!");
});

app.get("/proxy", async (req, res) => {
  const url = req.query.u;
  if (!url) return res.status(400).send("Missing ?u= parameter");

  try {
    const response = await fetch(url);
    res.set("Content-Type", response.headers.get("content-type"));
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Proxy Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
