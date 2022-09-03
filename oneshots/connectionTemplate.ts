import { connect } from "common"

const main = async () => {
  const api = await connect("endpoint", false)
  api.isReady // do something
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
