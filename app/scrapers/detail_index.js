//docker run --rm   -v $(pwd)/info.json:/app/info.json   news_scraper   node scrapers/detail_index.js
//docker build -t news_scraper . 

// scrapers/detail_index.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

import { extractMBC } from "./detail_mbc.js";
import { extractJTBC } from "./detail_jtbc.js";
import { extractHANI } from "./detail_hani.js";

/* ===============================
   0️⃣ 현재 파일 기준 경로 설정
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// app/info.json 정확히 가리킴
const INFO_PATH = path.resolve(__dirname, "../info.json");

/* ===============================
   1️⃣ info.json 로드
================================ */
const raw = fs.readFileSync(INFO_PATH, "utf-8");
const data = JSON.parse(raw);

// 구조: [ { articles: [...] } ]
//const articles = data[0].articles;
const articles = Array.isArray(data)
    ? data[0]?.articles
    : data.articles;

//console.log(`🧾 총 기사 수: ${articles.length}`);
const enrichedArticles = [];

/* ===============================
   2️⃣ 브라우저 실행 (Puppeteer)
================================ */
const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
    ],
});

const page = await browser.newPage();

await page.setViewport({ width: 1280, height: 900 });

/* ===============================
   3️⃣ 기사 순차 처리
================================ */
for (const article of articles) {
    const { 언론사, 제목, URL } = article;

    //console.log(`\n📰 [${언론사}] ${제목}`);
    //console.log(`🔗 ${URL}`);
    let fullText = "";

    try {
        await page.goto(URL, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });

        switch (언론사) {
            case "MBC":
                fullText = await extractMBC(page);
                /*console.log("\n================= 🧪 MBC 전체 본문 START =================");
                console.log(fullText);
                console.log("================= 🧪 MBC 전체 본문 END =================\n");*/
                break;

            case "JTBC":
                // 이게 없으면 항상 0 나옴
                await page.waitForSelector(
                    "span.MuiTypography-body-md",
                    { timeout: 3000 }
                );
                fullText = await extractJTBC(page);
                /*console.log("\n================= 🧪 JTBC 전체 본문 START =================");
                console.log(fullText);
                console.log("================= 🧪 JTBC 전체 본문 END =================\n");*/
                break;


            case "HANI":
                fullText = await extractHANI(page);
                //console.log("\n================= 🧪 HANI 전체 본문 START =================");
                //console.log(fullText);
                //console.log("================= 🧪 HANI 전체 본문 END =================\n");
                break;

            default:
                console.warn("⚠️ 미지원 언론사 → fallback");
                fullText = await page.evaluate(() => document.body.innerText);
                break;
        }

        //console.log(`📄 본문 길이: ${fullText.length}`);

    } catch (err) {
        console.error("❌ 처리 실패:", err.message);
    }

    enrichedArticles.push({
        ...article,
        본문: fullText,
        본문길이: fullText.length
    });

    // 서버 보호
    await new Promise(resolve => setTimeout(resolve, 1500));
}

/* ===============================
   4️⃣ 종료
================================ */
await browser.close();
console.error("✅ detail_index.js 완료");
console.log(JSON.stringify({ articles: enrichedArticles }));