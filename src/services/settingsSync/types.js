import { z } from "zod/v4";
import { lazySchema } from "../../utils/lazySchema.js";
const UserSyncContentSchema = lazySchema(
  () => z.object({
    entries: z.record(z.string(), z.string())
  })
);
const UserSyncDataSchema = lazySchema(
  () => z.object({
    userId: z.string(),
    version: z.number(),
    lastModified: z.string(),
    // ISO 8601 timestamp
    checksum: z.string(),
    // MD5 hash
    content: UserSyncContentSchema()
  })
);
const SYNC_KEYS = {
  USER_SETTINGS: "~/.pigger/settings.json",
  USER_MEMORY: "~/.pigger/PIGGER.md",
  projectSettings: (projectId) => `projects/${projectId}/.pigger/settings.local.json`,
  projectMemory: (projectId) => `projects/${projectId}/PIGGER.local.md`
};
export {
  SYNC_KEYS,
  UserSyncContentSchema,
  UserSyncDataSchema
};
