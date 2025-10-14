import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { keypairFileName } = req.body;

		if (!keypairFileName) {
			return res.status(400).json({ error: 'Keypair file name is required' });
		}

		// Paths for source and destination
		const keypairsDir = path.join(process.cwd(), '..', '..', '..', 'keypairs');
		const usedKeypairsDir = path.join(process.cwd(), '..', '..', '..', 'used_keypairs');

		const sourcePath = path.join(keypairsDir, keypairFileName);
		const destinationPath = path.join(usedKeypairsDir, keypairFileName);

		// Check if source file exists
		if (!fs.existsSync(sourcePath)) {
			return res.status(404).json({ error: 'Keypair file not found' });
		}

		// Create used_keypairs directory if it doesn't exist
		if (!fs.existsSync(usedKeypairsDir)) {
			fs.mkdirSync(usedKeypairsDir, { recursive: true });
		}

		// Move the file
		fs.renameSync(sourcePath, destinationPath);

		res.status(200).json({ success: true, message: 'Keypair moved to used_keypairs' });
	} catch (error) {
		console.error('Error moving keypair:', error);
		res.status(500).json({ error: 'Failed to move keypair' });
	}
}