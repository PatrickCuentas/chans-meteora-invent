import Link from 'next/link';
import { WalletMenu } from './WalletMenu';
import { Button } from './ui/button';
import { useRouter } from 'next/router';

export const Header = () => {
	const router = useRouter();

	return (
		<header className="w-full px-4 py-3 flex items-center justify-between">
			{/* Logo Section */}
			<Link href="/" className="flex items-center">
				<span className="whitespace-nowrap text-lg md:text-2xl font-bold">Chans</span>
			</Link>

			{/* Navigation and Actions */}
			<div className="flex items-center gap-4">
				<Button
					onClick={() => router.push('/create-pool')}
					className="btn-pool"
				>
					<span className="flex items-center gap-2">
						<span className="iconify ph--rocket-bold w-4 h-4" />
						<span className="hidden md:block">New Coin</span>
						<span className="block md:hidden">New</span>
					</span>
				</Button>
				<WalletMenu />
			</div>
		</header>
	);
};

export default Header;
