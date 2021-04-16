declare module "*.worker.ts" {
  class WorkerLoaderWorker extends Worker {
    constructor()
  }
  export default WorkerLoaderWorker
}

declare module "*.svg" {
  const content: string
  export default content
}
