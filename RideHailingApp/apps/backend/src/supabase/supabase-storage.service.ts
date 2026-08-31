import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const DRIVER_DOCUMENTS_BUCKET = 'driver-documents';
// Bucket is private, so there's no permanent public URL -- a signed URL is generated instead and
// stored directly in the Driver/Vehicle field. 10 years so it behaves like a permanent link for
// this MVP; revisit with on-demand re-signing if these documents need to expire/rotate for real.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;

@Injectable()
export class SupabaseStorageService {
  // Inferred from createClient()'s return rather than annotated with the `SupabaseClient` type
  // import -- the two don't structurally match on this package version (generic param order),
  // which trips no-unsafe-assignment for no real type-safety benefit here.
  private readonly client: ReturnType<typeof createClient>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    this.client = createClient(url, serviceRoleKey);
  }

  // `path` is stable per driver+documentType (not timestamped) so re-uploading a corrected
  // document overwrites the old file instead of accumulating orphans.
  async uploadDriverDocument(
    path: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error: uploadError } = await this.client.storage
      .from(DRIVER_DOCUMENTS_BUCKET)
      .upload(path, file, { contentType, upsert: true });
    if (uploadError) {
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    const { data, error: signError } = await this.client.storage
      .from(DRIVER_DOCUMENTS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (signError || !data) {
      throw new Error(`Supabase Storage signing failed: ${signError?.message}`);
    }

    return data.signedUrl;
  }
}
