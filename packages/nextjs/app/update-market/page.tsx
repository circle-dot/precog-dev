"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useTransactor } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { AddressInput } from "~~/components/scaffold-eth";
import { ArrowRightIcon } from "@heroicons/react/24/outline";


const UpdateMarket: NextPage = () => {
    const { address: connectedAddress } = useAccount();
    const { data: master, isLoading: isMasterLoading } = useScaffoldContract({ contractName: "PrecogMasterV7" });
    const { data: marketContract } = useScaffoldContract({ contractName: "PrecogMarketV7" });

    const { writeContractAsync, isPending } = useWriteContract();
    const writeTx = useTransactor();
    const defaultCreator = "0x0000000000000000000000000000000000000000";
    const defaultOracle = "0x9475A4C1BF5Fc80aE079303f14B523da19619c16";


    // Market id input and loading states
    const [inputMarketId, setInputMarketId] = useState<string>("");
    const [isValidId, setIsValidId] = useState<boolean>(true);
    const [marketId, setMarketId] = useState<string>("");
    const [isLoadingMarket, setIsLoadingMarket] = useState(false);
    const [marketAddress, setMarketAddress] = useState<string>("");

    // Form states
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [category, setCategory] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [creator, setCreator] = useState<string>(connectedAddress || defaultCreator);
    const [oracle, setOracle] = useState<string>(connectedAddress || defaultOracle);
    const [outcomes, setOutcomes] = useState<string>("YES,NO");

    // State to track the original chain data of the market
    const [originalMarketData, setOriginalMarketData] = useState<any>(null);

    // Fetch market data by ID with watch disabled
    const {
        data: marketData,
        isLoading: isMarketDataLoading,
        isFetching: isMarketDataFetching,
        refetch: refetchMarketData,
    } = useScaffoldReadContract({
        contractName: "PrecogMasterV7",
        functionName: "markets",
        args: [BigInt(marketId)],
        query: { enabled: !!marketId },
        watch: false  // Disable automatic refetching
    });
    // If we have market data and contract ABI, fetch additional data
    const ABI = marketContract ? marketContract.abi : [];

    // Fetch oracle from market contract
    const { data: marketOracle } = useReadContract({
        abi: ABI,
        address: marketAddress as `0x${string}`,
        functionName: 'oracle',
        query: { enabled: !!marketAddress }
    });

    // Effect to update the start and end date and time
    useEffect(() => {
        if (marketData) {
            const startTimestamp = Number(marketData[4]);
            const endTimestamp = Number(marketData[5]);

            if (startTimestamp) {
                const startDateUTC = new Date(startTimestamp * 1000);
                const yyyy = startDateUTC.getUTCFullYear();
                const mm = String(startDateUTC.getUTCMonth() + 1).padStart(2, "0");
                const dd = String(startDateUTC.getUTCDate()).padStart(2, "0");
                const hh = String(startDateUTC.getUTCHours()).padStart(2, "0");
                const min = String(startDateUTC.getUTCMinutes()).padStart(2, "0");
                setStartDate(`${yyyy}-${mm}-${dd}`);
                setStartTime(`${hh}:${min}`);
            } else if (!isMarketDataFetching) {
                setStartDate("");
                setStartTime("");
            }

            if (endTimestamp) {
                const endDateUTC = new Date(endTimestamp * 1000);
                const yyyy = endDateUTC.getUTCFullYear();
                const mm = String(endDateUTC.getUTCMonth() + 1).padStart(2, "0");
                const dd = String(endDateUTC.getUTCDate()).padStart(2, "0");
                const hh = String(endDateUTC.getUTCHours()).padStart(2, "0");
                const min = String(endDateUTC.getUTCMinutes()).padStart(2, "0");
                setEndDate(`${yyyy}-${mm}-${dd}`);
                setEndTime(`${hh}:${min}`);
            } else if (!isMarketDataFetching) {
                setEndDate("");
                setEndTime("");
            }
        }
    }, [marketData, isMarketDataFetching]);

    // Effect to update oracle when it's fetched
    useEffect(() => {
        if (marketOracle) {
            setOracle(marketOracle);
        }
    }, [marketOracle]);

    // Handle loading market data
    const handleLoadMarket = async () => {
        if (!inputMarketId) {
            notification.error("Please enter a market ID");
            return;
        }

        if (marketId === inputMarketId) {
            refetchMarketData();
            notification.info("Market data refetched");
        } else {
            setMarketId(inputMarketId);
        }
    };

    // Handle market id input change
    const handleMarketIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputMarketId(value);
        setIsValidId(validateMarketId(value));
    };

    // Effect to update form when market data is fetched
    useEffect(() => {
        const isLoading = isMarketDataLoading || isMarketDataFetching;
        setIsLoadingMarket(isLoading);

        if (!isLoading && marketData) {
            const marketAddress = marketData[7];
            if (marketAddress && marketAddress !== "0x0000000000000000000000000000000000000000") {
                const startTs = Number(marketData[4]);
                const endTs = Number(marketData[5]);

                // Store chain data
                setOriginalMarketData({
                    name: marketData[0] || "",
                    description: marketData[1] || "",
                    category: marketData[2] || "",
                    outcomes: marketData[3] || "YES,NO",
                    startTimestamp: startTs,
                    endTimestamp: endTs,
                    creator: marketData[6] || connectedAddress || defaultCreator,
                    marketAddress: marketData[7] || "",
                });

                setName(marketData[0] || "");
                setDescription(marketData[1] || "");
                setCategory(marketData[2] || "");
                setOutcomes(marketData[3] || "YES,NO");
                setCreator(marketData[6] || connectedAddress || defaultCreator);
                setMarketAddress(marketData[7] || "");
            } else if (marketId) {
                // If market ID is provided but no market address is found, show error
                notification.error("Market not found");
                // Clear the form and original data if market is not found
                setOriginalMarketData(null);
                setMarketId("");
                setName("");
                setDescription("");
                setCategory("");
                setOutcomes("YES,NO");
                setStartDate("");
                setStartTime("");
                setEndDate("");
                setEndTime("");
                setCreator(connectedAddress || defaultCreator);
                setOracle(connectedAddress || defaultOracle);
                setMarketAddress("");
            }
        }
    }, [marketData, isMarketDataLoading, isMarketDataFetching, connectedAddress, marketId, defaultCreator, defaultOracle]);

    if (!master || isMasterLoading) {
        return (
            <div className="flex flex-row justify-center items-center">
                <div className="flex flex-col gap-3 p-4 mt-3 bg-base-100 rounded-2xl w-1/4 min-w-[400px]">
                    <div className="text-xl font-bold">Update Market</div>
                    <span className="text-lg">Fetching data...</span>
                </div>
            </div>
        )
    }

    const handleWriteAction = async () => {
        if (!master) {
            notification.error("Contract not loaded");
            return;
        }
        try {
            const startTimestamp = calculateTimestamp(startDate, startTime);
            const endTimestamp = calculateTimestamp(endDate, endTime);
            const currentOutcomes = outcomes.split(",").map(value => value.trim());

            // Log all submission data
            console.log(`Updating market ${marketId}...`);
            console.log("> Name:", name);
            console.log("> Description:", description);
            console.log("> Category:", category);
            console.log("> Outcomes:", currentOutcomes);
            console.log("> Start:", new Date(startTimestamp * 1000).toUTCString(), `(${startTimestamp})`);
            console.log("> End:", new Date(endTimestamp * 1000).toUTCString(), `(${endTimestamp})`);
            console.log("> Creator:", creator);
            console.log("> Oracle:", oracle);

            const changes = {
                name: name !== originalMarketData.name ? {
                    from: originalMarketData.name,
                    to: name
                } : null,
                description: description !== originalMarketData.description ? {
                    from: originalMarketData.description,
                    to: description
                } : null,
                category: category !== originalMarketData.category ? {
                    from: originalMarketData.category,
                    to: category
                } : null,
                outcomes: outcomes !== originalMarketData.outcomes ? {
                    from: originalMarketData.outcomes,
                    to: outcomes
                } : null,
                startTimestamp: Math.abs(startTimestamp - originalMarketData.startTimestamp) > 60 ? {
                    from: originalMarketData.startTimestamp,
                    to: startTimestamp
                } : null,
                endTimestamp: Math.abs(endTimestamp - originalMarketData.endTimestamp) > 60 ? {
                    from: originalMarketData.endTimestamp,
                    to: endTimestamp
                } : null,
                creator: creator !== originalMarketData.creator ? {
                    from: originalMarketData.creator,
                    to: creator
                } : null,
                oracle: oracle !== marketOracle ? {
                    from: marketOracle,
                    to: oracle
                } : null
            };

            // Filter out null changes
            const actualChanges = Object.fromEntries(
                Object.entries(changes).filter(([, value]) => value !== null)
            );

            // If there are changes, log them
            if (Object.keys(actualChanges).length > 0) {
                console.log("Changes detected:", actualChanges);
            } else {
                console.log("No changes detected");
                notification.warning("Attention - No changes detected");
            }

            // Validate market parameters
            if (marketId && name && description && category && currentOutcomes.length >= 2 &&
                startTimestamp && endTimestamp && endTimestamp > startTimestamp) {

                await writeTx(() => writeContractAsync({
                    address: master.address,
                    abi: master.abi,
                    functionName: "updateMarket",
                    args: [
                        BigInt(marketId),
                        name,
                        description,
                        category,
                        currentOutcomes,
                        BigInt(startTimestamp),
                        BigInt(endTimestamp),
                        creator as `0x${string}`,
                        oracle as `0x${string}`
                    ]
                }), { blockConfirmations: 1 });

                console.log("Market updated!");
            } else {
                notification.error("Invalid/empty market parameters");
            }
        } catch (e) {
            console.log("Unexpected error in writeTx", e);
            notification.error("Failed to update market");
        }
    };

    const isFormDisabled = !marketId || isLoadingMarket;

    return (
        <>
            <div className="flex flex-row justify-center items-center">
                <div className="flex flex-col gap-2 p-4 mt-3 bg-base-100 rounded-2xl w-1/4 min-w-[400px] overflow-auto">
                    <div className="flex flex-row justify-between items-end px-2">
                        <div className="text-2xl font-bold">Update Market</div>
                        <div className="flex flex-row items-center gap-1">
                            <span className="text-sm">[ Market Id:</span>
                            <input
                                type="text"
                                value={inputMarketId}
                                onChange={handleMarketIdChange}
                                onKeyDown={(e) => {
                                    // If the user presses enter, load the market if the market id is valid and not loading
                                    if (e.key === 'Enter' && inputMarketId && isValidId && !isLoadingMarket) {
                                        handleLoadMarket();
                                    }
                                }}
                                placeholder="#"
                                title={!isValidId && inputMarketId ? "Market ID must be a positive integer" : "Enter market ID"}
                                className={`input input-sm w-16 text-md font-bold px-1 h-6 border rounded-lg ${inputMarketId && !isValidId
                                        ? 'border-error text-error'
                                        : 'border-primary'
                                    }`}
                            />
                            <button
                                className="btn btn-xs btn-ghost px-1 hover:bg-primary/10"
                                onClick={handleLoadMarket}
                                disabled={!inputMarketId || !isValidId || isLoadingMarket}
                            >
                                {isLoadingMarket ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <ArrowRightIcon className="h-4 w-4" />
                                )}
                            </button>
                            <span className="text-sm">]</span>
                        </div>
                    </div>

                    <div className={`flex flex-col gap-2 transition-opacity duration-200 ${isFormDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">Name</span>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Will Argentina beat Colombia in the Copa America?"
                                className="input border border-primary rounded-xl w-full"
                            />
                            <span className="text-xs italic pl-3">Note: The first letter should be uppercase and should end with a question mark.</span>
                        </div>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">Description</span>
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Winner at match conclusion (regular, extra-time and penalty shoot-out)."
                                className="input border border-primary rounded-xl px-4 py-2 min-h-24 w-full"
                            />
                            <span className="text-xs italic pl-3">Note: should specify market resolve conditions.</span>
                        </div>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">Category</span>
                            <input type="text" placeholder="SPORTS" value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="input border border-primary rounded-xl w-full"
                            />
                            <span className="text-xs italic pl-3">Note: One word in plural tense.</span>
                        </div>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">Outcomes</span>
                            <input type="text" value={outcomes}
                                onChange={e => setOutcomes(e.target.value)}
                                className="input border border-primary rounded-xl w-full"
                            />
                            <span className="text-xs italic pl-3">Note: Possible outcomes CSV (eg: YES, NO, MAYBE).</span>
                        </div>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">Start Date (GMT)</span>
                            <div className="flex flex-row gap-4 w-full">
                                <input type="date" className="input border border-primary rounded-xl w-1/2"
                                    value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                />
                                <input type="time" className="input border border-primary rounded-xl w-1/2"
                                    value={startTime} onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <span className="text-xs italic pl-3">Note: when users can start buying shares.</span>
                        </div>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">End Date (GMT)</span>
                            <div className="flex flex-row gap-4 w-full">
                                <input type="date" className="input border border-primary rounded-xl w-1/2"
                                    value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                />
                                <input type="time" className="input border border-primary rounded-xl w-1/2"
                                    value={endTime} onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                            <span className="text-xs italic pl-3">Note: when share trading stops (waiting for result).</span>
                        </div>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">Creator</span>
                            <div className="w-full py-1">
                                <AddressInput value={creator} onChange={setCreator} disableAutofocus={true} />
                            </div>
                            <span className="text-xs italic pl-3">Note: External or internal Market creator wallet.</span>
                        </div>
                        <div className="flex flex-col items-start px-2">
                            <span className="text-sm font-bold">Oracle</span>
                            <div className="w-full py-1">
                                <AddressInput value={oracle} onChange={setOracle} disableAutofocus={true} />
                            </div>
                            <span className="text-xs italic pl-3">Note: Address that will report the market result.</span>
                        </div>
                        <div className="flex flex-col items-center p-3 w-full">
                            <button className="btn btn-primary rounded-xl" onClick={handleWriteAction} disabled={isPending || isFormDisabled}>
                                {isPending ? <span className="loading loading-spinner loading-sm"></span> : "Update Market"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UpdateMarket;

// Helper function to calculate timestamp from date and time
const calculateTimestamp = (date: string | undefined, time: string | undefined): number => {
    if (!date || !time) return 0;
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    // Create UTC date and get exact timestamp
    return Math.floor(Date.UTC(year, month - 1, day, hours, minutes) / 1000);
};

// Validates that the market ID is a positive integer without decimals
const validateMarketId = (value: string): boolean => {
    // Return false if empty string
    if (value === '') return false;
    const num = Number(value);
    return (
        Number.isInteger(num) &&  // Must be an integer
        num > 0 &&               // Must be positive
        !value.includes('.')     // Must not contain decimal point
    );
};