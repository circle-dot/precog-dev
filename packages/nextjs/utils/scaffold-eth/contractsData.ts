import scaffoldConfig from "~~/scaffold.config";
import { contracts } from "~~/utils/scaffold-eth/contract";

export function getAllContracts() {
  let contractsData = contracts?.[scaffoldConfig.targetNetworks[0].id];
  return contractsData ? contractsData : {};
}

export function getLatestContracts() {
    const latestContracts = ["PrecogToken", "PrecogMasterV7", "PrecogMarketV7"];
    let contractsData = contracts?.[scaffoldConfig.targetNetworks[0].id];
    contractsData = contractsData ? filterProperties(contractsData, latestContracts): {};
    return contractsData;
}

function filterProperties(obj: any, keysToFilter: string[]): {} {
  return Object.keys(obj)
    .filter(key => keysToFilter.includes(key))
    .reduce((acc: any, key: string) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}