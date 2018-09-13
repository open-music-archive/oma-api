import { uris } from 'dymo-core';
import { RandomOnset, RandomConcat, SoundMaterial } from './texture';

export function getNiceAndExperimentalLoop(prioritizeRecent = true) {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.LongAndShort,
    regenerateSoundMaterial: true,
    prioritizeRecent: prioritizeRecent,
    loop:true, panning: true, effects: true,
    params: [{type: uris.PLAYBACK_RATE, range: [0.1,1]}]
  });
}

export function getShortAndExperimentalLoop(prioritizeRecent = true) {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.LongAndShort,
    regenerateSoundMaterial: true,
    prioritizeRecent: prioritizeRecent,
    duration: 2, loop: true, panning: true, effects: true
  });
}

export function getSlowAndLow(prioritizeRecent = true) {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.Loudest,
    regenerateSoundMaterial: true,
    prioritizeRecent: prioritizeRecent,
    duration: 4, panning: true, loop:true, effects: true,
    params: [{type: uris.PLAYBACK_RATE, range: [0.1,0.3]}]
  });
}

export function getSimilarityLoop(prioritizeRecent = true) {
  return new RandomConcat({
    soundMaterialType: SoundMaterial.Similars,
    regenerateSoundMaterial: true,
    prioritizeRecent: prioritizeRecent,
    repeat: 3, panning: true, effects: true
  });
}

export function getCracklingLoop(prioritizeRecent = true) {
  return new RandomConcat({
    soundMaterialType: SoundMaterial.Crackling,
    regenerateSoundMaterial: false,
    prioritizeRecent: prioritizeRecent,
    loop: true, panning: true, effects: true
  });
}