// Icon: ic:baseline-get-app
// Slug: Use a GET request to fetch data from a server using Server-Sent Events matching the Nexus-UX SDK interface
// Description: Remember, SSE is just a regular SSE request but with the ability to send 0-inf messages to the client.

import { fetcher, FetchArgs } from './fetch'
import type { RuntimeContext } from '../../../../engine/types'

export type SSEArgs = FetchArgs

export const sse = async (
  ctx: RuntimeContext,
  method: string,
  url: string,
  args: SSEArgs,
) => {
  return fetcher(ctx, method, url, args)
}