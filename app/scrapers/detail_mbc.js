// scrapers/detail_mbc.js
export async function extractMBC(page) {
    return await page.evaluate(() => {
      const root = document.querySelector(".news_txt");
      if (!root) return "";
  
      // 광고 제거
      root.querySelectorAll(
        "iframe, script, style, .ad_dableintxt"
      ).forEach(el => el.remove());
  
      let text = root.innerText || "";
  
      // 제보 문구 제거
      text = text.replace(/MBC 뉴스는 24시간[\s\S]*$/g, "");
  
      return text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    });
  }
  