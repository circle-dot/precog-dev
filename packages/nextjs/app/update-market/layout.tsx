import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Update Market",
  description: "Update Precog Market",
});

const MarketLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default MarketLayout;
