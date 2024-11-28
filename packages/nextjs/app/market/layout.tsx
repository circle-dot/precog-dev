"use client";
import {Suspense} from 'react'
import {Header} from "~~/components/Header";
import {Footer} from "~~/components/Footer";

const MarketLayout = ({children}: { children: React.ReactNode }) => {
    return <>
        <Header />
        <Suspense>
            {children}
        </Suspense>
        <Footer />
    </>;
};

export default MarketLayout;
