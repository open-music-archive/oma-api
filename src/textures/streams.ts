import { CompositionStream } from './live-stream';
import * as textures from './textures';

export function getFun() {
  return new CompositionStream(2000, true, textures.getShortAndExperimentalLoop());
}