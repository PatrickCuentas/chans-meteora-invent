import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { ApeClient } from '@/components/Explore/client';

const RPC_URL = process.env.RPC_URL as string;

if (!RPC_URL) {
	throw new Error('Missing required environment variable: RPC_URL');
}

type GetPoolsByCreatorRequest = {
	creatorAddress: string;
};

type VolatilityTracker = {
	lastUpdateTimestamp: string;
	padding: number[];
	sqrtPriceReference: string;
	volatilityAccumulator: string;
	volatilityReference: string;
};

type Metrics = {
	totalProtocolBaseFee: string;
	totalProtocolQuoteFee: string;
	totalTradingBaseFee: string;
	totalTradingQuoteFee: string;
};

type PoolInfo = {
	publicKey: string;
	account: {
		volatilityTracker: VolatilityTracker;
		config: string;
		creator: string;
		baseMint: string;
		baseVault: string;
		quoteVault: string;
		baseReserve: string;
		quoteReserve: string;
		protocolBaseFee: string;
		protocolQuoteFee: string;
		partnerBaseFee: string;
		partnerQuoteFee: string;
		sqrtPrice: string;
		activationPoint: string;
		poolType: number;
		isMigrated: number;
		isPartnerWithdrawSurplus: number;
		isProtocolWithdrawSurplus: number;
		migrationProgress: number;
		isWithdrawLeftover: number;
		isCreatorWithdrawSurplus: number;
		migrationFeeWithdrawStatus: number;
		metrics: Metrics;
		finishCurveTimestamp: string;
		creatorBaseFee: string;
		creatorQuoteFee: string;
		padding1: string[];
	};
	// Token metadata from Jupiter API
	tokenInfo?: {
		name: string;
		symbol: string;
		icon?: string;
		decimals: number;
		website?: string;
		twitter?: string;
		telegram?: string;
	};
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET' && req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
	}

	try {
		let creatorAddress: string;

		// Handle both GET (query params) and POST (body) requests
		if (req.method === 'GET') {
			creatorAddress = req.query.creatorAddress as string;
		} else {
			const body = req.body as GetPoolsByCreatorRequest;
			creatorAddress = body.creatorAddress;
		}

		if (!creatorAddress) {
			return res.status(400).json({
				error: 'Missing required parameter: creatorAddress'
			});
		}

		// Validate the creator address format
		let creatorPublicKey: PublicKey;
		try {
			creatorPublicKey = new PublicKey(creatorAddress);
		} catch (error) {
			return res.status(400).json({
				error: 'Invalid creator address format. Must be a valid Solana public key.'
			});
		}

		// Initialize connection and client
		const connection = new Connection(RPC_URL, 'confirmed');
		const client = new DynamicBondingCurveClient(connection, "confirmed");

		console.log(`Fetching pools for creator: ${creatorAddress}`);

		// Get pools by creator using the SDK
		const pools = await client.state.getPoolsByCreator(creatorPublicKey);

		console.log(`Found ${pools.length} pools for creator ${creatorAddress}`);

		// Get token information for each pool
		const poolsWithTokenInfo: PoolInfo[] = await Promise.all(
			pools.map(async (pool) => {
				let tokenInfo;
				try {
					// Get token info from Jupiter API using the mint address
					const tokenResponse = await ApeClient.getToken({ id: pool.account.baseMint.toString() });
					if (tokenResponse?.pools?.[0]?.baseAsset) {
						const asset = tokenResponse.pools[0].baseAsset;
						tokenInfo = {
							name: asset.name,
							symbol: asset.symbol,
							icon: asset.icon,
							decimals: asset.decimals,
							website: asset.website,
							twitter: asset.twitter,
							telegram: asset.telegram,
						};
					}
				} catch (error) {
					console.warn(`Failed to get token info for mint ${pool.account.baseMint.toString()}:`, error);
					// Continue without token info if API call fails
				}

				return {
					publicKey: pool.publicKey.toString(),
					tokenInfo,
					account: {
						volatilityTracker: {
							lastUpdateTimestamp: pool.account.volatilityTracker.lastUpdateTimestamp.toString(),
							padding: Array.from(pool.account.volatilityTracker.padding),
							sqrtPriceReference: pool.account.volatilityTracker.sqrtPriceReference.toString(),
							volatilityAccumulator: pool.account.volatilityTracker.volatilityAccumulator.toString(),
							volatilityReference: pool.account.volatilityTracker.volatilityReference.toString(),
						},
						config: pool.account.config.toString(),
						creator: pool.account.creator.toString(),
						baseMint: pool.account.baseMint.toString(),
						baseVault: pool.account.baseVault.toString(),
						quoteVault: pool.account.quoteVault.toString(),
						baseReserve: pool.account.baseReserve.toString(),
						quoteReserve: pool.account.quoteReserve.toString(),
						protocolBaseFee: pool.account.protocolBaseFee.toString(),
						protocolQuoteFee: pool.account.protocolQuoteFee.toString(),
						partnerBaseFee: pool.account.partnerBaseFee.toString(),
						partnerQuoteFee: pool.account.partnerQuoteFee.toString(),
						sqrtPrice: pool.account.sqrtPrice.toString(),
						activationPoint: pool.account.activationPoint.toString(),
						poolType: pool.account.poolType,
						isMigrated: pool.account.isMigrated,
						isPartnerWithdrawSurplus: pool.account.isPartnerWithdrawSurplus,
						isProtocolWithdrawSurplus: pool.account.isProtocolWithdrawSurplus,
						migrationProgress: pool.account.migrationProgress,
						isWithdrawLeftover: pool.account.isWithdrawLeftover,
						isCreatorWithdrawSurplus: pool.account.isCreatorWithdrawSurplus,
						migrationFeeWithdrawStatus: pool.account.migrationFeeWithdrawStatus,
						metrics: {
							totalProtocolBaseFee: pool.account.metrics.totalProtocolBaseFee.toString(),
							totalProtocolQuoteFee: pool.account.metrics.totalProtocolQuoteFee.toString(),
							totalTradingBaseFee: pool.account.metrics.totalTradingBaseFee.toString(),
							totalTradingQuoteFee: pool.account.metrics.totalTradingQuoteFee.toString(),
						},
						finishCurveTimestamp: pool.account.finishCurveTimestamp.toString(),
						creatorBaseFee: pool.account.creatorBaseFee.toString(),
						creatorQuoteFee: pool.account.creatorQuoteFee.toString(),
						padding1: pool.account.padding1.map((p: any) => p.toString()),
					}
				};
			})
		);

		return res.status(200).json({
			success: true,
			creator: creatorAddress,
			poolCount: pools.length,
			pools: poolsWithTokenInfo
		});

	} catch (error) {
		console.error('Error fetching pools by creator:', error);

		return res.status(500).json({
			success: false,
			error: 'Internal server error while fetching pools',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}