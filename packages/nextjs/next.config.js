// @ts-check

/** @type {import('@ducanh2912/next-pwa').default} */
const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",

});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    typescript: {
        ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
    },
    eslint: {
        ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
    },
    webpack: config => {
        config.resolve.fallback = {fs: false, net: false, tls: false};
        config.externals.push("pino-pretty", "lokijs", "encoding");
        return config;
    },
};

module.exports = withPWA(nextConfig);
