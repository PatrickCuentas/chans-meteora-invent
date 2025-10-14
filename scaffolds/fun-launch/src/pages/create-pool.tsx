import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { z } from 'zod';
import Header from '../components/Header';

import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Keypair, Transaction } from '@solana/web3.js';
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import { toast } from 'sonner';

// Define the schema for form validation
const poolSchema = z.object({
	tokenName: z.string().min(3, 'Token name must be at least 3 characters'),
	tokenSymbol: z.string().min(1, 'Token symbol is required'),
	tokenLogo: z.instanceof(File, { message: 'Token logo is required' }).optional(),
	website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
	twitter: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

interface FormValues {
	tokenName: string;
	tokenSymbol: string;
	tokenLogo: File | undefined;
	website?: string;
	twitter?: string;
}

export default function CreatePool() {
	const { publicKey, signTransaction } = useWallet();
	const address = useMemo(() => publicKey?.toBase58(), [publicKey]);

	const [isLoading, setIsLoading] = useState(false);
	const [poolCreated, setPoolCreated] = useState(false);
	const [selectedKeypairFile, setSelectedKeypairFile] = useState<string>('');

	// Estado para la vista previa de imagen
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	// AGREGADO: Función para limpiar la vista previa
	const clearImagePreview = () => {
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
			setImagePreview(null);
		}
	};

	const form = useForm({
		defaultValues: {
			tokenName: '',
			tokenSymbol: '',
			tokenLogo: undefined,
			website: '',
			twitter: '',
		} as FormValues,
		onSubmit: async ({ value }) => {
			try {
				setIsLoading(true);
				const { tokenLogo } = value;
				if (!tokenLogo) {
					toast.error('Token logo is required');
					return;
				}

				if (!signTransaction) {
					toast.error('Wallet not connected');
					return;
				}

				const reader = new FileReader();

				// Convert file to base64
				const base64File = await new Promise<string>((resolve) => {
					reader.onload = (e) => resolve(e.target?.result as string);
					reader.readAsDataURL(tokenLogo);
				});

				//const keyPair = Keypair.generate(); // Traer Keypair de la base de datos

				// Leer Keypair del JSON
				const secretResponse = await fetch('/api/get-secretkey');
				const secretKeyData = await secretResponse.json();
				const keyPair = Keypair.fromSecretKey(new Uint8Array(secretKeyData.secret));

				// Store the keypair filename for later use
				setSelectedKeypairFile(secretKeyData.keypairFileName);
				console.log({ s: secretKeyData.secret, fileName: secretKeyData.keypairFileName });

				// Step 1: Upload to R2 and get transaction
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						tokenLogo: base64File,
						mint: keyPair.publicKey.toBase58(),
						tokenName: value.tokenName,
						tokenSymbol: value.tokenSymbol,
						userWallet: address,
						website: value.website,
						twitter: value.twitter,
					}),
				});

				if (!uploadResponse.ok) {
					const error = await uploadResponse.json();
					throw new Error(error.error);
				}

				const { poolTx } = await uploadResponse.json();
				const transaction = Transaction.from(Buffer.from(poolTx, 'base64'));

				// Step 2: Sign with keypair first
				transaction.sign(keyPair);

				// Step 3: Then sign with user's wallet
				const signedTransaction = await signTransaction(transaction);

				// Step 4: Send signed transaction
				const sendResponse = await fetch('/api/send-transaction', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						signedTransaction: signedTransaction.serialize().toString('base64'),
					}),
				});

				if (!sendResponse.ok) {
					const error = await sendResponse.json();
					throw new Error(error.error);
				}

				const { success } = await sendResponse.json();
				if (success) {
					toast.success('Pool created successfully');
					setPoolCreated(true);

					// Move the used keypair to used_keypairs folder
					if (selectedKeypairFile) {
						try {
							const moveResponse = await fetch('/api/move-keypair', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify({
									keypairFileName: selectedKeypairFile,
								}),
							});

							if (moveResponse.ok) {
								console.log('Keypair moved to used_keypairs successfully');
							} else {
								console.error('Failed to move keypair');
							}
						} catch (moveError) {
							console.error('Error moving keypair:', moveError);
						}
					}

					// AGREGADO: Limpiar vista previa después de crear el pool exitosamente
					clearImagePreview();
				}
			} catch (error) {
				console.error('Error creating pool:', error);
				toast.error(error instanceof Error ? error.message : 'Failed to create pool');
			} finally {
				setIsLoading(false);
			}
		},
		validators: {
			onSubmit: ({ value }) => {
				const result = poolSchema.safeParse(value);
				if (!result.success) {
					return result.error.formErrors.fieldErrors;
				}
				return undefined;
			},
		},
	});

	return (
		<>
			<Head>
				<title>Launch token- Virtual Curve</title>
				<meta
					name="description"
					content="Create a new token pool on Virtual Curve with customizable price curves."
				/>
			</Head>

			<div className="min-h-screen bg-gradient-to-b text-white">
				{/* Header */}
				<Header />

				{/* Page Content */}
				<main className="container mx-auto px-4 py-10">

					<div className="night">
						<div className="star"></div>
						<div className="star"></div>
						<div className="star"></div>
						<div className="star"></div>
						<div className="star"></div>
					</div>

					<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
						<div>
							<h1 className="text-4xl font-bold mb-2">Create Pool</h1>
							<p className="text-gray-300">Launch your token with a customizable price curve</p>
						</div>
					</div>

					{poolCreated && !isLoading ? (
						<PoolCreationSuccess />
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
							className="space-y-8"
						>
							{/* Token Details Section */}
							<div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10">
								<h2 className="text-2xl font-bold mb-4">Token Details</h2>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<div className="mb-4">
											<label
												htmlFor="tokenName"
												className="block text-sm font-medium text-gray-300 mb-1"
											>
												Token Name*
											</label>
											{form.Field({
												name: 'tokenName',
												children: (field) => (
													<input
														id="tokenName"
														name={field.name}
														type="text"
														className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
														placeholder="e.g. Virtual Coin"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														required
														minLength={3}
													/>
												),
											})}
										</div>

										<div className="mb-4">
											<label
												htmlFor="tokenSymbol"
												className="block text-sm font-medium text-gray-300 mb-1"
											>
												Token Symbol*
											</label>
											{form.Field({
												name: 'tokenSymbol',
												children: (field) => (
													<input
														id="tokenSymbol"
														name={field.name}
														type="text"
														className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
														placeholder="e.g. VRTL"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														required
														maxLength={10}
													/>
												),
											})}
										</div>
									</div>
									<div>
										<label
											htmlFor="tokenLogo"
											className="block text-sm font-medium text-gray-300 mb-1"
										>
											Token Logo*
										</label>
										{form.Field({
											name: 'tokenLogo',
											children: (field) => (
												<div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
													{/* AGREGADO: Vista previa de imagen */}
													{imagePreview ? (
														<div className="mb-4">
															<img
																src={imagePreview}
																alt="Token logo preview"
																className="w-20 h-20 mx-auto rounded-lg object-cover border border-white/20"
															/>
															<button
																type="button"
																onClick={() => {
																	clearImagePreview();
																	field.handleChange(undefined);
																}}
																className="mt-2 text-sm text-red-400 hover:text-red-300 transition"
															>
																Remove image
															</button>
														</div>
													) : (
														<>
															<span className="iconify w-6 h-6 mx-auto mb-2 text-gray-400 ph--upload-bold" />
															<p className="text-gray-400 text-xs mb-2">PNG, JPG or SVG (max. 2MB)</p>
														</>
													)}
													<input
														type="file"
														id="tokenLogo"
														className="hidden"
														accept="image/*"
														onChange={(e) => {
															const file = e.target.files?.[0];
															if (file) {
																field.handleChange(file);
																// AGREGADO: Crear vista previa de la imagen
																clearImagePreview(); // Limpiar vista previa anterior
																const previewUrl = URL.createObjectURL(file);
																setImagePreview(previewUrl);
															}
														}}
													/>
													<label
														htmlFor="tokenLogo"
														className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition cursor-pointer"
													>
														{/* MODIFICADO: Cambiar texto del botón según si hay imagen */}
														{imagePreview ? 'Change Image' : 'Browse Files'}
													</label>
												</div>
											),
										})}
									</div>
								</div>
							</div>

							{/* Social Links Section */}
							<div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10">
								<h2 className="text-2xl font-bold mb-6">Social Links (Optional)</h2>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="mb-4">
										<label
											htmlFor="website"
											className="block text-sm font-medium text-gray-300 mb-1"
										>
											Website
										</label>
										{form.Field({
											name: 'website',
											children: (field) => (
												<input
													id="website"
													name={field.name}
													type="url"
													className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
													placeholder="https://yourwebsite.com"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
											),
										})}
									</div>

									<div className="mb-4">
										<label
											htmlFor="twitter"
											className="block text-sm font-medium text-gray-300 mb-1"
										>
											Twitter
										</label>
										{form.Field({
											name: 'twitter',
											children: (field) => (
												<input
													id="twitter"
													name={field.name}
													type="url"
													className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
													placeholder="https://twitter.com/yourusername"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
											),
										})}
									</div>
								</div>
							</div>

							{form.state.errors && form.state.errors.length > 0 && (
								<div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 space-y-2">
									{form.state.errors.map((error, index) =>
										Object.entries(error || {}).map(([, value]) => (
											<div key={index} className="flex items-start gap-2">
												<p className="text-red-200">
													{Array.isArray(value)
														? value.map((v: any) => v.message || v).join(', ')
														: typeof value === 'string'
															? value
															: String(value)}
												</p>
											</div>
										))
									)}
								</div>
							)}

							<div className="flex justify-end">
								<SubmitButton isSubmitting={isLoading} />
							</div>
						</form>
					)}
				</main>
			</div>
		</>
	);
}

