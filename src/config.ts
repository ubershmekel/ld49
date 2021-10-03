import Matter from 'matter-js';

function partialChecker<T = never>() {
  // https://stackoverflow.com/questions/69415412/a-typescript-interface-with-optional-keys/69417966#69417966
  return <I>(input: I & T) => input as I;
}

export const options = partialChecker<Matter.IRendererOptions>()({
  width: 1200,
  height: 600,
  hasBounds: true,
  // showAngleIndicator: true,
  wireframes: false,
  background: '#75bbfd',
});
