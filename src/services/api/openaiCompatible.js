import { APIUserAbortError } from "@anthropic-ai/sdk/error";
import { randomUUID } from "crypto";
import { addToTotalSessionCost } from "../../cost-tracker.js";
import {
  createAssistantAPIErrorMessage,
  createAssistantMessage
} from "../../utils/messages.js";
import { calculateUSDCost } from "../../utils/modelCost.js";
import { getProxyFetchOptions } from "../../utils/proxy.js";
import { EMPTY_USAGE } from "./emptyUsage.js";
function normalizeBaseUrl(baseUrl) {
  return baseUrl.trim().replace(/\/+$/, "");
}
function getChatCompletionEndpoints(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  const endpoints = [`${normalized}/chat/completions`];
  if (!normalized.endsWith("/v1")) {
    endpoints.push(`${normalized}/v1/chat/completions`);
  }
  return [...new Set(endpoints)];
}
function getResponseApiEndpoints(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  const endpoints = [`${normalized}/responses`];
  if (!normalized.endsWith("/v1")) {
    endpoints.push(`${normalized}/v1/responses`);
  }
  return [...new Set(endpoints)];
}
function isAbortError(error) {
  return error instanceof APIUserAbortError || error instanceof Error && (error.name === "AbortError" || error.message === "The operation was aborted");
}
function extractText(value) {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => extractText(entry)).filter(Boolean).join("\n\n");
  }
  if (!value || typeof value !== "object") {
    return "";
  }
  if ("text" in value && typeof value.text === "string") {
    return value.text;
  }
  if ("content" in value) {
    return extractText(value.content);
  }
  return "";
}
function flushUserMessage(messages, parts) {
  if (parts.length === 0) {
    return;
  }
  const textOnly = parts.every((part) => part.type === "text");
  messages.push({
    role: "user",
    content: textOnly ? parts.map((part) => part.text).join("\n\n") : parts
  });
  parts.length = 0;
}
function convertUserMessage(message) {
  const content = message.message.content;
  if (typeof content === "string") {
    return [{ role: "user", content }];
  }
  const result = [];
  const parts = [];
  for (const block of content) {
    switch (block.type) {
      case "text":
        parts.push({ type: "text", text: block.text });
        break;
      case "image":
        if (block.source?.type === "base64" && block.source.media_type && block.source.data) {
          parts.push({
            type: "image_url",
            image_url: {
              url: `data:${block.source.media_type};base64,${block.source.data}`
            }
          });
        }
        break;
      case "tool_result": {
        flushUserMessage(result, parts);
        result.push({
          role: "tool",
          tool_call_id: block.tool_use_id,
          content: extractText(block.content) || (block.is_error ? "Tool returned an error." : "")
        });
        break;
      }
      case "document":
        parts.push({
          type: "text",
          text: "[Document attachment omitted for this provider.]"
        });
        break;
      default:
        break;
    }
  }
  flushUserMessage(result, parts);
  return result;
}
function convertAssistantMessage(message) {
  const content = message.message.content;
  if (typeof content === "string") {
    return { role: "assistant", content };
  }
  const textParts = [];
  const toolCalls = [];
  for (const block of content) {
    switch (block.type) {
      case "text":
        textParts.push(block.text);
        break;
      case "tool_use":
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input ?? {})
          }
        });
        break;
      default:
        break;
    }
  }
  if (textParts.length === 0 && toolCalls.length === 0) {
    return null;
  }
  return {
    role: "assistant",
    content: textParts.length > 0 ? textParts.join("\n\n") : null,
    ...toolCalls.length > 0 && { tool_calls: toolCalls }
  };
}
function convertMessages(messages) {
  const result = [];
  for (const message of messages) {
    if (message.type === "user") {
      result.push(...convertUserMessage(message));
      continue;
    }
    const assistantMessage = convertAssistantMessage(message);
    if (assistantMessage) {
      result.push(assistantMessage);
    }
  }
  return result;
}
function flushResponsesMessage(messages, role, parts) {
  if (parts.length === 0) {
    return;
  }
  const textOnly = parts.every((part) => part.type === "input_text");
  messages.push({
    role,
    content: textOnly ? parts.map((part) => part.text).join("\n\n") : parts
  });
  parts.length = 0;
}
function convertMessagesToResponsesInput(messages) {
  const result = [];
  for (const message of messages) {
    const content = message.message.content;
    if (message.type === "user") {
      if (typeof content === "string") {
        result.push({ role: "user", content });
        continue;
      }
      const parts = [];
      for (const block of content) {
        switch (block.type) {
          case "text":
            parts.push({ type: "input_text", text: block.text });
            break;
          case "image":
            if (block.source?.type === "base64" && block.source.media_type && block.source.data) {
              parts.push({
                type: "input_image",
                image_url: `data:${block.source.media_type};base64,${block.source.data}`
              });
            }
            break;
          case "tool_result":
            flushResponsesMessage(result, "user", parts);
            result.push({
              type: "function_call_output",
              call_id: block.tool_use_id,
              output: extractText(block.content) || (block.is_error ? "Tool returned an error." : "")
            });
            break;
          case "document":
            parts.push({
              type: "input_text",
              text: "[Document attachment omitted for this provider.]"
            });
            break;
          default:
            break;
        }
      }
      flushResponsesMessage(result, "user", parts);
      continue;
    }
    if (typeof content === "string") {
      result.push({ role: "assistant", content });
      continue;
    }
    const parts = [];
    for (const block of content) {
      switch (block.type) {
        case "text":
          parts.push({ type: "input_text", text: block.text });
          break;
        case "tool_use":
          flushResponsesMessage(result, "assistant", parts);
          result.push({
            type: "function_call",
            call_id: block.id,
            name: block.name,
            arguments: JSON.stringify(block.input ?? {})
          });
          break;
        default:
          break;
      }
    }
    flushResponsesMessage(result, "assistant", parts);
  }
  return result;
}
function isFunctionTool(tool) {
  return "name" in tool && typeof tool.name === "string" && "description" in tool && typeof tool.description === "string" && "input_schema" in tool && !!tool.input_schema && typeof tool.input_schema === "object";
}
function normalizeStrictJsonSchema(schema) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }
  const normalized = { ...schema };
  if (normalized.properties && typeof normalized.properties === "object" && !Array.isArray(normalized.properties)) {
    normalized.properties = Object.fromEntries(
      Object.entries(normalized.properties).map(([key, value]) => [key, normalizeStrictJsonSchema(value)])
    );
  }
  if (normalized.items) {
    normalized.items = Array.isArray(normalized.items) ? normalized.items.map((item) => normalizeStrictJsonSchema(item)) : normalizeStrictJsonSchema(normalized.items);
  }
  for (const key of ["anyOf", "allOf", "oneOf"]) {
    if (Array.isArray(normalized[key])) {
      normalized[key] = normalized[key].map((entry) => normalizeStrictJsonSchema(entry));
    }
  }
  if (normalized.type === "object" || normalized.properties) {
    normalized.additionalProperties = false;
  }
  return normalized;
}
function convertToolsToChatCompletions(tools) {
  return tools.filter(isFunctionTool).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: normalizeStrictJsonSchema(tool.input_schema),
      ..."strict" in tool && tool.strict ? { strict: true } : {}
    }
  }));
}
function convertToolsToResponses(tools) {
  return tools.filter(isFunctionTool).map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: normalizeStrictJsonSchema(tool.input_schema),
    ..."strict" in tool && tool.strict ? { strict: true } : {}
  }));
}
function convertToolChoiceToChatCompletions(toolChoice) {
  if (!toolChoice || toolChoice.type === "auto") {
    return toolChoice ? "auto" : void 0;
  }
  if (toolChoice.type === "tool") {
    return {
      type: "function",
      function: {
        name: toolChoice.name
      }
    };
  }
  return void 0;
}
function convertToolChoiceToResponses(toolChoice) {
  if (!toolChoice || toolChoice.type === "auto") {
    return toolChoice ? "auto" : void 0;
  }
  if (toolChoice.type === "tool") {
    return {
      type: "function",
      name: toolChoice.name
    };
  }
  return void 0;
}
function parseToolArguments(argumentsText) {
  if (!argumentsText) {
    return {};
  }
  if (typeof argumentsText === "object") {
    return argumentsText;
  }
  try {
    const parsed = JSON.parse(argumentsText);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function cloneEmptyUsage() {
  return {
    ...EMPTY_USAGE,
    server_tool_use: {
      ...EMPTY_USAGE.server_tool_use
    },
    cache_creation: {
      ...EMPTY_USAGE.cache_creation
    },
    iterations: Array.isArray(EMPTY_USAGE.iterations) ? [...EMPTY_USAGE.iterations] : EMPTY_USAGE.iterations
  };
}
function toSafeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function normalizeOpenAICompatibleUsage(rawUsage, metadata = {}) {
  const usage = cloneEmptyUsage();
  if (!rawUsage || typeof rawUsage !== "object") {
    if (typeof metadata.serviceTier === "string" && metadata.serviceTier) {
      usage.service_tier = metadata.serviceTier;
    }
    if (typeof metadata.inferenceGeo === "string") {
      usage.inference_geo = metadata.inferenceGeo;
    }
    if (typeof metadata.speed === "string" && metadata.speed) {
      usage.speed = metadata.speed;
    }
    if (metadata.webSearchRequests !== void 0) {
      usage.server_tool_use.web_search_requests = toSafeNumber(metadata.webSearchRequests);
    }
    if (metadata.webFetchRequests !== void 0) {
      usage.server_tool_use.web_fetch_requests = toSafeNumber(metadata.webFetchRequests);
    }
    return usage;
  }
  const promptTokens = toSafeNumber(
    rawUsage.prompt_tokens ?? rawUsage.input_tokens ?? rawUsage.promptTokens
  );
  const hasExplicitCacheBreakout = rawUsage.cache_read_input_tokens != null || rawUsage.cache_creation_input_tokens != null;
  const cacheReadInputTokens = toSafeNumber(
    rawUsage.cache_read_input_tokens ?? rawUsage.prompt_tokens_details?.cached_tokens ?? rawUsage.input_tokens_details?.cached_tokens
  );
  const cacheCreationInputTokens = toSafeNumber(
    rawUsage.cache_creation_input_tokens ?? rawUsage.prompt_tokens_details?.cached_creation_tokens ?? rawUsage.input_tokens_details?.cached_creation_tokens
  );
  usage.input_tokens = hasExplicitCacheBreakout ? promptTokens : Math.max(
    promptTokens - cacheReadInputTokens - cacheCreationInputTokens,
    0
  );
  usage.output_tokens = toSafeNumber(
    rawUsage.completion_tokens ?? rawUsage.output_tokens ?? rawUsage.completionTokens
  );
  usage.cache_read_input_tokens = cacheReadInputTokens;
  usage.cache_creation_input_tokens = cacheCreationInputTokens;
  usage.server_tool_use = {
    web_search_requests: toSafeNumber(
      metadata.webSearchRequests ?? rawUsage.tool_usage?.web_search?.num_requests ?? rawUsage.web_search_requests
    ),
    web_fetch_requests: toSafeNumber(
      metadata.webFetchRequests ?? rawUsage.tool_usage?.web_fetch?.num_requests ?? rawUsage.web_fetch_requests
    )
  };
  if (typeof metadata.serviceTier === "string" && metadata.serviceTier) {
    usage.service_tier = metadata.serviceTier;
  } else if (typeof rawUsage.service_tier === "string" && rawUsage.service_tier) {
    usage.service_tier = rawUsage.service_tier;
  }
  if (typeof metadata.inferenceGeo === "string") {
    usage.inference_geo = metadata.inferenceGeo;
  } else if (typeof rawUsage.inference_geo === "string") {
    usage.inference_geo = rawUsage.inference_geo;
  }
  if (typeof metadata.speed === "string" && metadata.speed) {
    usage.speed = metadata.speed;
  } else if (typeof rawUsage.speed === "string" && rawUsage.speed) {
    usage.speed = rawUsage.speed;
  }
  if (Array.isArray(rawUsage.iterations)) {
    usage.iterations = rawUsage.iterations;
  }
  return usage;
}
function createOpenAICompatibleAssistantMessage({
  model,
  content,
  usage
}) {
  const assistantMessage = createAssistantMessage({
    content,
    usage
  });
  assistantMessage.message.model = model;
  return assistantMessage;
}
function trackOpenAICompatibleUsage(model, usage) {
  const costUSD = calculateUSDCost(model, usage);
  addToTotalSessionCost(costUSD, usage, model);
}
function getResponseText(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content.map((part) => part?.type === "text" && typeof part.text === "string" ? part.text : "").filter(Boolean).join("\n\n");
}
function getResponsesOutputItems(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  if (Array.isArray(payload.output)) {
    return payload.output;
  }
  if (payload.output && typeof payload.output === "object") {
    return [payload.output];
  }
  return [];
}
function getResponsesOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }
  const textParts = [];
  for (const item of getResponsesOutputItems(payload)) {
    if (item?.type === "output_text" && typeof item.text === "string") {
      textParts.push(item.text);
      continue;
    }
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }
    for (const part of item.content) {
      if ((part?.type === "output_text" || part?.type === "text") && typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }
  return textParts.join("\n\n");
}
function getResponsesToolCalls(payload) {
  const toolCalls = [];
  for (const item of getResponsesOutputItems(payload)) {
    if ((item?.type === "function_call" || item?.type === "tool_call") && typeof item.name === "string") {
      toolCalls.push({
        id: item.call_id || item.id || `toolu_${randomUUID()}`,
        name: item.name,
        arguments: item.arguments
      });
      continue;
    }
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }
    for (const part of item.content) {
      if ((part?.type === "function_call" || part?.type === "tool_call") && typeof part.name === "string") {
        toolCalls.push({
          id: part.call_id || part.id || `toolu_${randomUUID()}`,
          name: part.name,
          arguments: part.arguments
        });
      }
    }
  }
  return toolCalls;
}
function extractResponsesMessageTextFromItem(item) {
  if (!item || item.type !== "message" || !Array.isArray(item.content)) {
    return "";
  }
  return item.content.map((part) => (part?.type === "output_text" || part?.type === "text") && typeof part.text === "string" ? part.text : "").filter(Boolean).join("\n\n");
}
function parseServerSentEventBlock(rawBlock) {
  const lines = rawBlock.replaceAll("\r", "").split("\n");
  let event = null;
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) {
    return null;
  }
  const data = dataLines.join("\n");
  if (!data || data === "[DONE]") {
    return null;
  }
  try {
    return {
      event,
      payload: JSON.parse(data)
    };
  } catch {
    return null;
  }
}
async function readResponsesStream(response, signal) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Responses endpoint did not return a readable body.");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  let streamedText = "";
  let sawTextDelta = false;
  const completedTextParts = [];
  const toolCalls = /* @__PURE__ */ new Map();
  const toolCallAliases = /* @__PURE__ */ new Map();
  let completedResponse = null;
  function resolveToolCallId(id) {
    return toolCallAliases.get(id) ?? id;
  }
  function registerToolCallAlias(aliasId, canonicalId) {
    if (!aliasId || !canonicalId || aliasId === canonicalId) {
      return;
    }
    toolCallAliases.set(aliasId, canonicalId);
  }
  function ensureToolCall(id, initial = {}) {
    const resolvedId = resolveToolCallId(id);
    const existing = toolCalls.get(resolvedId) ?? {
      id: resolvedId,
      name: "",
      arguments: ""
    };
    const next = {
      ...existing,
      id: resolvedId,
      ...initial
    };
    toolCalls.set(resolvedId, next);
    return next;
  }
  function handleEventBlock(rawBlock) {
    const parsed = parseServerSentEventBlock(rawBlock);
    if (!parsed) {
      return;
    }
    const payload = parsed.payload;
    if (payload?.response && typeof payload.response === "object") {
      completedResponse = payload.response;
    }
    switch (payload?.type) {
      case "response.output_text.delta":
        if (typeof payload.delta === "string") {
          streamedText += payload.delta;
          sawTextDelta = true;
        }
        break;
      case "response.output_text.done":
        if (!sawTextDelta && typeof payload.text === "string" && payload.text) {
          completedTextParts.push(payload.text);
        }
        break;
      case "response.output_item.added":
      case "response.output_item.done": {
        const item = payload.item;
        if (item?.type === "function_call") {
          const toolCallId = item.call_id || item.id || `toolu_${randomUUID()}`;
          if (typeof item.id === "string") {
            registerToolCallAlias(item.id, toolCallId);
          }
          ensureToolCall(toolCallId, {
            id: toolCallId,
            name: typeof item.name === "string" ? item.name : void 0,
            arguments: typeof item.arguments === "string" ? item.arguments : void 0
          });
        } else if (!sawTextDelta) {
          const text = extractResponsesMessageTextFromItem(item);
          if (text) {
            completedTextParts.push(text);
          }
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const itemId = typeof payload.item_id === "string" ? payload.item_id : null;
        if (!itemId || typeof payload.delta !== "string") {
          break;
        }
        const existing = ensureToolCall(itemId, { id: itemId });
        const resolvedId = resolveToolCallId(itemId);
        toolCalls.set(resolvedId, {
          ...existing,
          id: resolvedId,
          arguments: `${existing.arguments ?? ""}${payload.delta}`
        });
        break;
      }
      case "response.function_call_arguments.done": {
        const itemId = typeof payload.item_id === "string" ? payload.item_id : null;
        if (!itemId) {
          break;
        }
        ensureToolCall(itemId, {
          id: itemId,
          arguments: typeof payload.arguments === "string" ? payload.arguments : void 0
        });
        break;
      }
      default:
        break;
    }
  }
  while (true) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) {
        throw new APIUserAbortError();
      }
      throw error;
    }
    const {
      done,
      value
    } = chunk;
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawBlock = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (rawBlock.trim()) {
        handleEventBlock(rawBlock);
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    handleEventBlock(buffer);
  }
  const streamedToolCalls = [...toolCalls.values()].filter((toolCall) => typeof toolCall.name === "string" && toolCall.name);
  const completedToolCalls = completedResponse ? getResponsesToolCalls(completedResponse) : [];
  const mergedToolCalls = new Map();
  const canonicalizeToolCall = (toolCall) => ({
    ...toolCall,
    id: resolveToolCallId(toolCall.id)
  });
  for (const toolCall of completedToolCalls) {
    const canonicalToolCall = canonicalizeToolCall(toolCall);
    mergedToolCalls.set(canonicalToolCall.id, canonicalToolCall);
  }
  for (const toolCall of streamedToolCalls) {
    const canonicalToolCall = canonicalizeToolCall(toolCall);
    const existing = mergedToolCalls.get(canonicalToolCall.id);
    mergedToolCalls.set(canonicalToolCall.id, {
      ...existing,
      ...canonicalToolCall,
      name: canonicalToolCall.name || existing?.name || "",
      arguments: canonicalToolCall.arguments || existing?.arguments || ""
    });
  }
  const normalizedUsage = normalizeOpenAICompatibleUsage(completedResponse?.usage, {
    serviceTier: completedResponse?.service_tier,
    webSearchRequests: completedResponse?.tool_usage?.web_search?.num_requests,
    webFetchRequests: completedResponse?.tool_usage?.web_fetch?.num_requests
  });
  return {
    text: streamedText || completedTextParts.join("\n\n") || getResponsesOutputText(completedResponse),
    toolCalls: [...mergedToolCalls.values()].filter((toolCall) => typeof toolCall.name === "string" && toolCall.name),
    usage: normalizedUsage,
    response: completedResponse
  };
}
function createProviderErrorMessage(provider, status, detail) {
  if (status === 401 || status === 403) {
    return createAssistantAPIErrorMessage({
      error: "authentication_failed",
      content: `Check your /model provider settings. ${detail}`
    });
  }
  if (status === 404) {
    return createAssistantAPIErrorMessage({
      error: "invalid_request",
      content: `The selected model or endpoint is unavailable on ${provider.name}. Check the base URL and model in /model.`
    });
  }
  return createAssistantAPIErrorMessage({
    error: "unknown",
    content: `${provider.name} request failed (${status}). ${detail}`
  });
}
function buildOpenAICompatibleRequestHeaders(provider) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${provider.apiKey ?? ""}`,
    "Content-Type": "application/json"
  };
}
async function validateOpenAICompatibleModel({
  provider,
  model,
  signal
}) {
  if (provider.wireApi === "responses") {
    const requestBody = {
      model,
      input: "Hi",
      max_output_tokens: 1,
      store: false
    };
    let lastErrorMessage = "No responses endpoint responded successfully.";
    for (const endpoint of getResponseApiEndpoints(provider.baseUrl)) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: buildOpenAICompatibleRequestHeaders(provider),
          body: JSON.stringify(requestBody),
          signal,
          ...getProxyFetchOptions()
        });
        if (response.ok) {
          return { valid: true };
        }
        const text = await response.text();
        const detail = text.trim().slice(0, 400) || "No additional error details were returned.";
        lastErrorMessage = `${provider.name} validation failed (${response.status}). ${detail}`;
        if (response.status === 401 || response.status === 403) {
          return {
            valid: false,
            error: "Authentication failed. Please check your GPT/OpenAI API key."
          };
        }
        if (response.status === 404) {
          continue;
        }
        if (response.status === 400 && /model|deployment|engine/i.test(detail)) {
          return {
            valid: false,
            error: `Model '${model}' not found on ${provider.name}.`
          };
        }
        return {
          valid: false,
          error: lastErrorMessage
        };
      } catch (error) {
        if (isAbortError(error) || signal?.aborted) {
          throw new APIUserAbortError();
        }
        lastErrorMessage = error instanceof Error ? `POST ${endpoint} failed: ${error.message}` : `POST ${endpoint} failed`;
      }
    }
    return {
      valid: false,
      error: lastErrorMessage
    };
  }
  const requestBody = {
    model,
    messages: [{ role: "user", content: "Hi" }],
    max_tokens: 1,
    stream: false
  };
  let lastErrorMessage = "No chat completion endpoint responded successfully.";
  for (const endpoint of getChatCompletionEndpoints(provider.baseUrl)) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: buildOpenAICompatibleRequestHeaders(provider),
        body: JSON.stringify(requestBody),
        signal,
        ...getProxyFetchOptions()
      });
      if (response.ok) {
        return { valid: true };
      }
      const text = await response.text();
      const detail = text.trim().slice(0, 400) || "No additional error details were returned.";
      lastErrorMessage = `${provider.name} validation failed (${response.status}). ${detail}`;
      if (response.status === 401 || response.status === 403) {
        return {
          valid: false,
          error: "Authentication failed. Please check your GPT/OpenAI API key."
        };
      }
      if (response.status === 404) {
        continue;
      }
      if (response.status === 400 && /model|deployment|engine/i.test(detail)) {
        return {
          valid: false,
          error: `Model '${model}' not found on ${provider.name}.`
        };
      }
      return {
        valid: false,
        error: lastErrorMessage
      };
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) {
        throw new APIUserAbortError();
      }
      lastErrorMessage = error instanceof Error ? `POST ${endpoint} failed: ${error.message}` : `POST ${endpoint} failed`;
    }
  }
  return {
    valid: false,
    error: lastErrorMessage
  };
}
async function queryOpenAICompatibleModel({
  provider,
  model,
  messages,
  systemPrompt,
  tools,
  toolChoice,
  signal,
  maxOutputTokens,
  temperature
}) {
  if (provider.wireApi === "responses") {
    const requestBody = {
      model,
      input: convertMessagesToResponsesInput(messages),
      max_output_tokens: maxOutputTokens,
      stream: true,
      ...systemPrompt.length > 0 ? {
        instructions: systemPrompt.join("\n\n").trim()
      } : {},
      ...temperature !== void 0 ? { temperature } : {},
      ...tools.length > 0 ? { tools: convertToolsToResponses(tools) } : {},
      ...toolChoice ? { tool_choice: convertToolChoiceToResponses(toolChoice) } : {},
      ...provider.reasoningEffort ? {
        reasoning: {
          effort: provider.reasoningEffort
        }
      } : {},
      ...provider.disableResponseStorage === true ? { store: false } : {}
    };
    let lastErrorMessage = "No responses endpoint responded successfully.";
    for (const endpoint of getResponseApiEndpoints(provider.baseUrl)) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: buildOpenAICompatibleRequestHeaders(provider),
          body: JSON.stringify(requestBody),
          signal,
          ...getProxyFetchOptions()
        });
        if (!response.ok) {
          const text = await response.text();
          const detail = text.trim().slice(0, 400) || "No additional error details were returned.";
          lastErrorMessage = `POST ${endpoint} failed with ${response.status}: ${detail}`;
          if (response.status !== 404) {
            return createProviderErrorMessage(provider, response.status, detail);
          }
          continue;
        }
        const blocks = [];
        const streamedResponse = await readResponsesStream(response, signal);
        const responseText = streamedResponse.text;
        if (responseText) {
          blocks.push({
            type: "text",
            text: responseText
          });
        }
        for (const toolCall of streamedResponse.toolCalls) {
          blocks.push({
            type: "tool_use",
            id: toolCall.id,
            name: toolCall.name,
            input: parseToolArguments(toolCall.arguments)
          });
        }
        if (blocks.length === 0) {
          const detail = streamedResponse.response?.status ? ` Status: ${streamedResponse.response.status}.` : "";
          return createAssistantAPIErrorMessage({
            error: "unknown",
            content: `${provider.name} returned no assistant output.${detail}`
          });
        }
        trackOpenAICompatibleUsage(model, streamedResponse.usage);
        return createOpenAICompatibleAssistantMessage({
          model,
          content: blocks,
          usage: streamedResponse.usage
        });
      } catch (error) {
        if (isAbortError(error) || signal.aborted) {
          throw new APIUserAbortError();
        }
        lastErrorMessage = error instanceof Error ? `POST ${endpoint} failed: ${error.message}` : `POST ${endpoint} failed`;
      }
    }
    return createAssistantAPIErrorMessage({
      error: "unknown",
      content: lastErrorMessage
    });
  }
  const openAIMessages = [];
  const systemText = systemPrompt.join("\n\n").trim();
  if (systemText) {
    openAIMessages.push({
      role: "system",
      content: systemText
    });
  }
  openAIMessages.push(...convertMessages(messages));
  const requestBody = {
    model,
    messages: openAIMessages,
    max_tokens: maxOutputTokens,
    ...temperature !== void 0 ? { temperature } : {},
    ...tools.length > 0 ? { tools: convertToolsToChatCompletions(tools) } : {},
    ...toolChoice ? { tool_choice: convertToolChoiceToChatCompletions(toolChoice) } : {},
    stream: false
  };
  let lastErrorMessage = "No chat completion endpoint responded successfully.";
  for (const endpoint of getChatCompletionEndpoints(provider.baseUrl)) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: buildOpenAICompatibleRequestHeaders(provider),
        body: JSON.stringify(requestBody),
        signal,
        ...getProxyFetchOptions()
      });
      if (!response.ok) {
        const text = await response.text();
        const detail = text.trim().slice(0, 400) || "No additional error details were returned.";
        lastErrorMessage = `POST ${endpoint} failed with ${response.status}: ${detail}`;
        if (response.status !== 404) {
          return createProviderErrorMessage(provider, response.status, detail);
        }
        continue;
      }
      const payload = await response.json();
      const message = payload.choices?.[0]?.message;
      if (!message) {
        return createAssistantAPIErrorMessage({
          error: "unknown",
          content: `${provider.name} returned no assistant message.`
        });
      }
      const blocks = [];
      const responseText = getResponseText(message.content);
      if (responseText) {
        blocks.push({
          type: "text",
          text: responseText
        });
      }
      for (const toolCall of message.tool_calls ?? []) {
        if (!toolCall?.function?.name) {
          continue;
        }
        blocks.push({
          type: "tool_use",
          id: toolCall.id || `toolu_${randomUUID()}`,
          name: toolCall.function.name,
          input: parseToolArguments(toolCall.function.arguments)
        });
      }
      const normalizedUsage = normalizeOpenAICompatibleUsage(payload.usage, {
        serviceTier: payload.service_tier
      });
      trackOpenAICompatibleUsage(model, normalizedUsage);
      return createOpenAICompatibleAssistantMessage({
        model,
        content: blocks.length > 0 ? blocks : "",
        usage: normalizedUsage
      });
    } catch (error) {
      if (isAbortError(error) || signal.aborted) {
        throw new APIUserAbortError();
      }
      lastErrorMessage = error instanceof Error ? `POST ${endpoint} failed: ${error.message}` : `POST ${endpoint} failed`;
    }
  }
  return createAssistantAPIErrorMessage({
    error: "unknown",
    content: lastErrorMessage
  });
}
export {
  queryOpenAICompatibleModel,
  validateOpenAICompatibleModel
};
