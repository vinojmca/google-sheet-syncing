/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/naming-convention */

export interface GoogleSheetResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

export const transformValue = ({ value, header, sheet_name }: { value: string; header: string; sheet_name: string }) => {
  if (sheet_name === 'services') {
    switch (header) {
      case 'Description':
        return value ? value : null;
      case 'Is Disabled':
        // Change is_disabled to boolean
        return value === 'TRUE' ? true : false;
      default:
        return value;
    }
  }
  return value ? value : null;
};

export const fetchSheet = async ({
  sheet_name,
  SHEET_ID,
  SHEET_API_KEY,
}: {
  sheet_name: string;
  SHEET_ID: string;
  SHEET_API_KEY: string;
}): Promise<(String | Number | Boolean | Date | null)[][]> => {
  const googleSheetApi = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheet_name}?alt=json&key=${SHEET_API_KEY}`;

  // Fetch the sheet data from the API and parse it as JSON
  const response = await fetch(googleSheetApi);
  if (!response.ok) {
    throw new Error('Failed to fetch data from Google Sheet');
  }
  const data = (await response.json()) as GoogleSheetResponse;

  if (!data) {
    throw new Error('Failed to fetch data');
  }

  // Extract headers and data
  const [headers, ...rows] = data.values;

  if (!headers || !rows) {
    throw new Error('Failed to extract headers and data');
  }

  // Parse the data
  return rows.map((row: string[]) => row.map((value, index) => transformValue({ value, header: headers[index], sheet_name })).flat());
};
