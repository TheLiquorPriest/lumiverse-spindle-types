import type {
  FinalResponseDTO,
  HostToWorker,
  InterceptorBreakdownEntryDTO,
  InterceptorResultDTO,
  PromptBlockCreateAuthorityDTO,
  PromptBlockMutationTargetDTO,
  PromptBlockOccurrenceDTO,
  SpindleAPI,
  SpindleFrontendContext,
  SpindleHostDescriptorV1,
  SpindleHostLocale,
  SpindleHostLocaleAPI,
  SpindleManifest,
  SpindlePermission,
  SpindleTabLocation,
  WorkerToHost,
} from "lumiverse-spindle-types";
import {
  ALL_PERMISSIONS,
  SPINDLE_COMPATIBILITY_ERROR_CODE,
  SPINDLE_HOST_CAPABILITIES,
  isValidPermission,
} from "lumiverse-spindle-types";

const host: SpindleHostDescriptorV1 = {
  descriptorVersion: 1,
  lumiverseVersion: "1.2.3",
  capabilities: SPINDLE_HOST_CAPABILITIES,
  extensionInstallationId: "550e8400-e29b-41d4-a716-446655440000",
};

const localeApi: SpindleHostLocaleAPI = {
  get: () => "en",
  subscribe: (listener) => {
    listener("fr");
    return () => undefined;
  },
};

const locale: SpindleHostLocale = localeApi.get();
const permission: SpindlePermission = "final_response";
const allPermissions: readonly SpindlePermission[] = ALL_PERMISSIONS;
if (!isValidPermission(permission) || !allPermissions.includes(permission)) {
  throw new Error("final_response must be a valid public permission");
}

const finalResponse: FinalResponseDTO = {
  content: "An extension-authored final answer",
  reasoning: "The selected branch completed successfully.",
  fallbackMessageIndex: 0,
};
const breakdown: InterceptorBreakdownEntryDTO = { messageIndex: 0, name: "Additional context" };

const result: InterceptorResultDTO = {
  messages: [{ role: "system", content: "Additional context" }],
  breakdown: [breakdown],
  finalResponse,
};
const wireResult: WorkerToHost = {
  type: "intercept_result",
  requestId: "request-id",
  registrationId: "registration-id",
  messages: result.messages,
  breakdown: [breakdown],
  finalResponse,
};

const presetBlockOccurrence: PromptBlockOccurrenceDTO = { blockId: "duplicate-block", promptOrder: 1 };
const presetBlockTarget: PromptBlockMutationTargetDTO = { ...presetBlockOccurrence, expectedCacheRevision: 8 };
const presetBlockCreateAuthority: PromptBlockCreateAuthorityDTO = { expectedCacheRevision: 8, index: 1 };
const presetBlocksGet: WorkerToHost = { type: "preset_blocks_get", requestId: "get-block", presetId: "preset-1", occurrence: presetBlockOccurrence, userId: "user-1" };
const presetBlocksCreate: WorkerToHost = { type: "preset_blocks_create", requestId: "create-block", presetId: "preset-1", input: { content: "new block" }, options: presetBlockCreateAuthority, userId: "user-1" };
const presetBlocksUpdate: WorkerToHost = { type: "preset_blocks_update", requestId: "update-block", presetId: "preset-1", target: presetBlockTarget, input: { content: "updated block" }, userId: "user-1" };
const presetBlocksDelete: WorkerToHost = { type: "preset_blocks_delete", requestId: "delete-block", presetId: "preset-1", target: presetBlockTarget, userId: "user-1" };
// @ts-expect-error ID-only reads cannot distinguish duplicate prompt blocks.
const legacyPresetBlocksGet: WorkerToHost = { type: "preset_blocks_get", requestId: "legacy-get", presetId: "preset-1", blockId: "duplicate-block" };
// @ts-expect-error Creating a prompt block requires revision authority.
const legacyPresetBlocksCreate: WorkerToHost = { type: "preset_blocks_create", requestId: "legacy-create", presetId: "preset-1", input: { content: "unsafe" } };
// @ts-expect-error The former top-level index does not authorize create.
const legacyPresetBlocksCreateIndex: WorkerToHost = { type: "preset_blocks_create", requestId: "legacy-index", presetId: "preset-1", input: { content: "unsafe" }, index: 0 };
// @ts-expect-error Update must include occurrence and revision authority.
const legacyPresetBlocksUpdate: WorkerToHost = { type: "preset_blocks_update", requestId: "legacy-update", presetId: "preset-1", blockId: "duplicate-block", input: { content: "unsafe" } };
// @ts-expect-error Delete must include occurrence and revision authority.
const legacyPresetBlocksDelete: WorkerToHost = { type: "preset_blocks_delete", requestId: "legacy-delete", presetId: "preset-1", blockId: "duplicate-block" };
// @ts-expect-error User scope belongs at the top-level wire field, not in options.
const nestedUserScope: WorkerToHost = { type: "preset_blocks_create", requestId: "nested-user-scope", presetId: "preset-1", input: {}, options: { expectedCacheRevision: 8, userId: "user-1" } };
void presetBlocksGet;
void presetBlocksCreate;
void presetBlocksUpdate;
void presetBlocksDelete;
void legacyPresetBlocksGet;
void legacyPresetBlocksCreate;
void legacyPresetBlocksCreateIndex;
void legacyPresetBlocksUpdate;
void legacyPresetBlocksDelete;
void nestedUserScope;
const init: HostToWorker = {
  type: "init",
  manifest: {
    version: "1.0.0",
    name: "Legacy extension",
    identifier: "legacy_extension",
    author: "Extension author",
    github: "https://github.com/example/legacy-extension",
    homepage: "https://example.com/legacy-extension",
    permissions: [],
  },
  storagePath: "/extensions/legacy_extension",
  host,
};

