import { uris } from 'dymo-core';
import { RandomOnset, RandomConcat, SoundMaterial } from './texture';

export function getNiceAndExperimentalLoop() {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.LongAndShort,
    regenerateSoundMaterial: true,
    loop:true, panning: true, effects: true,
    params: [{type: uris.PLAYBACK_RATE, range: [0.1,1]}]
  });
}

export function getShortAndExperimentalLoop() {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.LongAndShort,
    regenerateSoundMaterial: true,
    duration: 2, loop: true, panning: true, effects: true
  });
}

export function getSlowAndLow() {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.Loudest,
    regenerateSoundMaterial: true,
    duration: 4, panning: true, loop:true, effects: true,
    params: [{type: uris.PLAYBACK_RATE, range: [0.1,0.3]}]
  });
}

export function getSimilarityLoop() {
  return new RandomConcat({
    soundMaterialType: SoundMaterial.Similars,
    regenerateSoundMaterial: true,
    repeat: 3, panning: true, effects: true
  });
}

export function getCracklingLoop() {
  return new RandomConcat({
    soundMaterialType: SoundMaterial.Crackling,
    regenerateSoundMaterial: false,
    loop: true, panning: true, effects: true
  });
}