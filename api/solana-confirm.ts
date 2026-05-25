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
    const signature = req.query.signature;
    if (!signature) {
      return res.status(400).json({ error: 'Signature is required' });
    }

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

    let confirmed = false;
    let errDetail: any = null;

    for (const nodeUrl of rpcNodes) {
      try {
        console.log(`Checking signature status on: ${nodeUrl}`);
        const response = await fetch(nodeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignatureStatuses',
            params: [[signature], { searchTransactionHistory: true }],
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const status = data.result?.value?.[0];
          if (status) {
            if (status.err) {
              errDetail = status.err;
              console.error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
              break; // transaction failed on-chain, stop loop
            }
            if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
              confirmed = true;
              console.log(`Transaction confirmed successfully on ${nodeUrl}`);
              break;
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to verify signature on ${nodeUrl}:`, e);
      }
    }

    res.status(200).json({ confirmed, error: errDetail });
  } catch (error: any) {
    console.error('Failed to confirm signature on backend:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm signature' });
  }
}
