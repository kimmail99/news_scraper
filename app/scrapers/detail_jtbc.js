// scrapers/detail_jtbc.js
export async function extractJTBC(page) {
    return await page.evaluate(() => {
      // 광고 / 불필요 요소 제거
      document.querySelectorAll(
        "iframe, script, style, nav, footer, .set_contents_video_ad, .set_contents_image_ad"
      ).forEach(el => el.remove());
  
      const spans = Array.from(
        document.querySelectorAll(
          "span.MuiTypography-body-md"
        )
      )
        .map(el => el.innerText.trim())
        .filter(text =>
          text &&
          text.length > 5 &&
          !["ADVERTISEMENT", "공지사항", "더 보기", "맨 위로"].includes(text)
        );
  
      return spans.join("\n\n");
    });
  }
  