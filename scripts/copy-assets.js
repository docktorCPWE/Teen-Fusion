import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const source = join(process.cwd(), "assets");
const destination = join(process.cwd(), "dist", "assets");

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
