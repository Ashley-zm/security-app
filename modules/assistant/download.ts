import type { AssistantMarkdownTable } from "@/modules/assistant/markdown";

interface AppFileWriter {
  onwriteend?: () => void;
  onerror?: (error: { message?: string }) => void;
  write: (data: string | Blob) => void;
}

interface AppFileEntry {
  toLocalURL?: () => string;
  createWriter: (
    success: (writer: AppFileWriter) => void,
    fail: (error: { message?: string }) => void,
  ) => void;
}

interface AppFileSystem {
  root: {
    getFile: (
      name: string,
      options: { create: boolean; exclusive: boolean },
      success: (entry: AppFileEntry) => void,
      fail: (error: { message?: string }) => void,
    ) => void;
  };
}

interface AppPlusRuntime {
  io?: {
    PUBLIC_DOWNLOADS?: number;
    PRIVATE_DOC?: number;
    requestFileSystem?: (
      type: number,
      success: (fileSystem: AppFileSystem) => void,
      fail: (error: { message?: string }) => void,
    ) => void;
  };
}

function appPlus() {
  return (globalThis as typeof globalThis & { plus?: AppPlusRuntime }).plus;
}

function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim();
}

function tableFilename(table: AssistantMarkdownTable, index: number) {
  const title = safeFilename(table.title || "").replace(/\.csv$/i, "");
  return title
    ? `${title}.csv`
    : `安检助手-表格-${index + 1}-${Date.now()}.csv`;
}

function browserDownload(data: Blob | string, filename: string) {
  const url = typeof data === "string" ? data : URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (typeof data !== "string") URL.revokeObjectURL(url);
}

function writeAppFile(
  filename: string,
  data: string | Blob,
  location: "downloads" | "private",
) {
  const io = appPlus()?.io;
  const fileSystemType =
    location === "downloads" ? io?.PUBLIC_DOWNLOADS : io?.PRIVATE_DOC;
  if (!io?.requestFileSystem || typeof fileSystemType !== "number") {
    return undefined;
  }

  return new Promise<string>((resolve, reject) => {
    const fail = (error: { message?: string }) =>
      reject(new Error(error.message || "文件保存失败"));
    io.requestFileSystem?.(
      fileSystemType,
      (fileSystem) => {
        fileSystem.root.getFile(
          safeFilename(filename),
          { create: true, exclusive: false },
          (entry) => {
            entry.createWriter((writer) => {
              writer.onerror = fail;
              writer.onwriteend = () =>
                resolve(entry.toLocalURL?.() || filename);
              writer.write(data);
            }, fail);
          },
          fail,
        );
      },
      fail,
    );
  });
}

function tableCsv(table: AssistantMarkdownTable) {
  const escapeCell = (cell: string) =>
    `"${String(cell ?? "").replace(/"/g, '""')}"`;
  return `\uFEFF${table.rows
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n")}`;
}

function imageExtension(url: string) {
  const dataType = url.match(/^data:image\/([a-zA-Z0-9.+-]+);/i)?.[1];
  if (dataType) return dataType === "jpeg" ? "jpg" : dataType.split("+")[0];
  const pathExtension = url.split(/[?#]/)[0].match(/\.([a-zA-Z0-9]+)$/)?.[1];
  return pathExtension || "png";
}

function dataUrlBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) throw new Error("图片数据格式无效");
  const bytes = atob(match[2]);
  const output = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    output[index] = bytes.charCodeAt(index);
  }
  return new Blob([output], { type: match[1] });
}

function downloadRemoteFile(url: string) {
  return new Promise<string>((resolve, reject) => {
    uni.downloadFile({
      url,
      success: (result) => {
        if (result.statusCode && result.statusCode >= 400) {
          reject(new Error(`图片下载失败（${result.statusCode}）`));
          return;
        }
        resolve(result.tempFilePath);
      },
      fail: (error) => reject(new Error(error.errMsg || "图片下载失败")),
    });
  });
}

function saveImageToAlbum(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: (error) => reject(new Error(error.errMsg || "图片保存失败")),
    });
  });
}

export async function downloadAssistantTable(
  table: AssistantMarkdownTable,
  index: number,
) {
  const filename = tableFilename(table, index);
  const csv = tableCsv(table);
  const appWriter = writeAppFile(filename, csv, "downloads");
  if (appWriter) {
    await appWriter;
    return "表格已保存到 Downloads";
  }
  if (typeof document !== "undefined") {
    browserDownload(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename,
    );
    return "表格下载已开始";
  }
  await new Promise<void>((resolve, reject) => {
    uni.setClipboardData({
      data: csv,
      success: () => resolve(),
      fail: (error) => reject(new Error(error.errMsg || "表格导出失败")),
    });
  });
  return "当前平台已将 CSV 内容复制到剪贴板";
}

export async function downloadAssistantImage(url: string, index: number) {
  const filename = `安检助手-图片-${index + 1}-${Date.now()}.${imageExtension(url)}`;
  if (appPlus()) {
    let filePath = url;
    if (/^https?:\/\//i.test(url)) {
      filePath = await downloadRemoteFile(url);
    } else if (url.startsWith("data:")) {
      const saved = writeAppFile(filename, dataUrlBlob(url), "private");
      if (!saved) throw new Error("当前 App 运行时不支持图片写入");
      filePath = await saved;
    }
    await saveImageToAlbum(filePath);
    return "图片已保存到系统相册";
  }

  if (typeof document !== "undefined") {
    if (url.startsWith("data:")) {
      browserDownload(dataUrlBlob(url), filename);
    } else {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("图片下载失败");
        browserDownload(await response.blob(), filename);
      } catch {
        browserDownload(url, filename);
      }
    }
    return "图片下载已开始";
  }
  throw new Error("当前平台暂不支持图片下载");
}
