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

export async function appendToSheet(rows) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(fs.readFileSync(KEY_FILE, "utf8")),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const values = rows.map(r => [
    r.media || "",
    r.title,
    r.url,
    r.upload_date,
  ]);

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