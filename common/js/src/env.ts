import localEnv from "./envs/local.json"
import stagingEnv from "./envs/staging.json"
import productionEnv from "./envs/production.json"

type Env = typeof productionEnv
export type EnvContract = Env["contract"]

export const getEnv = (envName: any): Env => {
  if (!envName) {
    throw new Error(`no envName: ${envName}`)
  }

  switch (envName) {
    case "local":
      return localEnv
    case "staging":
      return stagingEnv
    case "production":
      return productionEnv
    default:
      throw new Error(`undefined env: ${envName}`)
  }
}
