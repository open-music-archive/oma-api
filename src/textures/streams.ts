import { SimpleComposition } from './live-stream';
import * as textures from './textures';

export function getDefault() {
  return new SimpleComposition({
    updateInterval: 10000,
    variations: false,
    defaultTexture: textures.getNiceAndExperimentalLoop()
  });
}

export function getSimple() {
  return new SimpleComposition({
    updateInterval: 2000,
    variations: true,
    defaultTexture: textures.getShortAndExperimentalLoop()
  });
}

export function getCrackling() {
  return new SimpleComposition({
    updateInterval: 10000,
    variations: false,
    defaultTexture: textures.getCracklingLoop()
  })
}