import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

interface DropdownMenuItemProps {
	children: React.ReactNode;
	onClick?: () => void;
	className?: string;
	disabled?: boolean;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
	trigger,
	children,
	className
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div
			className={cn('relative', className)}
			ref={dropdownRef}
			onMouseEnter={() => setIsOpen(true)}
			onMouseLeave={() => setIsOpen(false)}
		>
			<div onClick={() => setIsOpen(!isOpen)}>
				{trigger}
			</div>

			{isOpen && (
				<div className="absolute right-0 top-full mt-0 w-48 z-50">
					{/* Invisible bridge to prevent hover loss */}
					<div className="h-2 w-full bg-transparent" />
					<div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg">
						{children}
					</div>
				</div>
			)}
		</div>
	);
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
	children,
	onClick,
	className,
	disabled = false
}) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'w-full px-4 py-3 text-left text-sm transition-colors',
				'hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed',
				'first:rounded-t-lg last:rounded-b-lg',
				'flex items-center gap-2',
				className
			)}
		>
			{children}
		</button>
	);
};

export const DropdownMenuSeparator: React.FC = () => {
	return <div className="border-t border-neutral-700 my-1" />;
};