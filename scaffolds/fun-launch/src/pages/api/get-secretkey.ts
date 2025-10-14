import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from 'path';


export default function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		// Path to the keypairs folder
		const keypairsDir = path.join(process.cwd(), '..', '..', '..', 'keypairs');

		// Read all files in the keypairs directory
		const keypairFiles = fs.readdirSync(keypairsDir).filter(file => file.endsWith('.json'));

		if (keypairFiles.length === 0) {
			return res.status(404).json({ error: 'No keypairs available' });
		}

		// Select a random keypair file
		const randomIndex = Math.floor(Math.random() * keypairFiles.length);
		const selectedKeypairFile = keypairFiles[randomIndex];

		// Read the selected keypair
		const filePath = path.join(keypairsDir, selectedKeypairFile);
		const secret = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

		res.status(200).json({
			secret,
			keypairFileName: selectedKeypairFile	
		});
	} catch (error) {
		console.error('Error selecting keypair:', error);
		res.status(500).json({ error: 'Failed to select keypair' });
	}
}