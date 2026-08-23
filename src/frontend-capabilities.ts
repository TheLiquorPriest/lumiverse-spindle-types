/**
 * Backend-declared capabilities that require the host to coordinate frontend
 * extension startup before rendering dependent UI.
 */
export const ALL_FRONTEND_RUNTIME_CAPABILITIES = [
  "message_tag_interceptor",
] as const;

export type SpindleFrontendRuntimeCapability =
  (typeof ALL_FRONTEND_RUNTIME_CAPABILITIES)[number];

export function isValidFrontendRuntimeCapability(
  capability: string,
): capability is SpindleFrontendRuntimeCapability {
  return (ALL_FRONTEND_RUNTIME_CAPABILITIES as readonly string[]).includes(capability);
}
