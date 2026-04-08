var define_MACRO_default = { VERSION: "0.0.1", PACKAGE_URL: "pigger", README_URL: null, FEEDBACK_CHANNEL: null, BUILD_TIME: "2026-03-31T13:59:20.008Z", ISSUES_EXPLAINER: "use /feedback to submit a bug report or feature request", NATIVE_PACKAGE_URL: null, VERSION_CHANGELOG: null };
import { jsx, jsxs } from "react/jsx-runtime";
import axios from "axios";
import { readFile, stat } from "fs/promises";
import { useCallback, useEffect, useState } from "react";
import { getLastAPIRequest } from "../bootstrap/state.js";
import { logEventTo1P } from "../services/analytics/firstPartyEventLogger.js";
import { logEvent } from "../services/analytics/index.js";
import { getLastAssistantMessage, normalizeMessagesForAPI } from "../utils/messages.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { Box, Text, useInput } from "../ink.js";
import { useKeybinding } from "../keybindings/useKeybinding.js";
import { checkAndRefreshOAuthTokenIfNeeded } from "../utils/auth.js";
import { logForDebugging } from "../utils/debug.js";
import { env } from "../utils/env.js";
import { getGitState, getIsGit } from "../utils/git.js";
import { getAuthHeaders, getUserAgent } from "../utils/http.js";
import { getInMemoryErrors, logError } from "../utils/log.js";
import { isEssentialTrafficOnly } from "../utils/privacyLevel.js";
import { extractTeammateTranscriptsFromTasks, getTranscriptPath, loadAllSubagentTranscriptsFromDisk, MAX_TRANSCRIPT_READ_BYTES } from "../utils/sessionStorage.js";
import { jsonStringify } from "../utils/slowOperations.js";
import { ConfigurableShortcutHint } from "./ConfigurableShortcutHint.js";
import { Byline } from "./design-system/Byline.js";
import { Dialog } from "./design-system/Dialog.js";
import { KeyboardShortcutHint } from "./design-system/KeyboardShortcutHint.js";
import TextInput from "./TextInput.js";
function redactSensitiveInfo(text) {
  let redacted = text;
  redacted = redacted.replace(/"(sk-ant[^\s"']{24,})"/g, '"[REDACTED_API_KEY]"');
  redacted = redacted.replace(
    // eslint-disable-next-line custom-rules/no-lookbehind-regex -- .replace(re, string) on /bug path: no-match returns same string (Object.is)
    /(?<![A-Za-z0-9"'])(sk-ant-?[A-Za-z0-9_-]{10,})(?![A-Za-z0-9"'])/g,
    "[REDACTED_API_KEY]"
  );
  redacted = redacted.replace(/AWS key: "(AWS[A-Z0-9]{20,})"/g, 'AWS key: "[REDACTED_AWS_KEY]"');
  redacted = redacted.replace(/(AKIA[A-Z0-9]{16})/g, "[REDACTED_AWS_KEY]");
  redacted = redacted.replace(
    // eslint-disable-next-line custom-rules/no-lookbehind-regex -- same as above
    /(?<![A-Za-z0-9])(AIza[A-Za-z0-9_-]{35})(?![A-Za-z0-9])/g,
    "[REDACTED_GCP_KEY]"
  );
  redacted = redacted.replace(
    // eslint-disable-next-line custom-rules/no-lookbehind-regex -- same as above
    /(?<![A-Za-z0-9])([a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com)(?![A-Za-z0-9])/g,
    "[REDACTED_GCP_SERVICE_ACCOUNT]"
  );
  redacted = redacted.replace(/(["']?x-api-key["']?\s*[:=]\s*["']?)[^"',\s)}\]]+/gi, "$1[REDACTED_API_KEY]");
  redacted = redacted.replace(/(["']?authorization["']?\s*[:=]\s*["']?(bearer\s+)?)[^"',\s)}\]]+/gi, "$1[REDACTED_TOKEN]");
  redacted = redacted.replace(/(AWS[_-][A-Za-z0-9_]+\s*[=:]\s*)["']?[^"',\s)}\]]+["']?/gi, "$1[REDACTED_AWS_VALUE]");
  redacted = redacted.replace(/(GOOGLE[_-][A-Za-z0-9_]+\s*[=:]\s*)["']?[^"',\s)}\]]+["']?/gi, "$1[REDACTED_GCP_VALUE]");
  redacted = redacted.replace(/((API[-_]?KEY|TOKEN|SECRET|PASSWORD)\s*[=:]\s*)["']?[^"',\s)}\]]+["']?/gi, "$1[REDACTED]");
  return redacted;
}
function getSanitizedErrorLogs() {
  return getInMemoryErrors().map((errorInfo) => {
    const errorCopy = {
      ...errorInfo
    };
    if (errorCopy && typeof errorCopy.error === "string") {
      errorCopy.error = redactSensitiveInfo(errorCopy.error);
    }
    return errorCopy;
  });
}
async function loadRawTranscriptJsonl() {
  try {
    const transcriptPath = getTranscriptPath();
    const {
      size
    } = await stat(transcriptPath);
    if (size > MAX_TRANSCRIPT_READ_BYTES) {
      logForDebugging(`Skipping raw transcript read: file too large (${size} bytes)`, {
        level: "warn"
      });
      return null;
    }
    return await readFile(transcriptPath, "utf-8");
  } catch {
    return null;
  }
}
function Feedback({
  abortSignal,
  messages,
  initialDescription,
  onDone,
  backgroundTasks = {}
}) {
  const [step, setStep] = useState("userInput");
  const [cursorOffset, setCursorOffset] = useState(0);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [feedbackId, setFeedbackId] = useState(null);
  const [error, setError] = useState(null);
  const [envInfo, setEnvInfo] = useState({
    isGit: false,
    gitState: null
  });
  const textInputColumns = useTerminalSize().columns - 4;
  useEffect(() => {
    async function loadEnvInfo() {
      const isGit = await getIsGit();
      let gitState = null;
      if (isGit) {
        gitState = await getGitState();
      }
      setEnvInfo({
        isGit,
        gitState
      });
    }
    void loadEnvInfo();
  }, []);
  const submitReport = useCallback(async () => {
    setStep("submitting");
    setError(null);
    setFeedbackId(null);
    const sanitizedErrors = getSanitizedErrorLogs();
    const lastAssistantMessage = getLastAssistantMessage(messages);
    const lastAssistantMessageId = lastAssistantMessage?.requestId ?? null;
    const [diskTranscripts, rawTranscriptJsonl] = await Promise.all([loadAllSubagentTranscriptsFromDisk(), loadRawTranscriptJsonl()]);
    const teammateTranscripts = extractTeammateTranscriptsFromTasks(backgroundTasks);
    const subagentTranscripts = {
      ...diskTranscripts,
      ...teammateTranscripts
    };
    const reportData = {
      latestAssistantMessageId: lastAssistantMessageId,
      message_count: messages.length,
      datetime: (/* @__PURE__ */ new Date()).toISOString(),
      description,
      platform: env.platform,
      gitRepo: envInfo.isGit,
      terminal: env.terminal,
      version: define_MACRO_default.VERSION,
      transcript: normalizeMessagesForAPI(messages),
      errors: sanitizedErrors,
      lastApiRequest: getLastAPIRequest(),
      ...Object.keys(subagentTranscripts).length > 0 && {
        subagentTranscripts
      },
      ...rawTranscriptJsonl && {
        rawTranscriptJsonl
      }
    };
    const result = await submitFeedback(reportData, abortSignal);
    if (result.success) {
      if (result.feedbackId) {
        setFeedbackId(result.feedbackId);
        logEvent("tengu_bug_report_submitted", {
          feedback_id: result.feedbackId,
          last_assistant_message_id: lastAssistantMessageId
        });
        logEventTo1P("tengu_bug_report_description", {
          feedback_id: result.feedbackId,
          description: redactSensitiveInfo(description)
        });
      }
      setStep("done");
    } else {
      if (result.isZdrOrg) {
        setError("Feedback collection is not available for organizations with custom data retention policies.");
      } else {
        setError("Could not submit feedback. Please try again later.");
      }
      setStep("userInput");
    }
  }, [description, envInfo.isGit, messages]);
  const handleCancel = useCallback(() => {
    if (step === "done") {
      if (error) {
        onDone("Error submitting feedback / bug report", {
          display: "system"
        });
      } else {
        onDone("Feedback / bug report submitted", {
          display: "system"
        });
      }
      return;
    }
    onDone("Feedback / bug report cancelled", {
      display: "system"
    });
  }, [step, error, onDone]);
  useKeybinding("confirm:no", handleCancel, {
    context: "Settings",
    isActive: step === "userInput"
  });
  useInput((input, key) => {
    if (step === "done") {
      if (error) {
        onDone("Error submitting feedback / bug report", {
          display: "system"
        });
      } else {
        onDone("Feedback / bug report submitted", {
          display: "system"
        });
      }
      return;
    }
    if (error && step !== "userInput") {
      onDone("Error submitting feedback / bug report", {
        display: "system"
      });
      return;
    }
    if (step === "consent" && (key.return || input === " ")) {
      void submitReport();
    }
  });
  return /* @__PURE__ */ jsxs(Dialog, { title: "Submit Feedback / Bug Report", onCancel: handleCancel, isCancelActive: step !== "userInput", inputGuide: (exitState) => exitState.pending ? /* @__PURE__ */ jsxs(Text, { children: [
    "Press ",
    exitState.keyName,
    " again to exit"
  ] }) : step === "userInput" ? /* @__PURE__ */ jsxs(Byline, { children: [
    /* @__PURE__ */ jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "continue" }),
    /* @__PURE__ */ jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "cancel" })
  ] }) : step === "consent" ? /* @__PURE__ */ jsxs(Byline, { children: [
    /* @__PURE__ */ jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "submit" }),
    /* @__PURE__ */ jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "cancel" })
  ] }) : null, children: [
    step === "userInput" && /* @__PURE__ */ jsxs(Box, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx(Text, { children: "Describe the issue below:" }),
      /* @__PURE__ */ jsx(TextInput, { value: description, onChange: (value) => {
        setDescription(value);
        if (error) {
          setError(null);
        }
      }, columns: textInputColumns, onSubmit: () => setStep("consent"), onExitMessage: () => onDone("Feedback cancelled", {
        display: "system"
      }), cursorOffset, onChangeCursorOffset: setCursorOffset, showCursor: true }),
      error && /* @__PURE__ */ jsxs(Box, { flexDirection: "column", gap: 1, children: [
        /* @__PURE__ */ jsx(Text, { color: "error", children: error }),
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: "Edit and press Enter to retry, or Esc to cancel" })
      ] })
    ] }),
    step === "consent" && /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { children: "This report will include:" }),
      /* @__PURE__ */ jsxs(Box, { marginLeft: 2, flexDirection: "column", children: [
        /* @__PURE__ */ jsxs(Text, { children: [
          "- Your feedback / bug description:",
          " ",
          /* @__PURE__ */ jsx(Text, { dimColor: true, children: description })
        ] }),
        /* @__PURE__ */ jsxs(Text, { children: [
          "- Environment info:",
          " ",
          /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
            env.platform,
            ", ",
            env.terminal,
            ", v",
            define_MACRO_default.VERSION
          ] })
        ] }),
        envInfo.gitState && /* @__PURE__ */ jsxs(Text, { children: [
          "- Git repo metadata:",
          " ",
          /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
            envInfo.gitState.branchName,
            envInfo.gitState.commitHash ? `, ${envInfo.gitState.commitHash.slice(0, 7)}` : "",
            envInfo.gitState.remoteUrl ? ` @ ${envInfo.gitState.remoteUrl}` : "",
            !envInfo.gitState.isHeadOnRemote && ", not synced",
            !envInfo.gitState.isClean && ", has local changes"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Text, { children: "- Current session transcript" })
      ] }),
      /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsxs(Text, { wrap: "wrap", dimColor: true, children: [
        "We will use your feedback to debug related issues or to improve",
        " ",
        "pigger's functionality (eg. to reduce the risk of bugs occurring in the future)."
      ] }) }),
      /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsxs(Text, { children: [
        "Press ",
        /* @__PURE__ */ jsx(Text, { bold: true, children: "Enter" }),
        " to confirm and submit."
      ] }) })
    ] }),
    step === "submitting" && /* @__PURE__ */ jsx(Box, { flexDirection: "row", gap: 1, children: /* @__PURE__ */ jsx(Text, { children: "Submitting report…" }) }),
    step === "done" && /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
      error ? /* @__PURE__ */ jsx(Text, { color: "error", children: error }) : /* @__PURE__ */ jsx(Text, { color: "success", children: "Thank you for your report!" }),
      feedbackId && /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
        "Feedback ID: ",
        feedbackId
      ] }),
      /* @__PURE__ */ jsxs(Box, { marginTop: 1, children: [
        /* @__PURE__ */ jsx(Text, { children: "Press " }),
        /* @__PURE__ */ jsx(Text, { bold: true, children: "任意键" }),
        /* @__PURE__ */ jsx(Text, { children: "关闭。" })
      ] })
    ] })
  ] });
}
function sanitizeAndLogError(err) {
  if (err instanceof Error) {
    const safeError = new Error(redactSensitiveInfo(err.message));
    if (err.stack) {
      safeError.stack = redactSensitiveInfo(err.stack);
    }
    logError(safeError);
  } else {
    const errorString = redactSensitiveInfo(String(err));
    logError(new Error(errorString));
  }
}
async function submitFeedback(data, signal) {
  if (isEssentialTrafficOnly()) {
    return {
      success: false
    };
  }
  try {
    await checkAndRefreshOAuthTokenIfNeeded();
    const authResult = getAuthHeaders();
    if (authResult.error) {
      return {
        success: false
      };
    }
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": getUserAgent(),
      ...authResult.headers
    };
    const response = await axios.post("https://api.anthropic.com/api/claude_cli_feedback", {
      content: jsonStringify(data)
    }, {
      headers,
      timeout: 3e4,
      // 30 second timeout to prevent hanging
      signal
    });
    if (response.status === 200) {
      const result = response.data;
      if (result?.feedback_id) {
        return {
          success: true,
          feedbackId: result.feedback_id
        };
      }
      sanitizeAndLogError(new Error("Failed to submit feedback: request did not return feedback_id"));
      return {
        success: false
      };
    }
    sanitizeAndLogError(new Error("Failed to submit feedback:" + response.status));
    return {
      success: false
    };
  } catch (err) {
    if (axios.isCancel(err)) {
      return {
        success: false
      };
    }
    if (axios.isAxiosError(err) && err.response?.status === 403) {
      const errorData = err.response.data;
      if (errorData?.error?.type === "permission_error" && errorData?.error?.message?.includes("Custom data retention settings")) {
        sanitizeAndLogError(new Error("Cannot submit feedback because custom data retention settings are enabled"));
        return {
          success: false,
          isZdrOrg: true
        };
      }
    }
    sanitizeAndLogError(err);
    return {
      success: false
    };
  }
}
export {
  Feedback,
  redactSensitiveInfo
};
