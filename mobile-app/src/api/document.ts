import { postJson } from './ai';

/** Jenis berkas yang teksnya diambil di server, bukan lewat OCR di HP. */
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export function isDocumentFile(file: { name: string; mimeType?: string | null }) {
  return (
    (DOCUMENT_MIME_TYPES as readonly string[]).includes(file.mimeType ?? '') ||
    /\.(pdf|docx)$/i.test(file.name)
  );
}

/**
 * POST /api/extract-document — teks dari PDF atau DOCX.
 *
 * PDF dan DOCX tidak bisa dibaca ML Kit (ia hanya menerima gambar), dan pembaca
 * PDF yang andal tidak berjalan di mesin JavaScript aplikasi. Galatnya berupa
 * AiApiError berisi pesan yang siap ditampilkan, mis. PDF yang isinya gambar.
 */
export async function extractDocumentText(file: {
  uri: string;
  name: string;
  mimeType?: string | null;
}): Promise<string> {
  const form = new FormData();
  // Bentuk { uri, name, type } adalah cara React Native melampirkan berkas.
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);

  const json = await postJson('/api/extract-document', form);

  return typeof json?.text === 'string' ? json.text.trim() : '';
}
