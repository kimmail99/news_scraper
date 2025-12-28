// scrapers/detail_hani.js
export async function extractHANI(page) {
    return await page.evaluate(() => {
      const root = document.querySelector(".article-text");
      if (!root) return "";
  
      // 오디오 / 이미지 / 광고 제거
      root.querySelectorAll(
        "iframe, script, style, audio, figure, " +
        ".ArticleDetailAudioPlayer_wrap__vbjJ_, " +
        ".BaseAd_adWrapper__kTNSx, " +
        ".ArticleDetailContent_adWrap__xYVGB"
      ).forEach(el => el.remove());
  
      const paragraphs = Array.from(
        root.querySelectorAll("p.text")
      )
        .map(p => p.innerText.trim())
        .filter(text =>
          text &&
          !text.includes("@hani.co.kr") &&
          text.length > 10
        );
  
      if (paragraphs.length === 0) {
        return root.innerText.trim();
      }
  
      return paragraphs.join("\n\n");
    });
  }
  