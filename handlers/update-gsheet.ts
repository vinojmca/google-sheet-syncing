import { fetchSheet } from './helpers/fetch-sheet';
import { postToGoogleSheet } from './post-to-google-sheet';

export async function updateGsheet({
  values,
  SHEET_ID,
  SHEET_API_KEY,
  SHEET_NAME,
  auth,
}: {
  values: (String | Number | Boolean | Date | null)[][];
  SHEET_ID: string;
  SHEET_API_KEY: string;
  SHEET_NAME: string;
  auth: string;
}) {
  try {
    if (!SHEET_ID || !SHEET_API_KEY || !auth) {
      throw new Error('Missing credentials');
    }
    // fetch  data from Google Sheet
    const sheet_data: (String | Number | Boolean | Date | null)[][] = await fetchSheet({
      sheet_name: SHEET_NAME,
      SHEET_ID,
      SHEET_API_KEY,
    });

    // Prepare the data to be post to the Google Sheet
    const requests: { range: string; values: (String | Number | Date | Boolean | null)[][] }[] = [];
    const existing_keys: Set<string> = new Set(sheet_data ? sheet_data.map((row) => row[0] as string) : []);
    let new_row_index: number = sheet_data ? sheet_data.length + 2 : 2;
    for (const new_data_row of values) {
      const key = new_data_row[0] as string;
      if (existing_keys.has(key) && sheet_data) {
        // Update existing row
        const row_index: number = sheet_data.findIndex((row) => row[0] === key);
        const range: string = `${SHEET_NAME}!A${row_index + 2}:G${row_index + 2}`;
        requests.push({ range, values: [new_data_row] });
      } else {
        // Append new row
        const append_range: string = `${SHEET_NAME}!A${new_row_index}:G${new_row_index}`;
        requests.push({
          range: append_range,
          values: [new_data_row],
        });
        new_row_index++;
      }
    }

    const response = await postToGoogleSheet({ auth, SHEET_ID, requests });
    console.log("response", response);
  } catch (err) {
    console.log(err);
    throw new Error('Failed to handle D1 data');
  }
}
