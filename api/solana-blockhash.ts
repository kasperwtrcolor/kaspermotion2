import { Connection } from '@solana/web3.js';

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
    
    const rpcNodes = [];
    if (userHeliusRpc) {
      rpcNodes.push(userHeliusRpc);
    }
    rpcNodes.push('https://rpc.ankr.com/solana');
    rpcNodes.push('https://solana-mainnet.public.blastapi.io');
    rpcNodes.push('https://solana-mainnet.g.allthatnode.com');
    rpcNodes.push('https://api.mainnet-beta.solana.com');

    let connection: any = null;
    let blockhash = '';
    let rpcError: any = null;

    for (const nodeUrl of rpcNodes) {
      try {
        console.log(`Connecting to Solana RPC node: ${nodeUrl}`);
        const conn = new Connection(nodeUrl, 'confirmed');
        const latest = await conn.getLatestBlockhash('confirmed');
        connection = conn;
        blockhash = latest.blockhash;
        break; // successfully retrieved blockhash!
      } catch (err) {
        console.warn(`Failed to connect to ${nodeUrl}, trying next node:`, err);
        rpcError = err;
      }
    }

    if (!connection || !blockhash) {
      throw new Error(`Failed to establish a secure Solana RPC connection: ${rpcError?.message || 'Access Forbidden (403)'}`);
    }

    res.status(200).json({ blockhash });
  } catch (error: any) {
    console.error('Failed to fetch blockhash on backend:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch blockhash' });
  }
}
