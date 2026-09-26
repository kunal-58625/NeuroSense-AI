import nextPwa from "next-pwa";

/** @type {import('next').NextConfig} */
const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const isGithubActor = process.env.NEXT_PUBLIC_GITHUB_ACTOR === "upsidedownlabs" || process.env.NEXT_PUBLIC_GITHUB_ACTOR === undefined

const config = {
  reactStrictMode: true,
  // output: "export", // Disabled to allow API routes and backend processing
  basePath: isGithubActor ? "" : "/Chords-Web",
  assetPrefix: isGithubActor ? "" : "/Chords-Web",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  ...withPWA,
};

export default config;