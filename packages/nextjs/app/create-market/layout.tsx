import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Create Market",
  description: "Create Precog Market",
});

const MarketLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default MarketLayout;
