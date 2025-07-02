// Interface for Adserver plugins
export default class AdserverPlugin {
  // Pure function: takes ad request, returns ad response
  serveAd(request) {
    throw new Error('serveAd() must be implemented by plugin');
  }
}
