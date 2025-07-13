"use client";

import type { NextPage } from "next";
import { useAccount, useWriteContract } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useTransactor } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useEffect, useState } from "react";
import { displayTxResult } from "~~/app/debug/_components/contract";
import { AddressInput } from "~~/components/scaffold-eth";

const CreateMarket: NextPage = () => {
    const { address: connectedAddress } = useAccount();
    const { data: createdMarkets } = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "createdMarkets"
    });
    const { data: master, isLoading: isMasterLoading } = useScaffoldContract(
        { contractName: "PrecogMasterV7" }
    );

    const {writeContractAsync, isPending} = useWriteContract();
    const writeTx = useTransactor();
    const defaultCreator = "0x0000000000000000000000000000000000000000";
    const defaultCollateral = "0x7779ec685Aa0bf5483B3e0c15dAf246d2d978888";

    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [category, setCategory] = useState<string>("");
    const [startDate, setStartDate] = useState<string>();
    const [startTime, setStartTime] = useState<string>();
    const [endDate, setEndDate] = useState<string>();
    const [endTime, setEndTime] = useState<string>();
    const [creator, setCreator] = useState<string>(connectedAddress || defaultCreator);
    const [collateral, setCollateral] = useState<string>(defaultCollateral || defaultCollateral);
    const [outcomes, setOutcomes] = useState<string>("YES,NO");
    const [funding, setFunding] = useState<number>(2000);
    let startTimestamp = 0;
    let endTimestamp = 0;
    let possibleOutcomes = outcomes.split(",");

    // Fixed related parameters
    const overRound = possibleOutcomes.length * 100;

    // Only for debug
    // console.log('Selected Address:', connectedAddress);

    useEffect(() => {
        // Autofill start and end date inputs with today values
        if (!startDate && !endDate) {
            const today = new Date();
            let yyyy = today.getFullYear();
            let mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
            let dd = String(today.getDate()).padStart(2, "0");
            const hh = String(today.getHours()).padStart(2, "0");
            setStartDate(`${yyyy}-${mm}-${dd}`);
            setStartTime(`${hh}:00`);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            yyyy = tomorrow.getFullYear();
            mm = String(tomorrow.getMonth() + 1).padStart(2, "0"); // Months are zero-based
            dd = String(tomorrow.getDate()).padStart(2, "0");
            setEndDate(`${yyyy}-${mm}-${dd}`);
            setEndTime(`${hh}:00`);
        }
    }, [startDate, startTime, endDate, endTime]);

    if (!master || isMasterLoading) {
        return (
            <div className="flex flex-row justify-center items-center">
                <div className="flex flex-col gap-3 p-4 mt-3 bg-base-100 rounded-2xl w-1/4 min-w-[400px]">
                    <div className="text-xl font-bold">Create Market</div>
                    <span className="text-lg">Fetching data...</span>
                </div>
            </div>
        )
    }

    if (creator === defaultCreator && connectedAddress && connectedAddress !== defaultCreator) {
        setCreator(connectedAddress);
    }

    const writeContractAsyncWithParams = () => {
        // Check if we need to create a custom market (need pre-approve of collateral)
        if (collateral === defaultCollateral) {
            return writeContractAsync({
                address: master.address, abi: master.abi, functionName: "createMarket",
                args: [
                    name,
                    description,
                    category,
                    possibleOutcomes,
                    BigInt(startTimestamp),
                    BigInt(endTimestamp),
                    creator as `0x${string}`,
                    BigInt(funding * 10 ** 18),
                    BigInt(overRound)
                ]
            });
        } else {
            return writeContractAsync({
                address: master.address, abi: master.abi, functionName: "createCustomMarket",
                args: [
                    name,
                    description,
                    category,
                    possibleOutcomes,
                    BigInt(startTimestamp),
                    BigInt(endTimestamp),
                    creator as `0x${string}`,
                    BigInt(funding * 10 ** 18),
                    BigInt(overRound),
                    collateral as `0x${string}`,  //collateralToken
                    creator as `0x${string}`,  // collateralFunder
                    creator as `0x${string}`  // marketOracle
                ],
            });
        }
    }

    const handleWriteAction = async () => {
        try {
            // Parse and calculate start & end timestamps
            if (startDate && startTime) {
                const [year, month, day] = startDate.split("-").map(Number);
                const [hours, minutes] = startTime.split(":").map(Number);
                const newStartDate = new Date(Date.UTC(year, (month - 1), day, hours, minutes));
                startTimestamp = Math.round(newStartDate.getTime() / 1000);
                // Only for debug
                // console.log("New start date:", newStartDate, startTimestamp, startDate, startTime);
            }
            if (endDate && endTime) {
                const [year, month, day] = endDate.split("-").map(Number);
                const [hours, minutes] = endTime.split(":").map(Number);
                const newEndDate = new Date(Date.UTC(year, (month - 1), day, hours, minutes));
                endTimestamp = Math.round(newEndDate.getTime() / 1000);
                // Only for debug
                // console.log("New end date:", newEndDate, endTimestamp, endDate, endTime);
            }
            if (outcomes) {
                possibleOutcomes = outcomes.split(",").map(value => value.trim());
            }

            console.log(`Creating new ${collateral !== defaultCollateral ? "custom" : ""} market...`);
            console.log("> Name:", name, ", Description:", description, ", Category:", category);
            console.log("> Outcomes:", possibleOutcomes);
            console.log("> StartTimestamp:", startTimestamp, ", EndTimestamp:", endTimestamp);
            console.log("> Collateral:", collateral);
            console.log("> Creator:", creator);
            console.log("> Funding:", BigInt(funding * 10 ** 18).toString(), "OverRound:", overRound);

            // Validate market parameters (could be improved a lot!)
            if (name && description && category && possibleOutcomes.length >= 2 &&
                startTimestamp && endTimestamp && endTimestamp > startTimestamp) {
                await writeTx(writeContractAsyncWithParams, { blockConfirmations: 1 });

                console.log("New market created!");

                // Reset all parameters to default values
                setName("");
                setDescription("");
                setCategory("");
                setStartDate("");
                setStartTime("");
                setEndDate("");
                setEndTime("");
                setCreator(connectedAddress || "");
                setOutcomes("YES,NO");
                setFunding(2000);
            } else {
                notification.error("Invalid/empty market parameters");
            }
        } catch (e) {
            console.log("Unexpected error in writeTx", e);
        }
    };

    return (
        <>
            <div className="flex flex-row justify-center items-center">
                <div className="flex flex-col gap-2 p-4 mt-3 bg-base-100 rounded-2xl w-1/4 min-w-[400px] overflow-auto">
                    <div className="flex flex-row justify-between items-end px-2">
                        <div className="text-2xl font-bold">Create Market</div>
                        <div className="flex flex-row items-center gap-1">
                            <span className="text-sm">[ Market Id:</span>
                            <span className="text-md font-bold">{displayTxResult(createdMarkets)}</span>
                            <span className="text-sm">]</span>
                        </div>
                    </div>
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
                        <span
                            className="text-xs italic pl-3">Note: when share trading stops (waiting for result).</span>
                    </div>
                    <div className="flex flex-col items-start px-2">
                        <span className="text-sm font-bold">Creator</span>
                        <div className="w-full py-1">
                            <AddressInput value={creator} onChange={setCreator} />
                        </div>
                        <span className="text-xs italic pl-3">Note: External or internal Market creator wallet.</span>
                    </div>
                    <div className="flex flex-col items-start px-2">
                        <span className="text-sm font-bold">Collateral Token</span>
                        <div className="w-full py-1">
                            <AddressInput value={collateral} onChange={setCollateral} />
                        </div>
                        <span className="text-xs italic pl-3">Note: Address of ERC20 Token</span>
                    </div>
                    <div className="flex flex-col items-start px-2">
                        <span className="text-sm font-bold">Funding Collateral (amount)</span>
                        <input type="number" min="2" value={funding}
                            onChange={e => setFunding(Number(e.target.value))}
                            className="input border border-primary rounded-xl w-full"
                        />
                        <span className="text-xs italic pl-3">Note: Tokens to mint or TransferFrom creator (need approve)</span>
                    </div>
                    <div className="flex flex-col items-center p-3 w-full">
                        <button className="btn btn-primary rounded-xl" onClick={handleWriteAction} disabled={isPending}>
                            {isPending ? <span className="loading loading-spinner loading-sm"></span> : "Create Market"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateMarket;
