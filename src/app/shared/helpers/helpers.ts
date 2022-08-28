import { Contract, Signer, utils } from "ethers";
import { abi_ERC20 } from "./abis/erc20";


export const displayAdress= (address: string): string => {
    return (
      address.slice(0, 5) +
      '...' +
      address.slice(address.length - 5, address.length)
    );
  }

  export const isAddress = (address: string) => {
    try {
      utils.getAddress(address);
    } catch (e) {
      return false;
    }
    return true;
  };

  export const createERC20Instance = (ERC: string, signer: Signer): Contract => {
    return new Contract(ERC, abi_ERC20, signer);
  };
  