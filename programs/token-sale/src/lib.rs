use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use anchor_lang::system_program;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata as Metaplex,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use solana_program::{pubkey, pubkey::Pubkey};

declare_id!("FNS6DWapPBEn3Vwd5BzeUX5mh1nVCMQVAKnmZB2pUF32");

const ADMIN_PUBKEY: Pubkey = pubkey!("devCYCMC6VfZG5mzK7dGPBs9zAZQVWXf151LS1PJmCo"); // pubkey that can initialize the mints and withdraw SOL from the vault
const LIMIT_PER_WALLET: u64 = 100; // a wallet can buy a maximum of 100 tokens
const WL_REQUIREMENT: u64 = 1; // users have to hold 1 WL token to buy token
const TOKEN_PRICE: u64 = LAMPORTS_PER_SOL / 100; // 0.01 SOL per token
#[program]
mod token_sale {
    use super::*;
    // initialize the mint accounts
    pub fn initialize(ctx: Context<Initialize>, metadata: InitTokenParams) -> Result<()> {
        let wl_seeds = &["wl_mint".as_bytes(), &[ctx.bumps.wl_mint]];
        let wl_signer = [&wl_seeds[..]];

        let wl_token_data: DataV2 = DataV2 {
            name: metadata.wl_name,
            symbol: metadata.wl_symbol,
            uri: metadata.wl_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let wl_metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.wl_mint.to_account_info(),
                mint: ctx.accounts.wl_mint.to_account_info(),
                metadata: ctx.accounts.wl_metadata.to_account_info(),
                mint_authority: ctx.accounts.wl_mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &wl_signer,
        );

        create_metadata_accounts_v3(wl_metadata_ctx, wl_token_data, false, true, None)?;

        let sale_seeds = &["sale_mint".as_bytes(), &[ctx.bumps.sale_mint]];
        let sale_signer = [&sale_seeds[..]];

        let sale_token_data: DataV2 = DataV2 {
            name: metadata.sale_name,
            symbol: metadata.sale_symbol,
            uri: metadata.sale_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let sale_metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.sale_mint.to_account_info(),
                mint: ctx.accounts.sale_mint.to_account_info(),
                metadata: ctx.accounts.sale_metadata.to_account_info(),
                mint_authority: ctx.accounts.sale_mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &sale_signer,
        );

        create_metadata_accounts_v3(sale_metadata_ctx, sale_token_data, false, true, None)?;

        msg!("Token mint created successfully.");

        Ok(())
    }

    // mint WL token to the user
    pub fn request_wl(ctx: Context<RequestWL>) -> Result<()> {
        let seeds = &["wl_mint".as_bytes(), &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            1,
        )?;

        Ok(())
    }

    // initilize the user's limit tracker
    pub fn initialize_limit_tracker(ctx: Context<InitializeLimitTracker>) -> Result<()> {
        let tracker = &mut ctx.accounts.tracker;

        tracker.count = 0;

        Ok(())
    }

