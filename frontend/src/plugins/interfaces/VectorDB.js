// Interface for VectorDB plugins
export default class VectorDBPlugin {
  // Pure function: takes query, returns results
  queryVectors(query) {
    throw new Error('queryVectors() must be implemented by plugin');
  }
}
