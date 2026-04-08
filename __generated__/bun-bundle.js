function isTruthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export function feature(name) {
  const envKey = 'CLAUDE_CODE_FEATURE_' + String(name).toUpperCase();
  if (process.env[envKey] != null) {
    return isTruthy(process.env[envKey]);
  }
  const list = process.env.CLAUDE_CODE_FEATURES;
  if (!list) {
    return false;
  }
  return list
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .includes(String(name));
}

export default { feature };
