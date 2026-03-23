import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/play", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.send("ใส่ id เช่น /play?id=2820");

    const api = `https://night.redfight.info/iptv.php?id=${id}&ajax=1`;

    const response = await fetch(api, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://night.redfight.info/",
        "Origin": "https://night.redfight.info"
      }
    });

    const text = await response.text();
    const match = text.match(/https?:\/\/.*?\.m3u8.*?/);

    if (!match) return res.send("ไม่พบ m3u8");

    const m3u8Url = match[0];

    // 🔥 ดึง playlist จริง
    const playlistRes = await fetch(m3u8Url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://night.redfight.info/"
      }
    });

    const playlist = await playlistRes.text();

    // 🔁 rewrite ลิงก์ segment
    const fixed = playlist.replace(/(https?:\/\/.*?)/g, (url) => {
      return url; // (เวอร์ชันง่าย ยังไม่แก้ segment)
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(fixed);

  } catch (err) {
    res.send("error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
