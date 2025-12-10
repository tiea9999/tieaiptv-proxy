const express = require("express");
const request = require("request");
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// =============================
// Proxy ไฟล์ index.m3u8
// =============================
app.get("/stream/ch16", (req, res) => {
  const base = "http://119.59.118.159/live/ch16/xxccxgd134/";

  request(base + "index.m3u8")
    .on("error", (err) => {
      console.error("Proxy error:", err);
      res.sendStatus(500);
    })
    .pipe(res);
});

// =============================
// Proxy ไฟล์ .ts (ใช้สำหรับ segment)
// =============================
app.get("/stream/ch16/:segment", (req, res) => {
  const base = "http://119.59.118.159/live/ch16/xxccxgd134/";
  const segment = req.params.segment; // เช่น seg-1.ts

  request(base + segment)
    .on("error", (err) => {
      console.error("TS Proxy error:", err);
      res.sendStatus(500);
    })
    .pipe(res);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));






