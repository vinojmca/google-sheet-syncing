/* eslint-disable @typescript-eslint/naming-convention */
import { GoogleSheetDataSource } from '@src/datasources';
import { handleD1Data } from './handle-d1-data';
import { SyncType } from '@src/index';

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export const manualD1GoogleSync = async ({
  request,
  datasources,
  SHEET_ID,
  SHEET_API_KEY,
  auth,
  sync_type,
}: {
  request: Request;
  datasources: { googleSheetDataSource: GoogleSheetDataSource };
  SHEET_ID: string;
  SHEET_API_KEY: string;
  auth: string;
  sync_type: SyncType;
}): Promise<Response> => {
  try {
    if (!SHEET_ID || !SHEET_API_KEY || !auth) {
      return new Response('Missing credentials', { status: 400 });
    }
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    // fetch service and category data from D1 Database
    const d1_data = await datasources.googleSheetDataSource.servicesAndCategories();

    // insert data into Google Sheet
    await handleD1Data({ d1_data, SHEET_ID, SHEET_API_KEY, auth, sync_type });

    return new Response(JSON.stringify({ msg: 'Manual D1 Google Sync completed' }), {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers')!,
      },
    });
  } catch (error: any) {
    console.error('Error handling ', error);
    return new Response(JSON.stringify(error));
  }
};
