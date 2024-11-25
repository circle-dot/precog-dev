import Link from "next/link";
import {useAccount} from "wagmi";
import {getBlockExplorerTxLink} from "~~/utils/scaffold-eth";

export const TransactionHash = ({hash}: { hash: string }) => {
    const { chain } = useAccount();
    const chainId = chain? chain.id : 1;
    const blockExplorerTxURL = getBlockExplorerTxLink(chainId, hash);
    return (
        <div className="flex items-center">
            <span>[</span>
            <Link target="_blank" href={blockExplorerTxURL}>
                {"tx: "}{hash?.substring(0, 6)}...{hash?.substring(hash.length - 4)}
            </Link>
            <span>]</span>
        </div>
    );
};
