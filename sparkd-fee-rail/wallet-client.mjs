import { Transaction } from '@solana/web3.js';

export async function signAndSubmitDevnetSwap({ provider, proposalId, unsignedTransaction }) {
  const wire = Uint8Array.from(atob(unsignedTransaction), (character) => character.charCodeAt(0));
  const transaction = Transaction.from(wire);
  const signed = await provider.signTransaction(transaction);
  const signedTransaction = signed.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
  const response = await fetch('/api/devnet/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ proposalId, signedTransaction }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The sponsored transaction could not be submitted.');
  return result;
}
