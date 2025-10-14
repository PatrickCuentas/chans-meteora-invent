import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Page from '@/components/ui/Page/Page';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils';

interface TokenInfo {
	name: string;
	symbol: string;
	icon?: string;
	decimals: number;
	website?: string;
	twitter?: string;
	telegram?: string;
}

interface VolatilityTracker {
	lastUpdateTimestamp: string;
	padding: number[];
	sqrtPriceReference: string;
	volatilityAccumulator: string;
	volatilityReference: string;
}

interface Metrics {
	totalProtocolBaseFee: string;
	totalProtocolQuoteFee: string;
	totalTradingBaseFee: string;
	totalTradingQuoteFee: string;
}

interface PoolData {
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
	tokenInfo?: TokenInfo;
}

interface PoolsByCreatorResponse {
	success: boolean;
	creator: string;
	poolCount: number;
	pools: PoolData[];
}

const fetchPoolsByCreator = async (creatorAddress: string): Promise<PoolsByCreatorResponse> => {
	const response = await fetch(`/api/get-pools-by-creator?creatorAddress=${creatorAddress}`);
	if (!response.ok) {
		throw new Error('Failed to fetch pools');
	}
	console.log('Fetched pools by creator:', await response.clone().json());
	return response.json();
};

const PoolCard = ({ pool }: { pool: PoolData }) => {
	const handleClaimFees = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		// TODO: Implement claim fees functionality
		console.log('Claiming fees for pool:', pool.publicKey);
	};

	return (
		<Link href={`/token/${pool.account.baseMint}`}>
			<div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all cursor-pointer">
				{/* Header with token info */}
				<div className="flex items-center gap-3 mb-4">
					{pool.tokenInfo?.icon ? (
						<img
							src={pool.tokenInfo.icon}
							alt={pool.tokenInfo.name}
							className="w-12 h-12 rounded-full"
						/>
					) : (
						<div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
							<span className="iconify ph--coins-bold w-6 h-6" />
						</div>
					)}
					<div className="flex-1">
						<h3 className="font-semibold text-white text-lg">
							{pool.tokenInfo?.name || 'Unknown Token'}
						</h3>
						<p className="text-sm text-neutral-400">
							{pool.tokenInfo?.symbol || shortenAddress(pool.account.baseMint)}
						</p>
					</div>
				</div>

				{/* Website */}
				{pool.tokenInfo?.website && (
					<div className="mb-4">
						<a
							href={pool.tokenInfo.website}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
							onClick={(e) => e.stopPropagation()}
						>
							<span className="iconify ph--globe-bold w-4 h-4" />
							<span className="truncate">Visit Website</span>
							<span className="iconify ph--arrow-square-out-bold w-3 h-3" />
						</a>
					</div>
				)}

				{/* Footer with social links and button */}
				<div className="flex items-center justify-between pt-4 border-t border-neutral-700">
					{/* Social links */}
					<div className="flex items-center gap-3">
						{pool.tokenInfo?.twitter && (
							<a
								href={`https://twitter.com/${pool.tokenInfo.twitter.replace('@', '')}`}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
								title="Twitter/X"
								onClick={(e) => e.stopPropagation()}
							>
								<span className="iconify ph--twitter-logo-bold w-4 h-4" />
							</a>
						)}
						{pool.tokenInfo?.telegram && (
							<a
								href={pool.tokenInfo.telegram}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
								title="Telegram"
								onClick={(e) => e.stopPropagation()}
							>
								<span className="iconify ph--telegram-logo-bold w-4 h-4" />
							</a>
						)}
						{!pool.tokenInfo?.twitter && !pool.tokenInfo?.telegram && (
							<span className="text-neutral-500 text-xs">No social links</span>
						)}
					</div>

					{/* Claim Fees button */}
					<Button
						onClick={handleClaimFees}
						className="btn-wallet px-4 py-2 text-sm"
					>
						<span className="iconify ph--money-bold w-4 h-4 mr-2" />
						Claim Fees
					</Button>
				</div>
			</div>
		</Link>
	);
};

export default function ProfilePage() {
	const router = useRouter();
	const { address } = router.query;
	const creatorAddress = Array.isArray(address) ? address[0] : address;

	const { data, isLoading, error } = useQuery({
		queryKey: ['pools-by-creator', creatorAddress],
		queryFn: () => fetchPoolsByCreator(creatorAddress as string),
		enabled: !!creatorAddress,
		refetchInterval: 60000, // Refetch every minute
	});

	if (!creatorAddress) {
		return (
			<Page>
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center">
						<span className="iconify ph--warning-bold w-12 h-12 text-yellow-500 mx-auto mb-4" />
						<h2 className="text-xl font-semibold mb-2">Invalid Address</h2>
						<p className="text-neutral-400">Please provide a valid wallet address.</p>
					</div>
				</div>
			</Page>
		);
	}

	if (isLoading) {
		return (
			<Page>
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center">
						<span className="iconify ph--spinner-bold w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
						<p className="text-neutral-400">Loading profile...</p>
					</div>
				</div>
			</Page>
		);
	}

	if (error) {
		return (
			<Page>
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center">
						<span className="iconify ph--x-circle-bold w-12 h-12 text-red-500 mx-auto mb-4" />
						<h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
						<p className="text-neutral-400">
							{error instanceof Error ? error.message : 'Failed to load profile data'}
						</p>
						<Button
							onClick={() => router.reload()}
							className="mt-4 btn-wallet"
						>
							Try Again
						</Button>
					</div>
				</div>
			</Page>
		);
	}

	return (
		<Page>
			<div className="max-w-6xl mx-auto">
				{/* Profile Header */}
				<div className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
							<span className="iconify ph--user-bold w-8 h-8 text-white" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">Creator Profile</h1>
							<p className="text-neutral-400 font-mono">{shortenAddress(creatorAddress)}</p>
						</div>
					</div>

					<div className="flex items-center gap-6 text-sm">
						<div className="flex items-center gap-2">
							<span className="iconify ph--coins-bold w-5 h-5 text-blue-500" />
							<span className="text-neutral-400">Pools Created:</span>
							<span className="font-semibold">{data?.poolCount || 0}</span>
						</div>
					</div>
				</div>

				{/* Pools Grid */}
				<div>
					<h2 className="text-xl font-semibold mb-4">Created coins</h2>

					{data?.pools && data.pools.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{data.pools.map((pool) => (
								<PoolCard key={pool.publicKey} pool={pool} />
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<span className="iconify ph--empty-bold w-16 h-16 text-neutral-600 mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">No Pools Found</h3>
							<p className="text-neutral-400 mb-4">
								This creator hasn't launched any tokens yet.
							</p>
							<Link href="/create-pool">
								<Button>
									<span className="iconify ph--rocket-bold w-4 h-4 mr-2" />
									Launch Your First Token
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</Page>
	);
}