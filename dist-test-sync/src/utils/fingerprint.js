var define_MACRO_default = { VERSION: "0.0.1", PACKAGE_URL: "pigger", README_URL: null, FEEDBACK_CHANNEL: null, BUILD_TIME: "2026-03-31T13:59:20.008Z", ISSUES_EXPLAINER: "use /feedback to submit a bug report or feature request", NATIVE_PACKAGE_URL: null, VERSION_CHANGELOG: null };
import { createHash } from "crypto";
const FINGERPRINT_SALT = "59cf53e54c78";
function extractFirstMessageText(messages) {
  const firstUserMessage = messages.find((msg) => msg.type === "user");
  if (!firstUserMessage) {
    return "";
  }
  const content = firstUserMessage.message.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textBlock = content.find((block) => block.type === "text");
    if (textBlock && textBlock.type === "text") {
      return textBlock.text;
    }
  }
  return "";
}
function computeFingerprint(messageText, version) {
  const indices = [4, 7, 20];
  const chars = indices.map((i) => messageText[i] || "0").join("");
  const fingerprintInput = `${FINGERPRINT_SALT}${chars}${version}`;
  const hash = createHash("sha256").update(fingerprintInput).digest("hex");
  return hash.slice(0, 3);
}
function computeFingerprintFromMessages(messages) {
  const firstMessageText = extractFirstMessageText(messages);
  return computeFingerprint(firstMessageText, define_MACRO_default.VERSION);
}
export {
  FINGERPRINT_SALT,
  computeFingerprint,
  computeFingerprintFromMessages,
  extractFirstMessageText
};
