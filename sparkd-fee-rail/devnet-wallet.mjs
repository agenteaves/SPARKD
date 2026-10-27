import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

export async function getDevnetWalletBalances({ address, rpcUrl, mint }) {
  let owner;
  try {
    owner = new PublicKey(address);
  } catch {
    throw new Error('Enter a valid Solana wallet address.');
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const lamports = await connection.getBalance(owner, 'confirmed');
  let sparkd = { mint: mint || null, amount: '0', decimals: null };

  if (mint) {
    let mintAddress;
    try {
      mintAddress = new PublicKey(mint);
    } catch {
      throw new Error('The configured Devnet test mint address is invalid.');
    }
    const tokenAccount = getAssociatedTokenAddressSync(mintAddress, owner);
    const accountInfo = await connection.getAccountInfo(tokenAccount, 'confirmed');
    if (accountInfo) {
      const balance = await connection.getTokenAccountBalance(tokenAccount, 'confirmed');
      sparkd = { mint, amount: balance.value.amount, decimals: balance.value.decimals };
    }
  }

  return {
    cluster: 'devnet',
    address: owner.toBase58(),
    solLamports: lamports,
    sparkd,
    readOnly: true,
  };
}
