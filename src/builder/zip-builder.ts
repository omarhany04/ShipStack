import { FlatFileMap } from './file-writer';

export async function generateZipBuffer(files: FlatFileMap, projectName: string) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const rootFolder = zip.folder(projectName);

  if (!rootFolder) {
    throw new Error('Failed to create root folder in zip');
  }

  for (const [path, content] of Object.entries(files)) {
    rootFolder.file(path, content);
  }

  return zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

export async function generateZipResponse(files: FlatFileMap, projectName: string) {
  const buffer = await generateZipBuffer(files, projectName);
  const body = Buffer.from(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${projectName}.zip"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}
