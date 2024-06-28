interface PostToGoogleSheetParams {
  auth: string;
  SHEET_ID: string;
  requests: { range: string; values: (String | Number | Date | Boolean | null)[][] }[];
}

export async function postToGoogleSheet({ auth, SHEET_ID, requests }: PostToGoogleSheetParams): Promise<Response> {
  try {
    // Batch update the post to the Google Sheet
    const url: string = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`;
    const response: Response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify({
        data: requests,
        valueInputOption: 'RAW',
      }),
    });
    return response;
  } catch (error) {
    console.error('Error posting to Google Sheet:', error);
    throw new Error(`Failed to post to Google Sheet: ${error}`);
  }
}
