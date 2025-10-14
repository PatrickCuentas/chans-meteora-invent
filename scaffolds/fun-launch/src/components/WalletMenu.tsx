import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { shortenAddress } from '@/lib/utils';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from './ui/DropdownMenu';

export const WalletMenu = () => {
	const { setShowModal } = useUnifiedWalletContext();
	const { disconnect, publicKey } = useWallet();
	const router = useRouter();
	const address = useMemo(() => publicKey?.toBase58(), [publicKey]);

	const handleConnectWallet = () => {
		setShowModal(true);
	};

	const handleProfile = () => {
		if (address) {
			router.push(`/profile/${address}`);
		}
	};

	const handleSignOut = () => {
		disconnect();
	};

	// If wallet is not connected, show connect button
	if (!address) {
		return (
			<Button
				onClick={handleConnectWallet}
				className="btn-wallet"
			>
				<span className="flex items-center gap-2">
					<span className="iconify ph--wallet-bold w-4 h-4" />
					<span className="hidden md:block">Connect Wallet</span>
					<span className="block md:hidden">Connect</span>
				</span>
			</Button>
		);
	}

	// If wallet is connected, show dropdown menu
	return (
		<DropdownMenu
			className="group"
			trigger={
				<Button className="btn-wallet flex items-center gap-2">
					<span className="iconify ph--user-circle-bold w-4 h-4" />
					<span>{shortenAddress(address)}</span>
					<span className="iconify ph--caret-down-bold w-3 h-3 transition-transform group-hover:rotate-180" />
				</Button>
			}
		>
			<DropdownMenuItem onClick={handleProfile}>
				<span className="iconify ph--user-bold w-4 h-4" />
				<span>Profile</span>
			</DropdownMenuItem>

			<DropdownMenuSeparator />

			<DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:text-red-300">
				<span className="iconify ph--sign-out-bold w-4 h-4" />
				<span>Sign Out</span>
			</DropdownMenuItem>
		</DropdownMenu>
	);
};