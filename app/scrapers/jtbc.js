import puppeteer from "puppeteer-core";

const TARGET_URL = "https://news.jtbc.co.kr/sections/politics";

function getTodayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function scrapeJTBC(browser) {
  console.log("🚀 JTBC 정치 뉴스 수집 시작");

  const page = await browser.newPage();

  await page.goto(TARGET_URL, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  console.log("✅ 페이지 접속 완료");

  // ===============================
  // 1️⃣ 날짜별 보기 버튼 클릭
  // ===============================
  console.log("📅 날짜별 보기 버튼 클릭");

  await page.waitForSelector("button.datepicker-button-container", {
    timeout: 10000,
  });

  await page.click("button.datepicker-button-container");
  await new Promise((r) => setTimeout(r, 800));

  // ===============================
  // 2️⃣ 오늘 날짜 클릭 (react-datepicker)
  // ===============================
  console.log("🗓 오늘 날짜 클릭");

  await page.waitForSelector(".react-datepicker__day--today", {
    timeout: 10000,
  });

  await page.evaluate(() => {
    document
      .querySelector(".react-datepicker__day--today")
      ?.click();
  });

  await new Promise((r) => setTimeout(r, 1500));

  // ===============================
  // 3️⃣ 더보기 버튼 전부 클릭
  // ===============================
  console.log("⬇️ 더보기 버튼 전체 처리 시작");

  let prevCount = 0;

  while (true) {
    const currentCount = await page.evaluate(
      () => document.querySelectorAll("a.info-title").length
    );

    if (currentCount === prevCount) {
      console.log("✅ 기사 수 증가 없음 → 종료");
      break;
    }

    prevCount = currentCount;

    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button"))
        .find((b) => b.innerText.includes("더보기"));

      if (!btn) return false;

      btn.scrollIntoView({ behavior: "smooth", block: "center" });
      btn.click();
      return true;
    });

    if (!clicked) {
      console.log("✅ 더보기 버튼 없음 → 종료");
      break;
    }

    console.log("➕ 더보기 클릭");

    // 기사 수 증가로 클릭 성공 검증
    await page.waitForFunction(
      (count) =>
        document.querySelectorAll("a.info-title").length > count,
      { timeout: 10000 },
      currentCount
    );
  }

  // ===============================
  // 4️⃣ 기사 수집 (정치 리스트 영역만)
  // ===============================
  const today = getTodayYYYYMMDD();

  const articles = await page.evaluate(() => {
    const results = [];
    const seen = new Set();

    document
      .querySelectorAll("div.MuiBox-root.my-1at5085 a.info-title")
      .forEach((a) => {
        const title = a.innerText.trim();
        const url = a.href;

        if (!title || !url) return;
        if (seen.has(url)) return;

        seen.add(url);
        results.push({ title, url });
      });

    return results;
  });

  const result = articles.map((a) => ({
    media: "JTBC",
    title: a.title,
    url: a.url,
    upload_date: today,
  }));

  console.log(`📰 JTBC 기사 ${result.length}개 수집 완료`);

  await page.close();
  return result;
}
