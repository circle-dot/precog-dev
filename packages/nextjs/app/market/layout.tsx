import {getMetadata} from "~~/utils/scaffold-eth/getMetadata";
import {Suspense} from 'react'

export const metadata = getMetadata({
    title: "Market",
    description: "Precog Market details",
});

const MarketLayout = ({children}: { children: React.ReactNode }) => {
    return <>
        <Suspense>
            {children}
        </Suspense>
    </>;
};

export default MarketLayout;
