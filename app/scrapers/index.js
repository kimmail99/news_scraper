import puppeteer from "puppeteer-core";
import { scrapeJTBC } from "./jtbc.js";
import { scrapeMBC } from "./mbc.js";
import { scrapeHani } from "./hani.js";
import { appendToSheet } from "../utils/googleSheet.js";

(async () => {
  console.log("🚀 전체 뉴스 스크래핑 시작");

  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  let results = [];

  // MBC
  try {
    const mbc = await scrapeMBC(browser);
    results.push(...mbc);
  } catch (e) {
    console.error("❌ MBC 실패", e);
  }

  // JTBC
  try {
    const jtbc = await scrapeJTBC(browser);
    results.push(...jtbc);
  } catch (e) {
    console.error("❌ JTBC 실패", e);
  }

  // 한겨레
  try {
    const hani = await scrapeHani(browser);
    results.push(...hani);
  } catch (e) {
    console.error("❌ 한겨레 실패", e);
  }

  await browser.close();

  console.log("📦 전체 수집 결과");
  console.log(JSON.stringify(results, null, 2));
  console.log(`✅ 총 ${results.length}개 기사`);

  // 구글 시트 업로드
  await appendToSheet(results);
  console.log("✅ 전체 작업 완료");
})();

