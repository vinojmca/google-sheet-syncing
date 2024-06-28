import { syncCategoriesAndServices } from 'handlers/sync-categories-and-services';
import { GoogleSheetDataSource } from './datasources';
import { YogaSchemaDefinition, createYoga } from 'graphql-yoga';
import { drizzle } from 'drizzle-orm/d1';
import { schema } from './schemas';
import { manualD1GoogleSync } from 'handlers/manual-d1-google-sync';
import { fetchAccessToken } from 'handlers/fetch-access-token';

export interface Env {
  DB: D1Database;
  SHEET_ID: string;
  SHEET_API_KEY: string;
  SYNC_TOKEN: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_TOKEN_URI: string;
  GKEY_KV_NAMESPACE: KVNamespace;
}

// Define the enum for sync_type
export enum SyncType {
  ONE_TIME_SYNC = 'one-time-sync',
  UPDATE = 'update',
}

export interface YogaInitialContext {
  datasources: {
    googleSheetDataSource: GoogleSheetDataSource;
  };
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const db = drizzle(env.DB);
    const datasources = {
      googleSheetDataSource: new GoogleSheetDataSource({ db }),
    };

    if (url.pathname === '/sync-categories-and-services' && request.method === 'GET') {
      // Sync Categories and Services
      const token = request.headers.get('Authorization');
      if (!token || token !== env.SYNC_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
      }
      try {
        return syncCategoriesAndServices({ request, datasources, SHEET_ID: env.SHEET_ID, SHEET_API_KEY: env.SHEET_API_KEY });
      } catch (error) {
        return new Response(`Failed to sync : ${error}`, { status: 500 });
      }
    }

    if (url.pathname === '/manual-d1-google-sync' && request.method === 'POST') {
      const token = request.headers.get('Authorization');
      if (!token || token !== env.SYNC_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
      }

      const header_sync_type = request.headers.get('sync-type');
      if (!header_sync_type) {
        return new Response('Missing sync type', { status: 400 });
      }
      let sync_type: SyncType;

      if (header_sync_type.toUpperCase() === 'ONE_TIME_SYNC') {
        sync_type = SyncType.ONE_TIME_SYNC;
      } else if (header_sync_type.toUpperCase() === 'UPDATE') {
        sync_type = SyncType.UPDATE;
      } else {
        return new Response('Invalid sync type', { status: 400 });
      }

      const kv_value = await env.GKEY_KV_NAMESPACE.get('GOOGLE_PRIVATE_KEY');
      if (!kv_value) {
        return new Response('Missing kv credentials', { status: 400 });
      }

      const private_key = JSON.parse(kv_value);

      const auth = await fetchAccessToken({
        GOOGLE_PRIVATE_KEY: private_key,
        GOOGLE_CLIENT_EMAIL: env.GOOGLE_CLIENT_EMAIL,
        GOOGLE_TOKEN_URI: env.GOOGLE_TOKEN_URI,
      });

      try {
        return manualD1GoogleSync({ request, datasources, SHEET_ID: env.SHEET_ID, SHEET_API_KEY: env.SHEET_API_KEY, auth, sync_type });
      } catch (error) {
        return new Response(`Failed to sync : ${error}`, { status: 500 });
      }
    }

    if (url.pathname === '/kv-config' && request.method === 'POST') {
      const token = request.headers.get('Authorization');
      if (!token || token !== env.SYNC_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        const data = await request.json();
        if (!data) {
          return new Response('Missing data', { status: 400 });
        }
        const private_key = JSON.stringify(data.gkey);
        await env.GKEY_KV_NAMESPACE.put('GOOGLE_PRIVATE_KEY', private_key);
        const value = await env.GKEY_KV_NAMESPACE.get('GOOGLE_PRIVATE_KEY');
        if (value === null) {
          return new Response('Value not found', { status: 404 });
        }
        return new Response('KV config updated', { status: 200 });
      } catch (error) {
        return new Response(`Failed to sync : ${error}`, { status: 500 });
      }
    }

    if (url.pathname === '/graphql') {
      const yoga = createYoga({
        schema: schema as YogaSchemaDefinition<object, YogaInitialContext>,
        landingPage: false,
        graphqlEndpoint: '/graphql',
        context: () => ({
          datasources: {
            googleSheetDataSource: new GoogleSheetDataSource({ db }),
          },
        }),
      });
      return yoga.fetch(request);
    }
    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
