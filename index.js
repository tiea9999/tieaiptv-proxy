import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/play", async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.send("กรุณาใส่ id เช่น /play?id=2820");
    }

    const url = `https://night.redfight.info/iptv.php?id=${id}&ajax=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://night.redfight.info/"
      }
    });

    const text = await response.text();

    const match = text.match(/https?:\/\/.*?\.m3u8.*?/);

    if (!match) {
      return res.status(500).send("ไม่พบลิงก์ m3u8");
    }

    const m3u8 = match[0];

    res.setHeader("Cache-Control", "no-store");
    res.redirect(m3u8);

  } catch (err) {
    res.status(500).send("error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Proxy running on port " + PORT);
});
