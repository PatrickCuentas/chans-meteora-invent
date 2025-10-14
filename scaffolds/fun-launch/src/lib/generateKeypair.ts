// import {Keypair} from '@solana/web3.js';

// const keyPair = Keypair.generate();

// let mintEncontrado: boolean = false;

// /*while( mintEncontrado == false ){

// }*/


// console.log({keyPair,mint: keyPair.publicKey.toBase58()});

import { Keypair } from "@solana/web3.js";

function generateVanityKeypair(suffix: string) {
  let kp: Keypair;
  let pubkey: string;
  let intentos = 0;

  do {
    kp = Keypair.generate();
    pubkey = kp.publicKey.toBase58();
    intentos++;
    if (intentos % 1000 === 0) {
      console.log(`Probados ${intentos} keypairs...`);
    }
  } while (!pubkey.endsWith(suffix));

  console.log(`Encontrado después de ${intentos} intentos`);
  console.log("Public Key:", pubkey);
  console.log("Secret Key:", Buffer.from(kp.secretKey).toString("base64"));
  //enviar objeto "keypair" a la base de datos
  return kp;
}

const myKeypair = generateVanityKeypair("chan");

console.log(myKeypair) // PostgreSQL