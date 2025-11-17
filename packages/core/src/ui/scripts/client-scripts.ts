// oxlint-disable ban-types
// oxlint-disable sort-keys
// oxlint-disable no-new-func

class ClientScript {
  name: string;
  args: string[];
  body: string;
  constructor(name: string, args: string[], body: string) {
    this.name = name;
    this.args = args;
    this.body = body;
  }
  toString(): string {
    return this.name;
  }
  toFunctionStr(): string {
    return `function ${this.name} (${this.args.join(",")}) {${this.body}}`;
  }
}

export const CLIENT_SCRIPTS = {
  toggleExpandedStoriesGroups: new ClientScript(
    "toggleExpandedStoriesGroups",
    [],
    "alert('toggle')",
  ),
} satisfies Record<string, ClientScript>;
