import {TransactionReceipt} from "viem";
import {displayTxResult} from "~~/app/debug/_components/contract";

export const TxReceipt = (
    txResult: string | number | bigint | Record<string, any> | TransactionReceipt | undefined,
) => {
    return (
        <div className="flex text-sm rounded-3xl peer-checked:rounded-b-none min-h-0 bg-secondary py-0">
            <div className="flex-wrap collapse collapse-arrow">
                <input type="checkbox" className="min-h-0 peer"/>
                <div className="collapse-title text-sm min-h-0 py-1.5 pl-1">
                    <strong>Transaction Receipt</strong>
                </div>
                <div className="collapse-content overflow-auto bg-secondary rounded-t-none rounded-3xl">
                    <pre className="text-xs pt-4">{displayTxResult(txResult)}</pre>
                </div>
            </div>
        </div>
    );
};
