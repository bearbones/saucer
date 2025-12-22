/* eslint-disable @typescript-eslint/unbound-method */

import "fast-text-encoding";
import "react-native-url-polyfill/auto";

import Graphemer from "graphemer";

export {};

const splitter = new Graphemer();
globalThis.Intl = globalThis.Intl || {};

// @ts-expect-error we're polyfilling -prf
globalThis.Intl.Segmenter =
  globalThis.Intl.Segmenter ||
  class Segmenter {
    constructor() {}
    // NOTE
    // this is not a precisely correct polyfill but it's sufficient for our needs
    // -prf
    segment = splitter.iterateGraphemes;
  };
