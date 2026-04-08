const PREFIX_ALIASES = [
  ["PIGGER_BRIDGE_", "CLAUDE_BRIDGE_"],
  ["PIGGER_AI_", "CLAUDE_AI_"],
  ["PIGGER_LOCAL_OAUTH_", "CLAUDE_LOCAL_OAUTH_"],
  ["PIGGER_PLUGIN_", "CLAUDE_PLUGIN_"],
  ["PIGGER_IN_CHROME_", "CLAUDE_IN_CHROME_"],
  ["PIGGER_AGENT_SDK_", "CLAUDE_AGENT_SDK_"],
  ["PIGGER_SESSION_", "CLAUDE_SESSION_"]
];
const RESERVED_PRIMARY_ENV_KEYS = /* @__PURE__ */ new Set([
  "PIGGER_CONFIG_DIR"
]);

function setEnvAlias(sourceKey, targetKey) {
  const value = process.env[sourceKey];
  if (value === void 0 || process.env[targetKey] !== void 0) {
    return;
  }
  process.env[targetKey] = value;
}

function applyPiggerEnvAliases() {
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("PIGGER_")) {
      continue;
    }
    if (RESERVED_PRIMARY_ENV_KEYS.has(key)) {
      continue;
    }
    const suffix = key.slice("PIGGER_".length);
    setEnvAlias(key, `CLAUDE_CODE_${suffix}`);
    setEnvAlias(key, `CLAUDE_${suffix}`);
  }
  for (const [primaryPrefix, legacyPrefix] of PREFIX_ALIASES) {
    for (const key of Object.keys(process.env)) {
      if (!key.startsWith(primaryPrefix)) {
        continue;
      }
      const suffix = key.slice(primaryPrefix.length);
      setEnvAlias(key, `${legacyPrefix}${suffix}`);
    }
  }
  setEnvAlias(
    "PIGGER_BASH_MAINTAIN_PROJECT_WORKING_DIR",
    "CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR"
  );
}

applyPiggerEnvAliases();

export {
  applyPiggerEnvAliases
};
