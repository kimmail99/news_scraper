import fs from "fs";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

if (!SHEET_ID) {
  throw new Error("❌ GOOGLE_SHEET_ID not set");
}
if (!KEY_FILE) {
  throw new Error("❌ GOOGLE_SERVICE_ACCOUNT_KEY_FILE not set");
}

/* ===============================
   공통 Sheets 클라이언트 생성
   =============================== */
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(fs.readFileSync(KEY_FILE, "utf8")),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

/* ===============================
   Sheet 전체 삭제 함수
   =============================== */
export async function clearSheet() {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A:D", // 필요시 A:Z
  });

  console.log("🧹 Google Sheet 데이터 전체 삭제 완료");
}

/* ===============================
   append 함수 (변경 없음)
   =============================== */
export async function appendToSheet(rows) {
  const sheets = await getSheetsClient();

  const values = rows.map(r => [
    r.media || "",
    r.title || "",
    r.url || "",
    r.upload_date || "",
  ]);

  if (values.length === 0) {
    console.log("⚠️ 추가할 데이터가 없습니다");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  console.log(`📊 Google Sheet에 ${values.length}행 추가 완료`);
}
