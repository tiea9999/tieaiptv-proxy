import express from "express";
import fetch from "node-fetch";

const app = express();

const BASE = "https://night.redfight.info";

// 🔥 ดึง m3u8 หลัก
app.get("/play", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.send("ใส่ id เช่น /play?id=2820");

    const api = `${BASE}/iptv.php?id=${id}&ajax=1`;

    const response = await fetch(api, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE + "/",
        "Origin": BASE
      }
    });

    const text = await response.text();
    const match = text.match(/https?:\/\/.*?\.m3u8.*?/);

    if (!match) return res.send("ไม่พบ m3u8");

    const m3u8Url = match[0];

    const playlistRes = await fetch(m3u8Url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE + "/"
      }
    });

    let playlist = await playlistRes.text();

    // 🔁 rewrite segment ให้ผ่าน proxy
    playlist = playlist.replace(/(https?:\/\/.*?\.ts)/g, (url) => {
      return `/segment?url=${encodeURIComponent(url)}`;
    });

    // 🔁 เผื่อเป็น relative path
    playlist = playlist.replace(/^(?!#)(.*\.ts)$/gm, (line) => {
      const full = new URL(line, m3u8Url).href;
      return `/segment?url=${encodeURIComponent(full)}`;
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(playlist);

  } catch (err) {
    res.send("error: " + err.message);
  }
});

// 🔥 proxy segment (.ts)
app.get("/segment", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.send("missing url");

    const stream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE + "/"
      }
    });

    res.setHeader("Content-Type", "video/mp2t");
    stream.body.pipe(res);

  } catch (err) {
    res.send("segment error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("FULL PROXY RUNNING 🔥");
});
