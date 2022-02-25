import { getEnv } from "common"

export const isDevelopment = process.env.NODE_ENV === "development"
export const getOebEnv = () => getEnv(process.env.OEB_ENV)