    // transfer SOL from the user to the vault and mint tokens to the user
    pub fn buy_tokens(ctx: Context<BuyTokens>, quantity: u64) -> Result<()> {
        let wl_balance: u64 = ctx.accounts.wl_account.amount
            / (1u64)
                .checked_mul(10u64.pow(ctx.accounts.wl_mint.decimals as u32))
                .unwrap();

        // ensure that user holds enough WL tokens
        if wl_balance < WL_REQUIREMENT {
            return Err(error!(ErrorCode::WlRequirementNotMet));
        }

        // ensure that user didn't reach the buy limit
        if ctx.accounts.tracker.count >= LIMIT_PER_WALLET {
            return Err(error!(ErrorCode::BuyLimitReached));
        }

        let mut amount_to_buy: u64 = quantity;
        // to convert Big Number to number and allows the comparisation
        let amount_conversion = (1u64)
            .checked_mul(10u64.pow(ctx.accounts.sale_mint.decimals as u32))
            .unwrap();

        // if quantity exceeds the number of tokens the user can still buy, set quantity to the remaining amount
        if quantity / amount_conversion > LIMIT_PER_WALLET - ctx.accounts.tracker.count {
            amount_to_buy = (LIMIT_PER_WALLET - ctx.accounts.tracker.count) * amount_conversion;
        }

        // transfer SOL
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.payer.to_account_info().clone(),
                to: ctx.accounts.vault.to_account_info().clone(),
            },
        );
        system_program::transfer(cpi_context, TOKEN_PRICE * amount_to_buy / amount_conversion)?;

        // mint tokens
        let seeds = &["sale_mint".as_bytes(), &[ctx.bumps.sale_mint]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.sale_mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    mint: ctx.accounts.sale_mint.to_account_info(),
                },
                &signer,
            ),
            amount_to_buy,
        )?;

        // update the quantity of tokens already bought
        ctx.accounts.tracker.count += amount_to_buy / amount_conversion;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, quantity: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let rent_due = Rent::get()?.minimum_balance(vault.to_account_info().data_len());

        // ensure the amount of lamports stored don't drop below the minimum for rent exemption
        if **vault.to_account_info().lamports.borrow() - rent_due < quantity {
            return Err(ProgramError::InsufficientFunds.into());
        }
        **ctx
            .accounts
            .vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= quantity;
        **ctx
            .accounts
            .payer
            .to_account_info()
            .try_borrow_mut_lamports()? += quantity;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(
    params: InitTokenParams
)]
pub struct Initialize<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub wl_metadata: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"wl_mint"],
        bump,
        payer = payer,
        mint::decimals = params.wl_decimals,
        mint::authority = wl_mint,
    )]
    pub wl_mint: Account<'info, Mint>,
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub sale_metadata: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"sale_mint"],
        bump,
        payer = payer,
        mint::decimals = params.sale_decimals,
        mint::authority = sale_mint,
    )]
    pub sale_mint: Account<'info, Mint>,
    #[account(
        init,
        seeds = [b"vault"],
        bump,
        payer = payer,
        space = 8
    )]
    pub vault: Account<'info, VaultAccount>,
    #[account(
        mut,
        address = ADMIN_PUBKEY)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

#[derive(Accounts)]
pub struct RequestWL<'info> {
    #[account(
        mut,
        seeds = [b"wl_mint"],
        bump,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct InitializeLimitTracker<'info> {
    #[account(
        init,
        seeds = [b"tracker", payer.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + 8
    )]
    pub tracker: Account<'info, TrackerAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(
        mut,
        seeds = [b"sale_mint"],
        bump,
        mint::authority = sale_mint,
    )]
    pub sale_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"wl_mint"],
        bump,
        mint::authority = wl_mint,
    )]
    pub wl_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = sale_mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(
        associated_token::mint = wl_mint,
        associated_token::authority = payer,
    )]
    pub wl_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, VaultAccount>,
    #[account(
        mut,
        seeds = [b"tracker", payer.key().as_ref()],
        bump,
    )]
    pub tracker: Account<'info, TrackerAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, VaultAccount>,
    #[account(
        mut,
        address = ADMIN_PUBKEY)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub wl_name: String,
    pub wl_symbol: String,
    pub wl_uri: String,
    pub wl_decimals: u8,
    pub sale_name: String,
    pub sale_symbol: String,
    pub sale_uri: String,
    pub sale_decimals: u8,
}
// account that will store the SOL earned thanks to the sales
#[account]
pub struct VaultAccount {}
// account that will track how many tokens a wallet has already purchased
#[account]
pub struct TrackerAccount {
    count: u64,
}
#[error_code]
pub enum ErrorCode {
    #[msg("You don't have enough WL tokens")]
    WlRequirementNotMet,
    #[msg("You can't buy more tokens")]
    BuyLimitReached,
}
