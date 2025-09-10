import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { name, version } from "../package.json" with { type: "json" };
import { createCommandModule } from "./command-create";

yargs(hideBin(process.argv))
  .scriptName(name)
  .usage(`npx -y $0 [command] (options)`)
  .version(version)
  .command(createCommandModule)
  .alias("h", "help")
  .alias("v", "version")
  .parse();
