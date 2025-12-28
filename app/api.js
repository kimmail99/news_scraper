import express from "express";
import { exec } from "child_process";

const app = express();
app.use(express.json());

const TOKEN = process.env.N8N_TRIGGER_TOKEN;
const ENV_FILE = "/home/moonsu/news_scraper/app/.env";

let running = false;

app.post("/run-news-scraper", (req, res) => {
  // 🔐 토큰 인증
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  // ⛔ 중복 실행 방지
  if (running) {
    return res.status(409).json({
      success: false,
      error: "Already running",
    });
  }

  running = true;
  console.log("🚀 뉴스 스크래퍼 Docker 실행");

  exec(
    `docker run --rm --env-file ${ENV_FILE} news_scraper`,
    {
      timeout: 20 * 60 * 1000, // 20분
      maxBuffer: 10 * 1024 * 1024,
    },
    (error, stdout, stderr) => {
      running = false;

      if (error) {
        console.error("❌ Docker 실행 실패", stderr);
        return res.status(500).json({
          success: false,
          error: stderr || error.message,
        });
      }

      res.json({
        success: true,
        output: stdout,
      });
    }
  );
});

app.listen(3000, "0.0.0.0", () => {
  console.log("🌐 News Scraper API listening on port 3000");
});
