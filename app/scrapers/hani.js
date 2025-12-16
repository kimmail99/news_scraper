import puppeteer from "puppeteer-core";

const HANI_URLS = [
  "https://www.hani.co.kr/arti/politics/politics_general",
  "https://www.hani.co.kr/arti/politics/bluehouse",
  "https://www.hani.co.kr/arti/politics/assembly",
  "https://www.hani.co.kr/arti/politics/administration",
  "https://www.hani.co.kr/arti/politics/defense",
  "https://www.hani.co.kr/arti/politics/diplomacy",
];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function scrapeHani(browser) {
  console.log("🚀 [HANI] 정치 뉴스 수집 시작");

  const page = await browser.newPage();
  const today = getToday();
  const results = [];

  for (const baseUrl of HANI_URLS) {
    console.log(`➡️ [HANI] 접속: ${baseUrl}`);

    await page.goto(baseUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    let pageIndex = 1;

    while (true) {
      console.log(`📄 [HANI] ${pageIndex}페이지 확인`);

      // ===============================
      // 1️⃣ 페이지 내 오늘 기사 수집
      // ===============================
      const { articles, hasToday } = await page.evaluate((today) => {
        const items = document.querySelectorAll(
          "li.ArticleList_item___OGQO"
        );

        const collected = [];
        let foundToday = false;

        for (const li of items) {
          const titleEl = li.querySelector(
            ".BaseArticleCard_title__TVFqt"
          );
          const linkEl = li.querySelector(
            "a.BaseArticleCard_link__Q3YFK"
          );
          const dateEl = li.querySelector(
            ".BaseArticleCard_date__4R8Ru"
          );

          if (!titleEl || !linkEl || !dateEl) continue;

          const date = dateEl.innerText.trim().split(" ")[0];

          if (date === today) {
            foundToday = true;
            collected.push({
              title: titleEl.innerText.trim(),
              url: linkEl.href,
              upload_date: date,
            });
          }
        }

        return {
          articles: collected,
          hasToday: foundToday,
        };
      }, today);

      console.log(`📰 [HANI] ${articles.length}개 기사 저장`);

      results.push(
        ...articles.map((a) => ({
          media: "HANI",
          ...a,
        }))
      );

      // ===============================
      // 2️⃣ 오늘 기사 하나도 없으면 종료
      // ===============================
      if (!hasToday) {
        console.log("⛔ [HANI] 오늘 기사 없음 → 종료");
        break;
      }

      // ===============================
      // 3️⃣ 다음 페이지(숫자 버튼) 클릭
      // ===============================
      const nextPage = pageIndex + 1;

      const moved = await page.evaluate((nextPage) => {
        const btn = Array.from(
          document.querySelectorAll(
            ".BasePagination_numList__OHz6r button"
          )
        ).find(
          (b) =>
            b.getAttribute("title") ===
            `${nextPage}페이지로 이동`
        );

        if (!btn) return false;
        btn.click();
        return true;
      }, nextPage);

      if (!moved) {
        console.log("⛔ [HANI] 다음 페이지 버튼 없음 → 종료");
        break;
      }

      await page.waitForNavigation({
        waitUntil: "networkidle2",
      });

      pageIndex++;
    }
  }

  await page.close();

  console.log(
    `✅ [HANI] 총 ${results.length}개 기사 수집 완료`
  );

  return results;
}
