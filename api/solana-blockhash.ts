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
    const ataAddress = req.query.ata;

    const rpcNodes: string[] = [];
    if (userHeliusRpc) {
      rpcNodes.push(userHeliusRpc);
    }
    // Fallbacks
    rpcNodes.push('https://rpc.ankr.com/solana');
    rpcNodes.push('https://solana-mainnet.public.blastapi.io');
    rpcNodes.push('https://solana-mainnet.g.allthatnode.com');
    rpcNodes.push('https://api.mainnet-beta.solana.com');

    let blockhash = '';
    let balance = 0;
    let balanceExists = false;
    let lastError: any = null;

    for (const nodeUrl of rpcNodes) {
      try {
        console.log(`Connecting to Solana RPC node: ${nodeUrl}`);
        
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
          throw new Error(`RPC error fetching blockhash: ${blockhashData.error.message || JSON.stringify(blockhashData.error)}`);
        }

        if (blockhashData.result?.value?.blockhash) {
          blockhash = blockhashData.result.value.blockhash;
          console.log(`Successfully retrieved blockhash from ${nodeUrl}`);
        } else {
          throw new Error('Invalid blockhash RPC response format');
        }

        // 2. Fetch token balance if ata is provided
        if (ataAddress) {
          console.log(`Checking balance for ATA ${ataAddress} on ${nodeUrl}...`);
          const balanceResponse = await fetch(nodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'getTokenAccountBalance',
              params: [ataAddress],
            }),
          });

          if (balanceResponse.ok) {
            const balanceData: any = await balanceResponse.json();
            if (balanceData.result?.value) {
              balance = Number(balanceData.result.value.uiAmount || 0);
              balanceExists = true;
              console.log(`Successfully retrieved token balance: ${balance} USDC`);
            } else if (balanceData.error) {
              console.warn(`RPC returned balance error (account might be empty/uninitialized):`, balanceData.error);
              // Set balanceExists to true with 0 balance if it's a known empty token account error
              balance = 0;
              balanceExists = true;
            }
          }
        }

        break; // successfully retrieved blockhash!
      } catch (err: any) {
        console.warn(`Failed to connect to ${nodeUrl}:`, err.message || err);
        lastError = err;
      }
    }

    if (!blockhash) {
      throw new Error(`Failed to establish a secure Solana RPC connection: ${lastError?.message || 'Access Forbidden (403)'}`);
    }

    res.status(200).json({ blockhash, balance, balanceExists });
  } catch (error: any) {
    console.error('Failed to fetch blockhash on backend:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch blockhash' });
  }
}
