import { Connection, PublicKey } from "@solana/web3.js";

export const connection = new Connection(
    "https://devnet.helius-rpc.com/?api-key=194196fa-41b1-48f1-82dc-9b4d6ba2bb6c",
  );
export const DEFAULT_BUY_AMOUNT: number = 1;
export const DEFAULT_METHOD: string = "claim";
export const WL_REQUIREMENT: number = 1;
export const LIMIT_PER_WALLET: number = 100;
export const WL_TOKEN_MINT: PublicKey = new PublicKey("4YcmyJboWCyZoBn7jXF48JC1ew2XhGSo6qUxQj41wcad");
export const TOKEN_MINT: PublicKey = new PublicKey("xtwukH2w4HYq8z7fqraYTTw7zLEvNjGDZSr76z47jHb");
export const PROGRAM_ID: PublicKey = new PublicKey("8fsRhyPijV43vvTS36CREHBKixE71nt3gige522Ay7Rv");