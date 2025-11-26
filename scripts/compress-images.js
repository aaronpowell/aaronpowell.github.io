#!/usr/bin/env node
/* eslint-disable no-console */
import * as fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);

const SUPPORTED_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
]);

function formatBytes(bytes) {
    if (bytes === 0) {
        return "0 B";
    }

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function parseArgs(argv) {
    const options = {
        input: path.resolve(process.cwd(), "src/static/images"),
        output: null,
        dryRun: false,
        quality: 80,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === "--dry-run") {
            options.dryRun = true;
            continue;
        }

        if (arg === "--input" || arg === "-i") {
            options.input = path.resolve(process.cwd(), argv[i + 1]);
            i += 1;
            continue;
        }

        if (arg.startsWith("--input=")) {
            const value = arg.split("=")[1];
            options.input = path.resolve(process.cwd(), value);
            continue;
        }

        if (arg === "--output" || arg === "-o") {
            options.output = path.resolve(process.cwd(), argv[i + 1]);
            i += 1;
            continue;
        }

        if (arg.startsWith("--output=")) {
            const value = arg.split("=")[1];
            options.output = path.resolve(process.cwd(), value);
            continue;
        }

        if (arg === "--quality" || arg === "-q") {
            const parsed = Number(argv[i + 1]);
            if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 100) {
                options.quality = parsed;
            }
            i += 1;
            continue;
        }

        if (arg.startsWith("--quality=")) {
            const value = Number(arg.split("=")[1]);
            if (!Number.isNaN(value) && value >= 1 && value <= 100) {
                options.quality = value;
            }
        }
    }

    if (!options.output) {
        options.output = options.input;
    }

    return options;
}

async function ensureDirectory(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function collectFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                return collectFiles(fullPath);
            }
            return fullPath;
        })
    );
    return files.flat();
}

async function optimiseImage({
    filePath,
    relativePath,
    outputPath,
    dryRun,
    quality,
}) {
    const ext = path.extname(filePath).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(ext)) {
        return { status: "skipped", reason: "unsupported", relativePath };
    }

    const originalBuffer = await fs.readFile(filePath);
    const originalSize = originalBuffer.length;
    let pipeline = sharp(originalBuffer, { failOnError: false });

    switch (ext) {
        case ".jpg":
        case ".jpeg":
            pipeline = pipeline.jpeg({ mozjpeg: true, quality });
            break;
        case ".png":
            pipeline = pipeline.png({
                compressionLevel: 9,
                palette: true,
                quality,
            });
            break;
        case ".webp":
            pipeline = pipeline.webp({ quality });
            break;
        case ".avif":
            pipeline = pipeline.avif({ quality: Math.max(quality - 30, 20) });
            break;
        default:
            return { status: "skipped", reason: "unsupported", relativePath };
    }

    try {
        const { data } = await pipeline.toBuffer({ resolveWithObject: true });
        const compressedSize = data.length;
        const delta = originalSize - compressedSize;

        if (delta <= 0) {
            if (!dryRun && outputPath !== filePath) {
                await ensureDirectory(path.dirname(outputPath));
                await fs.writeFile(outputPath, originalBuffer);
            }
            return { status: "no-change", relativePath, originalSize };
        }

        if (!dryRun) {
            await ensureDirectory(path.dirname(outputPath));
            await fs.writeFile(outputPath, data);
        }

        return {
            status: "optimised",
            relativePath,
            savedBytes: delta,
            originalSize,
            compressedSize,
        };
    } catch (error) {
        return {
            status: "error",
            relativePath,
            reason: error.message,
        };
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const { input, output, dryRun, quality } = options;

    let inputStats;
    try {
        inputStats = await fs.stat(input);
    } catch (error) {
        console.error(`Input directory not found: ${input}`);
        process.exitCode = 1;
        return;
    }

    if (!inputStats.isDirectory()) {
        console.error(`Input path is not a directory: ${input}`);
        process.exitCode = 1;
        return;
    }

    const files = await collectFiles(input);
    const stats = {
        processed: 0,
        optimised: 0,
        skipped: 0,
        noChange: 0,
        errors: 0,
        savedBytes: 0,
    };

    console.log(`Scanning ${input} for images...`);
    for (const filePath of files) {
        const relativePath = path.relative(input, filePath);
        if (!relativePath || relativePath.startsWith("..")) {
            continue;
        }

        const outputPath = path.join(output, relativePath);
        const result = await optimiseImage({
            filePath,
            relativePath,
            outputPath,
            dryRun,
            quality,
        });
        stats.processed += 1;

        switch (result.status) {
            case "optimised": {
                stats.optimised += 1;
                stats.savedBytes += result.savedBytes;
                const savingPercent = (
                    (result.savedBytes / result.originalSize) *
                    100
                ).toFixed(1);
                console.log(
                    `✓ ${relativePath} (-${formatBytes(
                        result.savedBytes
                    )}, ${savingPercent}%)`
                );
                break;
            }
            case "no-change":
                stats.noChange += 1;
                break;
            case "skipped":
                stats.skipped += 1;
                break;
            case "error":
                stats.errors += 1;
                console.warn(`⚠️  ${relativePath} failed: ${result.reason}`);
                break;
            default:
                break;
        }
    }

    console.log("\nSummary:");
    console.log(`  Processed: ${stats.processed}`);
    console.log(`  Optimised: ${stats.optimised}`);
    console.log(`  Unchanged: ${stats.noChange}`);
    console.log(`  Skipped:   ${stats.skipped}`);
    if (stats.errors > 0) {
        console.log(`  Errors:    ${stats.errors}`);
    }
    console.log(`  Saved:     ${formatBytes(stats.savedBytes)}`);

    if (dryRun) {
        console.log("\nNo files were modified (dry run).");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
