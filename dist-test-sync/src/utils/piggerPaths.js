import { basename, join } from "path";
import { getFsImplementation } from "./fsOperations.js";

const PRIMARY_MEMORY_FILE = "PIGGER.md";
const LEGACY_MEMORY_FILE = "CLAUDE.md";
const PRIMARY_LOCAL_MEMORY_FILE = "PIGGER.local.md";
const LEGACY_LOCAL_MEMORY_FILE = "CLAUDE.local.md";

function getMemoryFileNames(memoryKind = "standard") {
  if (memoryKind === "local") {
    return [PRIMARY_LOCAL_MEMORY_FILE, LEGACY_LOCAL_MEMORY_FILE];
  }
  return [PRIMARY_MEMORY_FILE, LEGACY_MEMORY_FILE];
}

function getMemoryFilePathCandidates(baseDir, memoryKind = "standard") {
  return getMemoryFileNames(memoryKind).map((name) => join(baseDir, name));
}

function getPreferredMemoryFilePath(baseDir, memoryKind = "standard") {
  const fs = getFsImplementation();
  const candidates = getMemoryFilePathCandidates(baseDir, memoryKind);
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
    }
  }
  return candidates[0];
}

function getExistingOrPrimaryMemoryFilePaths(baseDir, memoryKind = "standard") {
  const fs = getFsImplementation();
  const candidates = getMemoryFilePathCandidates(baseDir, memoryKind);
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return [candidate];
      }
    } catch {
    }
  }
  return [candidates[0]];
}

function isLegacyMemoryFilePath(filePath) {
  const name = basename(filePath);
  return name === LEGACY_MEMORY_FILE || name === LEGACY_LOCAL_MEMORY_FILE;
}

function isSupportedMemoryFileName(name) {
  return name === PRIMARY_MEMORY_FILE || name === LEGACY_MEMORY_FILE || name === PRIMARY_LOCAL_MEMORY_FILE || name === LEGACY_LOCAL_MEMORY_FILE;
}

export {
  LEGACY_LOCAL_MEMORY_FILE,
  LEGACY_MEMORY_FILE,
  PRIMARY_LOCAL_MEMORY_FILE,
  PRIMARY_MEMORY_FILE,
  getExistingOrPrimaryMemoryFilePaths,
  getMemoryFileNames,
  getMemoryFilePathCandidates,
  getPreferredMemoryFilePath,
  isLegacyMemoryFilePath,
  isSupportedMemoryFileName
};
