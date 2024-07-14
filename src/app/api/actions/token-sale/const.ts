import { Connection, PublicKey } from "@solana/web3.js";

export const PROGRAM_ID: PublicKey = new PublicKey("48Gpisd6FPdZ8C71pCugbYC1ovhgfhtAPo4u5qcgi1C2");
export const WL_REQUIREMENT: number = 1;
export const LIMIT_PER_WALLET: number = 100;

export const connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=194196fa-41b1-48f1-82dc-9b4d6ba2bb6c",
);

export const DEFAULT_BUY_AMOUNT: number = 1;
export const DEFAULT_METHOD: string = "claim";
