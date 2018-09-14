import { uris } from 'dymo-core';
import { RandomOnset, RandomConcat, SoundMaterial } from './texture';

export function getNiceAndExperimentalLoop(prioritizeRecent = true) {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.LongAndShort,
    regenerateSoundMaterial: true,
    prioritizeRecent: prioritizeRecent,
    loop:true, panning: true, effects: true,
    //params: [{type: uris.PLAYBACK_RATE, range: [0.1,1]}]
  });
}

export function getBenLoop() {
  return new RandomOnset({
    soundMaterialType: SoundMaterial.LoudestAndLong,
    regenerateSoundMaterial: true,
    prioritizeRecent: true,
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
    soundMaterialType: SoundMaterial.Louder,
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
    maxSoundMaterialSize: 50,
    prioritizeRecent: prioritizeRecent,
    loop: true, panning: true, effects: true
  });
}

export function getCracklingLoop(prioritizeRecent = true) {
  return new RandomConcat({
    soundMaterialType: SoundMaterial.Crackling,
    minSoundMaterialSize: 10,
    maxSoundMaterialSize: 40,
    regenerateSoundMaterial: true,
    prioritizeRecent: prioritizeRecent,
    loop: true, panning: true, effects: true
  });
}

export function getDenseRecentMaterialLoop(soundMaterial = SoundMaterial.LongAndShort) {
  return new RandomOnset({
    soundMaterialType: soundMaterial,
    regenerateSoundMaterial: true,
    minSoundMaterialSize: 10,
    maxSoundMaterialSize: 40,
    prioritizeRecent: true,
    loop:true, panning: true, effects: true,
    //params: [{type: uris.PLAYBACK_RATE, range: [0.1,1]}]
  });
}