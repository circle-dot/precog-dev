import {Metadata, Viewport} from "next";
import {ScaffoldEthAppWithProviders} from "~~/components/ScaffoldEthAppWithProviders";
import {ThemeProvider} from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import React from "react";

const localUrl = `http://localhost:${process.env.PORT || 3000}`;
const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : localUrl;
const imageUrl = `${baseUrl}/precogShare.png`;

const title = "Precog Core";
const titleTemplate = "%s | Precog";
const description = "Prediction markets platform";

export const viewport: Viewport = {
    initialScale: 1,
    minimumScale: 1,
    width: "device-width",
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#FFFFFF"
}

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        default: title,
        template: titleTemplate,
    },
    description: description,
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: title,
        // startUpImage: [],
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        title: {
            default: title,
            template: titleTemplate,
        },
        description,
        images: [
            {
                url: imageUrl,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        images: [imageUrl],
        title: {
            default: title,
            template: titleTemplate,
        },
        description,
    },
    icons: {
        icon: [{url: "/precogLogo.png", sizes: "32x32", type: "image/png"}],
    }
};

const ScaffoldEthApp = ({children}: { children: React.ReactNode }) => {
    return (
        <html suppressHydrationWarning>
        <body>
        <ThemeProvider enableSystem>
            <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
        </body>
        </html>
    );
};

export default ScaffoldEthApp;