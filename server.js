import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

// ---- รายการช่องพร้อม URL ต้นทาง ----
const channels = {
  film1: "http://6395online.ddns.net:8080/memfs/116c34ed-5d51-429d-8c3a-c333fc943521_output_0.m3u8",
  film2: "http://6395online.ddns.net:8080/memfs/a7199114-2ef1-44df-bf18-92ee4c4f2124_output_0.m3u8",
  filmasia: "http://6395online.ddns.net:8080/memfs/92f6657f-44e5-4673-be56-027159c17358_output_0.m3u8",
  moviehits: "http://6395online.ddns.net:8080/memfs/494a9a37-45e9-40ae-9f73-1489994ab2c3_output_0.m3u8",
};

// ---- ตรวจสอบว่าลิงก์ยังใช้ได้ไหม ----
async function checkURL(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- Proxy หลัก ----
app.get("/channel/:name.m3u8", async (req, res) => {
  const { name } = req.params;
  const originUrl = channels[name];
  if (!originUrl) return res.status(404).send("Channel not found");

  if (!(await checkURL(originUrl))) {
    return res.status(500).send("#EXTM3U\n#EXTINF:-1,Stream expired\n");
  }

  try {
    const response = await fetch(originUrl);
    const text = await response.text();
    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(text);
  } catch (err) {
    res.status(500).send("Error fetching stream");
  }
});

// ---- หน้าแสดงสถานะ ----
app.get("/", (req, res) => {
  res.send("🎬 TIEA IPTV Auto Proxy is running!");
});

app.listen(PORT, () => {
  console.log(`✅ TIEA IPTV Proxy is running on port ${PORT}`);
});
