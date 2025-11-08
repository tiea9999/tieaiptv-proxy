import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", async (req, res) => {
  const targetUrl = req.query.u;
  if (!targetUrl) {
    return res.send(`
      <h2>TIEA IPTV Proxy</h2>
      <p>ใส่ URL ของช่อง (เช่น https://dookeela2.live/live-tv/hbo)</p>
      <p>ตัวอย่าง: ?u=https://dookeela2.live/live-tv/hbo</p>
    `);
  }

  try {
    console.log("Fetching:", targetUrl);

    // ถ้าเป็น dookeela ลองดึงลิงก์ .m3u8 ภายใน
    let streamUrl = targetUrl;
    if (targetUrl.includes("dookeela")) {
      const page = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36",
        },
      }).then((r) => r.text());

      const m3u8Match = page.match(/https.*?\.m3u8/);
      if (m3u8Match) {
        streamUrl = m3u8Match[0];
        console.log("Extracted m3u8:", streamUrl);
      } else {
        throw new Error("ไม่พบลิงก์ .m3u8 ในหน้านี้");
      }
    }

    // ดึงสตรีมวิดีโอจริง
    const response = await fetch(streamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36",
      },
    });

    if (!response.ok) throw new Error(`Bad status ${response.status}`);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    response.body.pipe(res);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(502).send(`<h3>Bad Gateway fetching stream</h3><p>${err.message}</p>`);
  }
});

app.listen(PORT, () => console.log(`TIEA IPTV Proxy running on port ${PORT}`));
