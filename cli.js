#!/usr/bin/env node
import "./src/utils/envAliases.js";

const { main } = await import("./src/main.js");

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
