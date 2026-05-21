export const ASSET_METADATA: Record<string, { name: string; logo: string }> = {
  BTC: { name: 'Bitcoin', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg' },
  ETH: { name: 'Ethereum', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ethereum-icon-purple.svg' },
  SOL: { name: 'Solana', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png' },
  XRP: { name: 'XRP', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Ripple_logo.svg' },
  ADA: { name: 'Cardano', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Cardano_logo.svg' },
  DOT: { name: 'Polkadot', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Polkadot_logo.svg' },
  DOGE: { name: 'Dogecoin', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Dogecoin_Logo.png' },
  MATIC: { name: 'Polygon', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Polygon_logo.svg' },
  AVAX: { name: 'Avalanche', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Avalanche_logo.svg' },
};

export const getLogoUrl = (symbol: string, fallbackUrl?: string | null) => ASSET_METADATA[symbol]?.logo || fallbackUrl || null;
