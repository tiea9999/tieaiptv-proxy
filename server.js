import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", async (req, res) => {
  const u = req.query.u;
  if (!u) return res.status(400).send("Missing parameter: u");

  const url = Buffer.from(u, "base64").toString("utf8");
  console.log("Proxying:", url);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Referer": "https://www.google.com/",
        "Origin": "https://www.google.com",
      },
    });

    // ถ้าเป็น m3u8 ให้แก้ path ภายในไฟล์ให้ถูกต้อง
    if (url.includes(".m3u8")) {
      const text = await response.text();
      const base = url.split("/").slice(0, -1).join("/");
      const fixed = text.replace(
        /^(?!#)(.*\.ts|.*\.m3u8)/gm,
        (match) => (match.startsWith("http") ? match : `${base}/${match}`)
      );
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.send(fixed);
    } else {
      res.setHeader("Content-Type", response.headers.get("content-type"));
      response.body.pipe(res);
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
