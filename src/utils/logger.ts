export const debug = console.debug
export const log = console.log
export const info = console.info
export const warn = console.warn
export const error = console.error
export const todo = (...args: unknown[]) => console.warn('[TODO]', ...args)