// The compatibility field is intentionally optional for legacy manifests.
const legacyManifest: SpindleManifest = {
  version: "1.0.0",
  name: "Legacy extension",
  identifier: "legacy_extension",
  author: "Extension author",
  github: "https://github.com/example/legacy-extension",
  homepage: "https://example.com/legacy-extension",
  permissions: [],
};
// @ts-expect-error host descriptor is required on the public init message
const legacyInitWithoutHost: HostToWorker = {
  type: "init",
  manifest: legacyManifest,
  storagePath: "/extensions/legacy_extension",
};
void locale;
void result;
void legacyManifest;

declare const spindle: SpindleAPI;

// Tool invocation identity is trusted host transport context, not model/tool payload data.
const toolInvocationMessage: HostToWorker = {
  type: "tool_invocation",
  requestId: "tool-request-id",
  toolName: "example_tool",
  args: { userId: "model-controlled-spoof", value: 1 },
  userId: "authenticated-user",
};
spindle.on("TOOL_INVOCATION", async (payload, userId) => {
  const authenticatedUser: string | undefined = userId;
  const toolName: string = payload.toolName;
  // @ts-expect-error authenticated user context must never be merged into the tool payload
  payload.userId;
  void authenticatedUser;
  return toolName;
});
void toolInvocationMessage;

const versionedRegex = spindle.regex_scripts.create({
  name: "Versioned extension regex",
  find_regex: "example",
  folder: "Extension scripts",
  folder_version: "2.4.0",
});
versionedRegex.then((script) => {
  const folderVersion: string | null | undefined = script.folder_version;
  void folderVersion;
});
const backendHost: SpindleHostDescriptorV1 = spindle.host;
// @ts-expect-error the host descriptor is exposed as a readonly API property
spindle.host = host;
// @ts-expect-error nested capability records are readonly
spindle.host.capabilities["interceptor-final-response-v1"] = 2;
// @ts-expect-error descriptor scalar fields are readonly
spindle.host.lumiverseVersion = "2.0.0";
void backendHost;
const editorRequestId = "550e8400-e29b-41d4-a716-446655440001";
const editorResult = spindle.textEditor.open({ editorRequestId, value: "Review me" });
const editorClose = spindle.textEditor.close(editorRequestId);
const editorOpenMessage: WorkerToHost = {
  type: "text_editor_open",
  requestId: "transport-open",
  editorRequestId,
  value: "Review me",
};
const editorCloseMessage: WorkerToHost = {
  type: "text_editor_close",
  requestId: "transport-close",
  editorRequestId,
};
const skippedThumbnailUpload = spindle.images.upload({
  data: new Uint8Array([1, 2, 3]),
  filename: "card.avif",
  mime_type: "image/avif",
  skip_thumbnail_processing: true,
});
const skippedThumbnailDataUrlUpload = spindle.images.uploadFromDataUrl(
  "data:image/avif;base64,AQID",
  { skip_thumbnail_processing: true },
);
const skippedThumbnailDataUrlMessage: WorkerToHost = {
  type: "images_upload_from_data_url",
  requestId: "transport-image-upload",
  dataUrl: "data:image/avif;base64,AQID",
  skip_thumbnail_processing: true,
};
void editorResult;
void editorClose;
void editorOpenMessage;
void editorCloseMessage;
void skippedThumbnailUpload;
void skippedThumbnailDataUrlUpload;
void skippedThumbnailDataUrlMessage;

declare const ctx: SpindleFrontendContext;
const frontendHost: SpindleHostDescriptorV1 = ctx.host;
const activeLocale: SpindleHostLocale = ctx.locale.get();
const tabLocation: SpindleTabLocation = ctx.ui.getTabLocation("profile");
const unsubscribe = ctx.locale.subscribe((nextLocale) => {
  const checked: SpindleHostLocale = nextLocale;
  void checked;
});
// @ts-expect-error the frontend host descriptor is exposed as a readonly API property
ctx.host = host;
// @ts-expect-error the frontend locale API is exposed as a readonly API property
ctx.locale = localeApi;
void frontendHost;
void activeLocale;
void unsubscribe;
void tabLocation;
const compatibilityCode: "SPINDLE_COMPATIBILITY_ERROR" = SPINDLE_COMPATIBILITY_ERROR_CODE;
void compatibilityCode;

const asyncFrontendModule = {
  async setup(_ctx: SpindleFrontendContext) {
    return async () => undefined;
  },
  async teardown() {},
};
const typedAsyncFrontendModule: import("lumiverse-spindle-types").SpindleFrontendModule = asyncFrontendModule;
void typedAsyncFrontendModule;

const widgetFrontendModule: import("lumiverse-spindle-types").SpindleWidgetFrontendModule = {
  setupWidget(_ctx, target) {
    const index: number = target.index;
    const chromeless: boolean = target.chromeless;
    void index;
    void chromeless;
  },
};
void widgetFrontendModule;

spindle.registerMacroInterceptor(async (ctx) => {
  if (ctx.sourceOwner?.extensionIdentifier === 'owned-template') return { text: ctx.template, touchedVars: [] };
}, 100, { handlesOwnedSources: true });
const ownedMacroRegistration: WorkerToHost = { type: 'register_macro_interceptor', handlesOwnedSources: true };
void ownedMacroRegistration;

const formattingResolver: import('lumiverse-spindle-types').SpindleDisplayResolver = {
  skipFormattingHealing: true,
  ready: () => true,
  resolveBody: async () => null,
  resolveTemplates: async () => null,
  applyScripts: async () => null,
};
const formattingOptOut: boolean | undefined = formattingResolver.skipFormattingHealing;
void formattingOptOut;
