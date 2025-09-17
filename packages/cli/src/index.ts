import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { name, version } from "../package.json" with { type: "json" };
import { createCommandModule } from "./commands/create";
import { purgeCommandModule } from "./commands/purge";
import { testCommandModule } from "./commands/test";

await yargs(hideBin(process.argv))
  .scriptName(name)
  .usage(`npx -y $0 [command] (options)`)
  .version(version)
  .command(createCommandModule)
  .command(purgeCommandModule)
  .command(testCommandModule)
  .alias("h", "help")
  .alias("v", "version")
  .parse();
