import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, MEMO_PROGRAM_ID, createPostResponse } from "@solana/actions";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import idl from "./idl.json";
import { DEFAULT_BUY_AMOUNT, DEFAULT_METHOD, LIMIT_PER_WALLET, PROGRAM_ID, TOKEN_MINT, WL_TOKEN_MINT, WL_REQUIREMENT } from "./const";
import { TokenSale, IDL } from "./type";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const baseHref = new URL(
      `/api/actions/token-sale`,
      requestUrl.origin,
    ).toString();

    const payload: ActionGetResponse = {
      title: "Whitelist-gated Token Sale",
      icon: new URL("/talent-olympics.jpg", new URL(req.url).origin).toString(),
      description: "First, claim a WL Token. Then, buy as many tokens as you want (with a limit of 100 tokens per wallet). Token's price : 0.01 SOL.",
      label: "Claim",
      links: {
        actions: [
          {
            label: "Claim WL Token",
            href: `${baseHref}?method=${"claim"}`,
          },
          {
            label: "Buy Tokens",
            href: `${baseHref}?method=${"buy"}&amount={amount}`,
            parameters: [
              {
                name: "amount",
                label: "Enter the amount of tokens you want to buy",
                required: true,
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { amount, method } = validatedQueryParams(requestUrl);
    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const connection = new Connection(
      "https://devnet.helius-rpc.com/?api-key=194196fa-41b1-48f1-82dc-9b4d6ba2bb6c",
    );

    const program = new Program<TokenSale>(IDL, PROGRAM_ID, {
      connection,
    });

    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      }),
    );

    const wlAccount = await getAssociatedTokenAddress(
      WL_TOKEN_MINT,
      account
    );

    let message: string = '';
    if (method == "claim") {

      let units: number;
      const wlAccountInfo = await connection.getAccountInfo(wlAccount);
      if (wlAccountInfo) {
        units = 22000;
      }
      else {
        units = 51000;
      }

      const instruction = await program.methods
        .requestWl()
        .accounts({
          mint: WL_TOKEN_MINT,
          payer: account,
          destination: wlAccount,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        .instruction();

      transaction.add(
        instruction,
        ComputeBudgetProgram.setComputeUnitLimit({
          units: units
        }));
      message = '🎉 WL Token claimed! Refresh the page to buy tokens.'
    }

    if (method == "buy") {

      const wlAccountInfo = await connection.getParsedAccountInfo(wlAccount);
      // @ts-ignore
      if (wlAccountInfo.value?.data.parsed.info.tokenAmount.uiAmount < WL_REQUIREMENT || wlAccountInfo.value?.data.parsed.info.tokenAmount.uiAmount == undefined) {
        const message = 'Whitelist requirement not satisfied. Please, claim a WL token and try again!';
        return new Response(message, {
          status: 400,
          headers: ACTIONS_CORS_HEADERS,
        });
      }


      const [tracker] = PublicKey.findProgramAddressSync(
        [Buffer.from("tracker"), account.toBuffer()],
        PROGRAM_ID
      );

      const trackerInfo = await connection.getAccountInfo(tracker);
      let units: number;

      if (trackerInfo) {
        units = 40000;
      }
      else {
        units = 85000;
      }

      if (trackerInfo == null) {
        const initTrackerInstruction = await program.methods
          .initializeLimitTracker()
          .accounts({
            tracker: tracker,
            payer: account,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        transaction.add(initTrackerInstruction)
      }

      const destination = await getAssociatedTokenAddress(
        TOKEN_MINT,
        account
      );

      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        PROGRAM_ID
      );

      // @ts-ignore
      const decimals = (await connection.getParsedAccountInfo(TOKEN_MINT))?.value?.data.parsed.info.decimals;
      const buyInstruction = await program.methods
        .buyTokens(new BN(amount * 10 ** decimals))
        .accounts({
          wlMint: WL_TOKEN_MINT,
          wlAccount: wlAccount,
          saleMint: TOKEN_MINT,
          destination: destination,
          vault: vault,
          tracker: tracker,
          payer: account,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        }).instruction();
      transaction.add(
        buyInstruction,
        ComputeBudgetProgram.setComputeUnitLimit({
          units: units
        }));
      let initialBalance: number;
      try {
        const balance = (await connection.getTokenAccountBalance(destination));
        initialBalance = balance.value.uiAmount!;
      } catch {
        // Token account not yet initiated has 0 balance
        initialBalance = 0;
      }
      message = `🎉 Tokens bought! You can buy ${LIMIT_PER_WALLET - initialBalance - amount} more tokens if you wish.`
    }

    transaction.feePayer = account;

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: message,
      },
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};

function validatedQueryParams(requestUrl: URL) {
  let method: string = DEFAULT_METHOD;
  let amount: number = DEFAULT_BUY_AMOUNT;

  try {
    if (requestUrl.searchParams.get("method")) {
      method = requestUrl.searchParams.get("method")!;
    }
  } catch (err) {
    throw "Invalid input query parameter: method";
  }

  try {
    if (requestUrl.searchParams.get("amount")) {
      amount = parseFloat(requestUrl.searchParams.get("amount")!);
    }

    if (amount <= 0) throw "amount is too small";
  } catch (err) {
    throw "Invalid input query parameter: amount";
  }

  return {
    amount,
    method,
  };
}