import fs from "fs";
import path from "path";

interface IImageInfo {
  id: string;
  width: number;
  height: number;
  url: string;
  size: number; // Size in bytes
}

const imageLinks: string[] = [
  "https://storage.opensourcetoolkit.com/free-images/jpg/1.jpg",
  "https://storage.opensourcetoolkit.com/free-images/jpg/2.jpg",
  "https://storage.opensourcetoolkit.com/free-images/jpg/3.jpg",
  "https://storage.opensourcetoolkit.com/free-images/jpg/4.jpg",
  "https://storage.opensourcetoolkit.com/free-images/jpg/5.jpg",
];

const getImageDimensions = (
  buffer: ArrayBuffer,
): { width: number; height: number } => {
  const uint8Array = new Uint8Array(buffer);

  // Check for JPEG
  if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) {
    let i = 2;
    while (i < uint8Array.length) {
      if (
        uint8Array[i] === 0xff &&
        (uint8Array[i + 1] === 0xc0 || uint8Array[i + 1] === 0xc2)
      ) {
        const height = (uint8Array[i + 5] << 8) | uint8Array[i + 6];
        const width = (uint8Array[i + 7] << 8) | uint8Array[i + 8];
        return { width, height };
      }
      i++;
    }
  }

  // Check for PNG
  if (
    uint8Array[0] === 0x89 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x4e &&
    uint8Array[3] === 0x47
  ) {
    const width =
      (uint8Array[16] << 24) |
      (uint8Array[17] << 16) |
      (uint8Array[18] << 8) |
      uint8Array[19];
    const height =
      (uint8Array[20] << 24) |
      (uint8Array[21] << 16) |
      (uint8Array[22] << 8) |
      uint8Array[23];
    return { width, height };
  }

  // Default fallback
  return { width: 1920, height: 1080 };
};

const fetchImageInfo = async (imageUrl: string): Promise<IImageInfo> => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const { width, height } = getImageDimensions(arrayBuffer);

  return {
    id: imageUrl.split("/").pop() || "",
    width,
    height,
    url: imageUrl,
    size: arrayBuffer.byteLength,
  };
};

const fetchAllImageInfos = async (): Promise<IImageInfo[]> => {
  const imageInfoPromises = imageLinks.map(fetchImageInfo);
  return Promise.all(imageInfoPromises);
};

const runFetchAndSave = async () => {
  try {
    const imageInfos = await fetchAllImageInfos();
    console.log("Fetched image infos:", imageInfos);

    const resultsPath = path.join(__dirname, "results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(imageInfos, null, 2));
    console.log(`Results saved to ${resultsPath}`);

    return imageInfos;
  } catch (error) {
    console.error("Error fetching image infos:", error);
    throw error;
  }
};

runFetchAndSave().catch((error) => {
  console.error("Failed to run fetch and save:", error);
});
