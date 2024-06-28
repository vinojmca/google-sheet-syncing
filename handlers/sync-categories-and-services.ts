/* eslint-disable @typescript-eslint/naming-convention */
import { GoogleSheetDataSource } from '@src/datasources';
import { fetchSheet } from './helpers/fetch-sheet';

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}


export const syncCategoriesAndServices = async ({
  request,
  datasources,
  SHEET_ID,
  SHEET_API_KEY,
}: {
  request: Request;
  datasources: { googleSheetDataSource: GoogleSheetDataSource };
  SHEET_ID: string;
  SHEET_API_KEY: string;
}): Promise<Response> => {
  try {
    if (!SHEET_ID || !SHEET_API_KEY) {
      return new Response('Missing credentials', { status: 400 });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    //fetch categories data from Google Sheet
    const categories_sheet_data: (String | Number | Boolean | Date | null)[][] = await fetchSheet({
      sheet_name: 'categories',
      SHEET_ID,
      SHEET_API_KEY,
    });

    if (!categories_sheet_data) {
      throw new Error('Failed to categories data');
    }

    //fetch services data from Google Sheet
    const services_sheet_data: (String | Number | Boolean | Date | null)[][] = await fetchSheet({
      sheet_name: 'services',
      SHEET_ID,
      SHEET_API_KEY,
    });

    if (!services_sheet_data) {
      throw new Error('Failed to services data');
    }

    // Post data to D1 database
    await datasources.googleSheetDataSource.postCategories(categories_sheet_data);
    await datasources.googleSheetDataSource.postServices(services_sheet_data);

    return new Response(JSON.stringify({ msg: 'Sync completed' }), {
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
