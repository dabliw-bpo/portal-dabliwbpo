export function DocumentViewer({
  fileUrl,
  mimeType,
  fileName,
}: {
  fileUrl: string;
  mimeType: string;
  fileName: string;
}) {
  if (mimeType === "application/pdf") {
    return (
      <iframe
        src={fileUrl}
        title={fileName}
        className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
      />
    );
  }

  if (mimeType.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fileUrl} alt={fileName} className="max-h-[70vh] rounded-lg border border-slate-200" />;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
      Pré-visualização não disponível para este tipo de arquivo.{" "}
      <a href={fileUrl} className="underline hover:text-slate-900" download={fileName}>
        Baixar {fileName}
      </a>
    </div>
  );
}
