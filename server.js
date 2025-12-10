const express = require("express");
const request = require("request");
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/stream/ch16", (req, res) => {
  const url = "http://119.59.118.159/live/ch16/xxccxgd134/index.m3u8";

  request(url)
    .on("error", (err) => {
      console.error("Proxy error:", err);
      res.sendStatus(500);
    })
    .pipe(res);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));





