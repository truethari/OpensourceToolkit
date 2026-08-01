/**
 * Metadata extraction. Every reader here runs against an ArrayBuffer already in
 * memory or a blob: URL — no request ever leaves the browser.
 */

import {
  toDMS,
  tagHint,
  mapUrl,
  formatBytes,
  humanizeTag,
  hashBuffer,
  aspectRatio,
  classifyFile,
  formatBitrate,
  formatDuration,
  stringifyTagValue,
  HANDLED_EXIF_TAGS,
  type MetaSection,
  type GpsPosition,
  type MediaKind,
  type MetaField,
} from "./utils";

export interface ExtractionResult {
  kind: MediaKind;
  sections: MetaSection[];
  gps?: GpsPosition;
  previewUrl?: string;
  /** Readers that failed, so the UI can say what was skipped and why. */
  notes: string[];
}

function pushField(
  fields: MetaField[],
  label: string,
  value: string | null | undefined,
  hint?: string,
) {
  if (value === null || value === undefined || value === "" || value === "—")
    return;
  fields.push({ label, value, hint });
}

/** Dimensions and intrinsic duration, read by letting the browser decode it. */
function probeWithElement(
  url: string,
  kind: MediaKind,
): Promise<Record<string, number> | null> {
  return new Promise((resolve) => {
    // Give up rather than hang on a codec the browser cannot decode.
    const timer = setTimeout(() => resolve(null), 8000);
    const done = (v: Record<string, number> | null) => {
      clearTimeout(timer);
      resolve(v);
    };

    if (kind === "image") {
      const img = new Image();
      img.onload = () =>
        done({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => done(null);
      img.src = url;
      return;
    }

    if (kind === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.onloadedmetadata = () =>
        done({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      video.onerror = () => done(null);
      video.src = url;
      return;
    }

    if (kind === "audio") {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => done({ duration: audio.duration });
      audio.onerror = () => done(null);
      audio.src = url;
      return;
    }

    done(null);
  });
}

async function readExif(
  buffer: ArrayBuffer,
  sections: MetaSection[],
  notes: string[],
): Promise<GpsPosition | undefined> {
  let parsed: Record<string, unknown> | undefined;
  try {
    const exifr = (await import("exifr")).default;
    parsed = (await exifr.parse(buffer, true)) as
      | Record<string, unknown>
      | undefined;
  } catch {
    notes.push("No readable EXIF data in this file.");
    return undefined;
  }

  if (!parsed || Object.keys(parsed).length === 0) return undefined;

  // Camera and capture settings, the fields people look for first.
  const camera: MetaField[] = [];
  pushField(camera, "Make", stringifyTagValue(parsed.Make));
  pushField(camera, "Model", stringifyTagValue(parsed.Model));
  pushField(camera, "Lens", stringifyTagValue(parsed.LensModel));
  pushField(
    camera,
    "Date taken",
    stringifyTagValue(parsed.DateTimeOriginal ?? parsed.CreateDate),
  );

  const exposure = parsed.ExposureTime;
  if (typeof exposure === "number" && exposure > 0) {
    const shutter =
      exposure < 1 ? `1/${Math.round(1 / exposure)} s` : `${exposure} s`;
    pushField(camera, "Exposure time", shutter, tagHint("ExposureTime"));
  }
  if (typeof parsed.FNumber === "number")
    pushField(camera, "Aperture", `f/${parsed.FNumber}`, tagHint("FNumber"));
  if (typeof parsed.ISO === "number")
    pushField(camera, "ISO", String(parsed.ISO), tagHint("ISO"));
  if (typeof parsed.FocalLength === "number")
    pushField(
      camera,
      "Focal length",
      `${parsed.FocalLength} mm`,
      tagHint("FocalLength"),
    );

  if (camera.length)
    sections.push({ title: "Camera & Capture", fields: camera });

  // Location
  let gps: GpsPosition | undefined;
  const lat = parsed.latitude;
  const lon = parsed.longitude;
  if (typeof lat === "number" && typeof lon === "number") {
    gps = { latitude: lat, longitude: lon };
    const alt = parsed.GPSAltitude;
    if (typeof alt === "number") gps.altitude = alt;

    const loc: MetaField[] = [];
    pushField(loc, "Latitude", `${lat.toFixed(6)}  (${toDMS(lat, true)})`);
    pushField(loc, "Longitude", `${lon.toFixed(6)}  (${toDMS(lon, false)})`);
    if (typeof alt === "number")
      pushField(loc, "Altitude", `${alt.toFixed(1)} m`);
    sections.push({ title: "Location", fields: loc });
  }

  // Everything else, so nothing is hidden from the user.
  const rest: MetaField[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (HANDLED_EXIF_TAGS.has(key)) continue;
    const str = stringifyTagValue(value);
    if (str === null) continue;
    rest.push({ label: humanizeTag(key), value: str, hint: tagHint(key) });
  }
  if (rest.length) {
    rest.sort((a, b) => a.label.localeCompare(b.label));
    sections.push({ title: `All EXIF Tags (${rest.length})`, fields: rest });
  }

  return gps;
}

async function readAudioVideoTags(
  buffer: ArrayBuffer,
  sections: MetaSection[],
  notes: string[],
): Promise<void> {
  try {
    const { parseBuffer } = await import("music-metadata");
    const md = await parseBuffer(new Uint8Array(buffer));

    const fmt: MetaField[] = [];
    pushField(fmt, "Container", stringifyTagValue(md.format.container));
    pushField(fmt, "Codec", stringifyTagValue(md.format.codec));
    if (typeof md.format.duration === "number")
      pushField(fmt, "Duration", formatDuration(md.format.duration));
    if (typeof md.format.bitrate === "number")
      pushField(fmt, "Bitrate", formatBitrate(md.format.bitrate));
    if (typeof md.format.sampleRate === "number")
      pushField(fmt, "Sample rate", `${md.format.sampleRate} Hz`);
    if (typeof md.format.numberOfChannels === "number")
      pushField(
        fmt,
        "Channels",
        md.format.numberOfChannels === 1
          ? "1 (mono)"
          : md.format.numberOfChannels === 2
            ? "2 (stereo)"
            : String(md.format.numberOfChannels),
      );
    if (typeof md.format.bitsPerSample === "number")
      pushField(fmt, "Bit depth", `${md.format.bitsPerSample}-bit`);
    if (typeof md.format.lossless === "boolean")
      pushField(fmt, "Lossless", md.format.lossless ? "Yes" : "No");
    pushField(fmt, "Tag formats", md.format.tagTypes?.join(", ") || null);
    if (fmt.length) sections.push({ title: "Stream & Encoding", fields: fmt });

    // Track-level detail (MP4 and similar carry one entry per stream).
    const tracks = md.format.trackInfo ?? [];
    tracks.forEach((track, i) => {
      const tf: MetaField[] = [];
      pushField(tf, "Codec", stringifyTagValue(track.codecName));
      if (track.audio) {
        // Video streams in MP4 are reported under `audio` with zeroed fields,
        // so only surface values that are actually meaningful.
        if (track.audio.samplingFrequency)
          pushField(
            tf,
            "Sampling frequency",
            `${Math.round(track.audio.samplingFrequency)} Hz`,
          );
        if (track.audio.channels)
          pushField(tf, "Channels", String(track.audio.channels));
        if (track.audio.bitDepth)
          pushField(tf, "Bit depth", `${track.audio.bitDepth}-bit`);
      }
      if (track.video) {
        const { displayWidth, displayHeight, pixelWidth, pixelHeight } =
          track.video;
        if (displayWidth && displayHeight)
          pushField(tf, "Display size", `${displayWidth} × ${displayHeight}`);
        // Stored pixels can differ from display size on anamorphic footage.
        if (pixelWidth && pixelHeight)
          pushField(tf, "Stored size", `${pixelWidth} × ${pixelHeight}`);
        if (typeof track.video.flagInterlaced === "boolean")
          pushField(
            tf,
            "Scan type",
            track.video.flagInterlaced ? "Interlaced" : "Progressive",
          );
      }
      if (tf.length) sections.push({ title: `Track ${i + 1}`, fields: tf });
    });

    // Tags (ID3, iTunes, Vorbis…)
    const c = md.common;
    const tags: MetaField[] = [];
    pushField(tags, "Title", stringifyTagValue(c.title));
    pushField(tags, "Artist", stringifyTagValue(c.artist));
    pushField(tags, "Album", stringifyTagValue(c.album));
    pushField(tags, "Album artist", stringifyTagValue(c.albumartist));
    pushField(tags, "Year", stringifyTagValue(c.year));
    pushField(tags, "Genre", c.genre?.join(", ") || null);
    if (c.track?.no)
      pushField(
        tags,
        "Track",
        c.track.of ? `${c.track.no} of ${c.track.of}` : String(c.track.no),
      );
    if (c.disk?.no)
      pushField(
        tags,
        "Disc",
        c.disk.of ? `${c.disk.no} of ${c.disk.of}` : String(c.disk.no),
      );
    pushField(tags, "Composer", c.composer?.join(", ") || null);
    pushField(tags, "Comment", c.comment?.map(String).join(" ") || null);
    if (c.picture?.length)
      pushField(
        tags,
        "Embedded artwork",
        `${c.picture.length} image(s), ${formatBytes(
          c.picture.reduce((sum, p) => sum + p.data.length, 0),
        )}`,
      );
    if (tags.length) sections.push({ title: "Tags", fields: tags });
  } catch {
    notes.push(
      "Could not read container tags — the format may be unsupported or the file truncated.",
    );
  }
}

/** Read a PDF's document information dictionary. */
async function readPdf(
  buffer: ArrayBuffer,
  sections: MetaSection[],
  notes: string[],
): Promise<void> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(buffer, {
      updateMetadata: false,
      ignoreEncryption: true,
    });
    const f: MetaField[] = [];
    pushField(f, "Pages", String(doc.getPageCount()));
    pushField(f, "Title", doc.getTitle() ?? null);
    pushField(f, "Author", doc.getAuthor() ?? null);
    pushField(f, "Subject", doc.getSubject() ?? null);
    pushField(f, "Keywords", doc.getKeywords() ?? null);
    pushField(f, "Creator", doc.getCreator() ?? null);
    pushField(f, "Producer", doc.getProducer() ?? null);
    const created = doc.getCreationDate();
    const modified = doc.getModificationDate();
    if (created) pushField(f, "Created", created.toISOString());
    if (modified) pushField(f, "Modified", modified.toISOString());

    const first = doc.getPageCount() > 0 ? doc.getPage(0) : null;
    if (first) {
      const { width, height } = first.getSize();
      pushField(
        f,
        "Page size",
        `${width.toFixed(0)} × ${height.toFixed(0)} pt (${(width / 72).toFixed(2)} × ${(height / 72).toFixed(2)} in)`,
      );
    }
    if (f.length) sections.push({ title: "Document", fields: f });
  } catch {
    notes.push("Could not read PDF metadata — the file may be encrypted.");
  }
}

/**
 * Extract everything available for one file.
 *
 * `previewUrl` is a blob: URL owned by the caller, who must revoke it.
 */
export async function extractMetadata(file: File): Promise<ExtractionResult> {
  const kind = classifyFile(file);
  const notes: string[] = [];
  const sections: MetaSection[] = [];

  const buffer = await file.arrayBuffer();

  // File-level facts, always available.
  const fileFields: MetaField[] = [];
  pushField(fileFields, "Name", file.name);
  pushField(
    fileFields,
    "Size",
    `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`,
  );
  pushField(fileFields, "MIME type", file.type || "unknown");
  pushField(fileFields, "Kind", kind);
  if (file.lastModified)
    pushField(
      fileFields,
      "Last modified",
      new Date(file.lastModified).toISOString(),
    );
  sections.push({ title: "File", fields: fileFields });

  const previewUrl = URL.createObjectURL(file);

  // Dimensions / duration straight from the browser's own decoder.
  const probe = await probeWithElement(previewUrl, kind);
  if (probe) {
    const pf: MetaField[] = [];
    if (probe.width && probe.height) {
      pushField(pf, "Dimensions", `${probe.width} × ${probe.height} px`);
      pushField(pf, "Aspect ratio", aspectRatio(probe.width, probe.height));
      pushField(
        pf,
        "Megapixels",
        `${((probe.width * probe.height) / 1_000_000).toFixed(2)} MP`,
      );
    }
    if (Number.isFinite(probe.duration))
      pushField(pf, "Duration", formatDuration(probe.duration));
    if (pf.length) sections.push({ title: "Dimensions", fields: pf });
  } else if (kind !== "other" && kind !== "pdf") {
    notes.push(
      "This browser could not decode the file, so dimensions and duration are unavailable.",
    );
  }

  let gps: GpsPosition | undefined;
  if (kind === "image") {
    gps = await readExif(buffer, sections, notes);
  } else if (kind === "audio" || kind === "video") {
    await readAudioVideoTags(buffer, sections, notes);
  } else if (kind === "pdf") {
    await readPdf(buffer, sections, notes);
  }

  // Hashes last: useful for dedupe and integrity checks.
  const [sha256, sha1] = await Promise.all([
    hashBuffer(buffer, "SHA-256"),
    hashBuffer(buffer, "SHA-1"),
  ]);
  sections.push({
    title: "Checksums",
    fields: [
      { label: "SHA-256", value: sha256 },
      { label: "SHA-1", value: sha1 },
    ],
  });

  return { kind, sections, gps, previewUrl, notes };
}

export { mapUrl };
