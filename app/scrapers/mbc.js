// scrapers/mbc.js
import puppeteer from "puppeteer-core";

const TARGET_URL =
  process.env.MBC_TARGET_URL ||
  "https://imnews.imbc.com/news/2025/politics/";

function getTodayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function scrapeMBC() {
  console.log("🚀 [MBC] 정치 뉴스 수집 시작");

  const browser = await puppeteer.launch({
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();

  await page.goto(TARGET_URL, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  console.log("✅ [MBC] 페이지 접속 완료");

  // ===============================
  // 1️⃣ 맨 아래까지 스크롤
  // ===============================
  let prevHeight = 0;

  while (true) {
    const currentHeight = await page.evaluate(
      () => document.body.scrollHeight
    );

    if (currentHeight === prevHeight) break;
    prevHeight = currentHeight;

    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );

    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log("⬇️ [MBC] 스크롤 완료");

  // ===============================
  // 2️⃣ 데이터 수집
  // ===============================
  const result = await page.evaluate(() => {
    let date = null;
    const dateInput = document.querySelector("#datepicker");
    if (dateInput?.value) {
      date = dateInput.value.replace(/\./g, "-");
    }

    const articles = Array.from(
      document.querySelectorAll("li.item > a")
    )
      .map((a) => {
        const titleEl = a.querySelector(".tit");
        return {
          title: titleEl?.innerText.trim() || null,
          url: a.href,
        };
      })
      .filter((a) => a.title && a.url);

    return { date, articles };
  });

  const finalDate = result.date || getTodayYYYYMMDD();

  const output = result.articles.map((a) => ({
    media: "MBC",
    title: a.title,
    url: a.url,
    upload_date: finalDate,
  }));

  await browser.close();
  console.log(`📰 [MBC] ${output.length}개 기사 수집 완료`);

  return output;
}
