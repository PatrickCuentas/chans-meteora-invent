import { exec } from 'child_process';

const base = '4hzSHPiFLeYKDpJ75vAmtQqVGatAnkxy4MbQyey4r7xV'; // Reemplaza con la pubkey que será el base signer -> Fee claimer del ConfigKey
const owner = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'; // Reemplaza con el owner account -> La billetera del cliente
// const target = 'TARGET_PREFIX'; // Prefijo que quieres para tu vanity address
const suffix = 'chan';

/*

Options:
      --base <BASE>          The pubkey that will be the signer for the CreateAccountWithSeed instruction
      --owner <OWNER>        The account owner, e.g. BPFLoaderUpgradeab1e11111111111111111111111 or TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
      --target <TARGET>      The target prefix for the pubkey
      --case-insensitive     Whether user cares about the case of the pubkey
      --logfile <LOGFILE>    Optional log file
      --num-cpus <NUM_CPUS>  Number of cpu threads to use for mining [default: 0]
  -h, --help                 Print help

*/

// Comando para ejecutar vanity con esos parámetros
const command = `vanity grind --base ${base} --owner ${owner} --suffix ${suffix}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al ejecutar vanity: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error en vanity: ${stderr}`);
    return;
  }
  console.log(`Vanity Address output:\n${stdout}`);
});
