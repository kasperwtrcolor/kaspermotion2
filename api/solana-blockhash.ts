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
    let lastError: any = null;

    for (const nodeUrl of rpcNodes) {
      try {
        console.log(`Connecting to Solana RPC node: ${nodeUrl}`);
        const response = await fetch(nodeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getLatestBlockhash',
            params: [{ commitment: 'confirmed' }],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data: any = await response.json();
        if (data.error) {
          throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (data.result?.value?.blockhash) {
          blockhash = data.result.value.blockhash;
          console.log(`Successfully retrieved blockhash: ${blockhash} from ${nodeUrl}`);
          break;
        } else {
          throw new Error('Invalid RPC response format');
        }
      } catch (err: any) {
        console.warn(`Failed to connect to ${nodeUrl}:`, err.message || err);
        lastError = err;
      }
    }

    if (!blockhash) {
      throw new Error(`Failed to establish a secure Solana RPC connection: ${lastError?.message || 'Access Forbidden (403)'}`);
    }

    res.status(200).json({ blockhash });
  } catch (error: any) {
    console.error('Failed to fetch blockhash on backend:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch blockhash' });
  }
}
