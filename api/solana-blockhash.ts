export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userHeliusRpc = process.env.HELIUS_RPC_URL || process.env.VITE_HELIUS_RPC_URL || process.env.HELIUS_RPC;
    // Accept wallet owner address (the actual connected wallet public key)
    const walletAddress = req.query.wallet;
    const recipientAtaAddress = req.query.recipientAta;

    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

    const rpcNodes: string[] = [];
    if (userHeliusRpc) {
      rpcNodes.push(userHeliusRpc);
    }
    // Fallbacks
    rpcNodes.push('https://rpc.ankr.com/solana');
    rpcNodes.push('https://solana-mainnet.public.blastapi.io');
    rpcNodes.push('https://api.mainnet-beta.solana.com');

    let blockhash = '';
    let balance = 0;
    let balanceExists = false;
    let senderATA = '';
    let recipientAtaExists = false;
    let lastError: any = null;

    for (const nodeUrl of rpcNodes) {
      try {
        console.log(`[solana-blockhash] Connecting to RPC: ${nodeUrl}`);

        // 1. Fetch latest blockhash
        const blockhashResponse = await fetch(nodeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getLatestBlockhash',
            params: [{ commitment: 'confirmed' }],
          }),
        });

        if (!blockhashResponse.ok) {
          throw new Error(`HTTP error fetching blockhash: ${blockhashResponse.status}`);
        }

        const blockhashData: any = await blockhashResponse.json();
        if (blockhashData.error) {
          throw new Error(`RPC error: ${blockhashData.error.message || JSON.stringify(blockhashData.error)}`);
        }

        if (blockhashData.result?.value?.blockhash) {
          blockhash = blockhashData.result.value.blockhash;
          console.log(`[solana-blockhash] Got blockhash from ${nodeUrl}`);
        } else {
          throw new Error('Invalid blockhash response');
        }

        // 2. Discover sender's USDC token account using getTokenAccountsByOwner
        if (walletAddress) {
          console.log(`[solana-blockhash] Discovering USDC accounts for wallet: ${walletAddress}`);
          const tokenAccountsResponse = await fetch(nodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'getTokenAccountsByOwner',
              params: [
                walletAddress,
                { mint: USDC_MINT },
                { encoding: 'jsonParsed' }
              ],
            }),
          });

          if (tokenAccountsResponse.ok) {
            const tokenData: any = await tokenAccountsResponse.json();
            if (tokenData.result?.value && tokenData.result.value.length > 0) {
              // Find the account with the highest balance
              let bestAccount = tokenData.result.value[0];
              let bestBalance = 0;
              for (const account of tokenData.result.value) {
                const info = account.account?.data?.parsed?.info;
                if (info) {
                  const amt = Number(info.tokenAmount?.uiAmount || 0);
                  if (amt >= bestBalance) {
                    bestBalance = amt;
                    bestAccount = account;
                  }
                }
              }
              senderATA = bestAccount.pubkey;
              const info = bestAccount.account?.data?.parsed?.info;
              balance = Number(info?.tokenAmount?.uiAmount || 0);
              balanceExists = true;
              console.log(`[solana-blockhash] Found USDC account: ${senderATA}, balance: ${balance}`);
            } else {
              // No USDC token accounts found for this wallet
              balanceExists = true;
              balance = 0;
              console.log(`[solana-blockhash] No USDC accounts found for wallet ${walletAddress}`);
            }
          }
        }

        // 3. Check recipient ATA existence
        if (recipientAtaAddress) {
          console.log(`[solana-blockhash] Checking recipient ATA: ${recipientAtaAddress}`);
          const accountResponse = await fetch(nodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 3,
              method: 'getAccountInfo',
              params: [recipientAtaAddress, { encoding: 'jsonParsed' }],
            }),
          });

          if (accountResponse.ok) {
            const accountData: any = await accountResponse.json();
            recipientAtaExists = !!(accountData.result && accountData.result.value !== null);
            console.log(`[solana-blockhash] Recipient ATA exists: ${recipientAtaExists}`);
          }
        }

        break; // success
      } catch (err: any) {
        console.warn(`[solana-blockhash] Failed on ${nodeUrl}:`, err.message || err);
        lastError = err;
      }
    }

    if (!blockhash) {
      throw new Error(`Failed to connect to Solana RPC: ${lastError?.message || 'All nodes failed'}`);
    }

    res.status(200).json({ blockhash, balance, balanceExists, senderATA, recipientAtaExists });
  } catch (error: any) {
    console.error('[solana-blockhash] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch blockhash' });
  }
}
