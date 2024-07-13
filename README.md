# Whitelist-gated Token Sale
This repo allows you to create a Whitelist-gated Token Sale and allows your users to buy tokens thanks to a [Blink](https://solana.com/fr/docs/advanced/actions).

## Installation

Clone the repo and install the dependencies:

```bash
git clone https://github.com/cryptoloutre/whitelist-gated-token-sale.git
cd whitelist-gated-token-sale
npm install
```

## Deployment & Testing

To deploy and test our program, we will use [Solana Playground](https://beta.solpg.io/).

### Import our project

In a new tab in your browser, open our project on Solana Playground available [here]().
Next, import the project into your local workspace by clicking the "Import" icon and naming your project with the name you want.

### Create a Playground wallet

Click on the red status indicator button at the bottom left of the screen, (optionally) save your wallet's keypair file to your computer for backup, then click "Continue".
If needed, you can request additional SOL [here](https://faucet.solana.com/).

### Modifications

Open the `src/lib.rs` file and modify the value of `ADMIN_PUBKEY` by replacing it with the public key of the connected wallet. In this file, you can also modify `LIMIT_PER_WALLET`, `WL_REQUIREMENT` and `TOKEN_PRICE` to meet your needs but for testing purpose you can keep these values.
Open the `tests/anchor.test.ts` file and modify the value of `LIMIT_PER_WALLET` and `metadata` to meet your needs. For testing purpose you can keep these values.

### Build, Deployment & Testing

On the left sidebar, select the "Build & Deploy" tab. Next, click the "Build" button. If you look at the Playground's terminal, you should see your Solana program begin to compile. Once complete, you will see a success message.
Then, you can click the "Deploy" button to deploy the program to the Solana blockchain.
Finally, on the left sidebar, select the "Explorer" tab. Next, click the "Test" button to execute the unit tests. If, you didn't change the value of `LIMIT_PER_WALLET` click the "Test" button again to see the buy transaction fail because you have reached the buy limit.

Note: If you only want to initialize the mint accounts, you can select the "Explorer" tab and click the "Run" button.


## Blinks

This repo allows your users to buy tokens thanks to a [Blink](https://solana.com/fr/docs/advanced/actions). A deployed and functionnal Blink can be find [here](https://dial.to/devnet?action=solana-action%3Ahttps%3A%2F%2Fwhitelist-gated-token-sale.vercel.app%2Fapi%2Factions%2Ftoken-sale).

To build your own Blink, open the `whitelist-gated-token-sale` folder previously installed and open the `src/app/api/actions/token-sale/const.ts` file to modify `PROGRAM_ID` with the program ID of your deployed program. You can also modify `LIMIT_PER_WALLET` and `WL_REQUIREMENT` to meet your needs and modify `connection` to use your own RPC. Moreover, you can also modify the `src/app/api/actions/token-sale/route.ts` file to customize it, specially the different messages and icon displayed.

Finally, once modified, you can deploy your app on Vercel, for example. Head over to [Dialect](https://dial.to/devnet) and enter the URL of your Action (it should look like this `https://<YOUR-DOMAIN>/api/actions/token-sale`) to test it.

## Deploy on Vercel

To deploy your app on Vercel, head over to their [website](https://vercel.com/), import your project and deploy it with the default settings.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
