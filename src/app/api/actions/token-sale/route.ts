import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, createPostResponse } from "@solana/actions";
import { ComputeBudgetProgram, PublicKey, SystemProgram, Transaction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { DEFAULT_BUY_AMOUNT, DEFAULT_METHOD, LIMIT_PER_WALLET, PROGRAM_ID, WL_REQUIREMENT, connection } from "./const";
import { TokenSale, IDL } from "./idl";
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
      description: "First, claim a WL Token. Then, buy as many tokens as you want (with a limit of 100 tokens per wallet). Token price : 0.01 SOL.",
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

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const program = new Program<TokenSale>(IDL, PROGRAM_ID, {
      connection,
    });

    const [WL_TOKEN_MINT] = PublicKey.findProgramAddressSync(
      [Buffer.from("wl_mint")],
      PROGRAM_ID
    );
    const [TOKEN_MINT] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale_mint")],
      PROGRAM_ID
    );

    const wlAccount = await getAssociatedTokenAddress(
      WL_TOKEN_MINT,
      account
    );

    let message: string = '';

    // add priority fees
    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      }),
    );


    // claim WL token case
    if (method == "claim") {

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

      transaction.add(instruction);
      message = '🎉 WL Token claimed! Refresh the page to buy tokens.'
    }

    // buy tokens case
    if (method == "buy") {

      // ensure the user has enough WL token
      const wlAccountInfo = await connection.getParsedAccountInfo(wlAccount, "confirmed");
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

      // check if the limit tracker is initialzed. Initialize it otherwise.
      const trackerInfo = await connection.getAccountInfo(tracker);
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
      else {
        // ensure the user didn't reach the buy limit
        const count = (await program.account.trackerAccount.fetch(tracker))?.count.toNumber();
        if (count >= LIMIT_PER_WALLET) {
          const message = "Buy limit reached! You can't buy more tokens.";
          return new Response(message, {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
          });
        }
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
      transaction.add(buyInstruction)

      // get the initial token balance to display how many tokens the user can still buy
      let initialBalance: number;
      try {
        const balance = (await connection.getTokenAccountBalance(destination));
        initialBalance = balance.value.uiAmount!;
      } catch {
        // Token account not yet initiated has 0 balance
        initialBalance = 0;
      }
      message = `🎉 Tokens bought! `
      if (LIMIT_PER_WALLET - initialBalance - amount > 0) {
        message = message + `You can buy ${LIMIT_PER_WALLET - initialBalance - amount} more tokens if you wish.`;
      }
    }

    // set the end user as the fee payer
    transaction.feePayer = account;

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    // estimate the compute units consumed to request optimal compute
    const units = (await connection.simulateTransaction(transaction)).value.unitsConsumed!;
    console.log("CU consummed", units)
    transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: units * 1.1 }))

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