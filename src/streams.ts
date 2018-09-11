import { CompositionStream } from './live-stream';
import { getShortAndExperimentalLoop } from './textures';

export function getFun() {
  return new CompositionStream(2000, true, getShortAndExperimentalLoop());
}