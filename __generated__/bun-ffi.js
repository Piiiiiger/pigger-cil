function unsupported() {
  throw new Error('bun:ffi is not available in the npm rebuild. This code path requires Bun-specific FFI support.');
}

export const dlopen = unsupported;
export const suffix = process.platform === 'win32' ? '.dll' : process.platform === 'darwin' ? '.dylib' : '.so';
export default { dlopen, suffix };
