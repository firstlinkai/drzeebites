import config from '@payload-config'
import { getPayload as getPayloadInstance, type Payload } from 'payload'

/**
 * Cached Payload local-API client for use in server components, route
 * handlers, and server actions. `getPayload` already memoizes per config, so
 * this is cheap to call anywhere on the server.
 */
export const getPayload = (): Promise<Payload> => getPayloadInstance({ config })
