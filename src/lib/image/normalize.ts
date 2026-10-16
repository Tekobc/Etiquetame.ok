const PAPER = "#fffdf7";

function canvasBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo procesar la imagen."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

function hasTransparency(bitmap: ImageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 120;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("No se pudo analizar la imagen.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) {
      return true;
    }
  }
  return false;
}

export async function normalizeProductImage(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    throw new Error(
      `${file.name}: no se pudo abrir la imagen. Probá con una copia JPG o PNG.`,
    );
  }

  if (bitmap.width < 400 || bitmap.height < 400) {
    bitmap.close();
    throw new Error(`${file.name}: la imagen debe medir al menos 400 × 400 px.`);
  }

  const isTransparent = hasTransparency(bitmap);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No se pudo preparar el lienzo de la imagen.");
  }

  if (!isTransparent) {
    context.fillStyle = PAPER;
    context.fillRect(0, 0, 1200, 1200);
  }

  const availableSize = 1200 * 0.88;
  const scale = Math.min(
    availableSize / bitmap.width,
    availableSize / bitmap.height,
  );
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(
    bitmap,
    (1200 - width) / 2,
    (1200 - height) / 2,
    width,
    height,
  );
  bitmap.close();

  const main = await canvasBlob(canvas, 0.85);
  const thumbnailCanvas = document.createElement("canvas");
  thumbnailCanvas.width = 480;
  thumbnailCanvas.height = 480;
  const thumbnailContext = thumbnailCanvas.getContext("2d");
  if (!thumbnailContext) {
    throw new Error("No se pudo preparar la miniatura.");
  }
  thumbnailContext.drawImage(canvas, 0, 0, 480, 480);

  return {
    main,
    thumbnail: await canvasBlob(thumbnailCanvas, 0.8),
  };
}
