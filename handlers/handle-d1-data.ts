import { servicesAndCategories } from '@src/datasources';
import { appendAllGsheet } from './append-all-gsheet';
import { SyncType } from '@src/index';
import { updateGsheet } from './update-gsheet';

export async function handleD1Data({
  d1_data,
  SHEET_ID,
  SHEET_API_KEY,
  auth,
  sync_type,
}: {
  d1_data: servicesAndCategories[];
  SHEET_ID: string;
  SHEET_API_KEY: string;
  auth: string;
  sync_type: SyncType;
}) {
  try {
    const SHEET_NAME = 'D1-to-gsheet';
    if (!d1_data) {
      throw new Error('D1 data is empty');
    }

    // Prepare the data to be post to the Google Sheet
    const values = d1_data.map((d1) => [d1.id, d1.name, d1.category_name, d1.description, d1.disabled, d1.created_at, d1.updated_at]);

    if (sync_type === SyncType.ONE_TIME_SYNC) {
      await appendAllGsheet({ values, SHEET_ID, SHEET_NAME, auth });
    } else {
      await updateGsheet({ values, SHEET_ID, SHEET_API_KEY, SHEET_NAME, auth });
    }
  } catch (err) {
    console.log(err);
    throw new Error('Failed to handle D1 data');
  }
}