const SubmitButton = ({ isSubmitting }: { isSubmitting: boolean }) => {
	const { publicKey } = useWallet();
	const { setShowModal } = useUnifiedWalletContext();

	if (!publicKey) {
		return (
			<Button type="button" onClick={() => setShowModal(true)} className='btn-wallet'>
				<span>Connect Wallet</span>
			</Button>
		);
	}

	return (
		<Button className="flex items-center gap-2" type="submit" disabled={isSubmitting}>
			{isSubmitting ? (
				<>
					<span className="iconify ph--spinner w-5 h-5 animate-spin" />
					<span>Creating Pool...</span>
				</>
			) : (
				<>
					<span className="iconify ph--rocket-bold w-5 h-5" />
					<span>Launch Pool</span>
				</>
			)}
		</Button>
	);
};

const PoolCreationSuccess = () => {
	return (
		<>
			<div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10 text-center">
				<div className="bg-green-500/20 p-4 rounded-full inline-flex mb-6">
					<span className="iconify ph--check-bold w-12 h-12 text-green-500" />
				</div>
				<h2 className="text-3xl font-bold mb-4">Pool Created Successfully!</h2>
				<p className="text-gray-300 mb-8 max-w-lg mx-auto">
					Your token pool has been created and is now live on the Virtual Curve platform. Users can
					now buy and trade your tokens.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Link
            href="/"
						className="bg-white/10 px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition"
					>
						Explore Pools
					</Link>
					<button
						onClick={() => {
							window.location.reload();
						}}
						className="cursor-pointer bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 rounded-xl font-medium hover:opacity-90 transition"
					>
						Create Another Pool
					</button>
				</div>
			</div>
		</>
	);
};
