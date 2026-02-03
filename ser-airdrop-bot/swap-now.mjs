import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

const TREASURY_PK = '67p2i4okjUBSpACcfDGFFGeN7q8sHjDavZd63UBg37kjEv3pRUfMgEZVAhTBMEuiZmBDVzHivcoMQGDtSGjax4Ww';
const RPC = 'https://mainnet.helius-rpc.com/?api-key=ffc54226-c74b-4016-9202-0fa023e38c47';
const PUMPPORTAL_API = 'https://pumpportal.fun/api/trade-local';
const PENGUIN_MINT = '8Jx8AAHj86wbQgUTjGuj6GTTL5Ps3cqxKRTvpaJApump';

async function swap() {
  const conn = new Connection(RPC, 'confirmed');
  const wallet = Keypair.fromSecretKey(bs58.decode(TREASURY_PK));

  console.log('=== MANUAL SWAP ===');
  console.log('Treasury:', wallet.publicKey.toString());

  const bal = await conn.getBalance(wallet.publicKey);
  console.log('SOL Balance:', bal / 1e9, 'SOL');

  // Swap 70%, keep 30% for gas
  const swapAmount = (bal / 1e9) * 0.7;
  console.log('\nSwapping', swapAmount.toFixed(4), 'SOL → PENGUIN...');

  const response = await fetch(PUMPPORTAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'buy',
      mint: PENGUIN_MINT,
      amount: swapAmount,
      denominatedInSol: 'true',
      slippage: 10,
      priorityFee: 0.0001,
      publicKey: wallet.publicKey.toString(),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.log('Error:', err);
    return;
  }

  const data = await response.arrayBuffer();
  const tx = VersionedTransaction.deserialize(new Uint8Array(data));

  tx.sign([wallet]);
  const sig = await conn.sendTransaction(tx, { skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 });
  console.log('Tx:', sig);

  await conn.confirmTransaction(sig, 'confirmed');

  // Check PENGUIN balance
  const penguinMint = new PublicKey(PENGUIN_MINT);
  const tokenAccs = await conn.getTokenAccountsByOwner(wallet.publicKey, { mint: penguinMint });
  if (tokenAccs.value.length > 0) {
    const balInfo = await conn.getTokenAccountBalance(tokenAccs.value[0].pubkey);
    console.log('\n✅ SWAP SUCCESS!');
    console.log('PENGUIN Balance:', balInfo.value.uiAmount?.toLocaleString());
  }
  console.log('https://solscan.io/tx/' + sig);
}

swap().catch(e => console.log('Error:', e.message));
