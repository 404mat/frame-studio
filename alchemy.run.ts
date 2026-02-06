import alchemy from 'alchemy';
import { TanStackStart } from 'alchemy/cloudflare';

const app = await alchemy('frame-studio', {
  stage: process.env.STAGE || 'prod',
});

export const worker = await TanStackStart('app', {
  domains: ['studio.mathias.gg'],
  url: false,
  adopt: true,
});

await app.finalize();
