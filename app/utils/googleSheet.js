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
   헤더 보장
   =============================== */
async function ensureHeader() {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["media", "title", "url", "upload_date"]],
    },
  });
}

/* ===============================
   2행부터 데이터 삭제
   =============================== */
export async function clearSheet() {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A2:D",
  });

  console.log("🧹 Google Sheet 데이터 삭제 완료");
}

/* ===============================
   데이터 쓰기 (2행부터)
   =============================== */
export async function appendToSheet(rows) {
  if (!rows || rows.length === 0) {
    console.log("⚠️ 추가할 데이터가 없습니다");
    return;
  }

  const sheets = await getSheetsClient();

  const values = rows.map(r => [
    r.media || "",
    r.title || "",
    r.url || "",
    r.upload_date || "",
  ]);

  // 헤더 보장
  await ensureHeader();

  // 데이터 입력 (2행부터)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  console.log(`📊 Google Sheet에 ${values.length}행 추가 완료`);
}
