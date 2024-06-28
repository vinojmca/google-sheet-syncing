export async function appendAllGsheet({
  values,
  SHEET_ID,
  SHEET_NAME,
  auth,
}: {
  values: (String | Number | Boolean | Date | null)[][];
  SHEET_ID: string;
  SHEET_NAME: string;
  auth: string;
}) {
  try {
    // Clear URL
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
    });

    // Post the data to the Google Sheet
    const headers = ['Id', 'Name', 'Category', 'Description', 'Is Disabled', 'Created At', 'Updated At'];
    const data = {
      values,
    };

    // Add headers as the first row in values
    data.values.unshift(headers);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=RAW`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify(data),
    });

    console.log('response', response);
  } catch (err) {
    console.log(err);
    throw new Error('Failed to handle D1 data');
  }
}
