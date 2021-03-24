export * from "./api"
export * from "./pow"
export * from "./utils"
export * from "./interfaces"

import envs from "./envs.json"
type EnvNames = keyof typeof envs
export const getEnv = (envName: any) => {
  if (!envName) {
    throw new Error(`no envName: ${envName}`)
  }
  const env = envs[envName as EnvNames]
  if (!env) {
    throw new Error(`undefined env: ${envName}`)
  }
  return env
}
