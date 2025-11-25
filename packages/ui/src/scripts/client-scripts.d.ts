declare class ClientScript {
    name: string;
    args: string[];
    body: string;
    constructor(name: string, args: string[], body: string);
    toString(): string;
    toFunctionStr(): string;
}
export declare const CLIENT_SCRIPTS: {
    toggleExpandedStoriesGroups: ClientScript;
};
export {};
