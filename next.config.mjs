import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deployment target is Vercel — no standalone output, no Docker.
}

export default withPayload(nextConfig)
