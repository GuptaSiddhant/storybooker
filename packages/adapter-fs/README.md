# StoryBooker adapter for Disk/File Storage

## Database

The Local FileDB stores all data in a single JSON file.

You can provide path of JSON file relative to CWD as a parameter.

```ts
import { LocalFileDatabase } from "@storybooker/adapter-azure/data-tables";

const database = new LocalFileDatabase();

// use as database in StoryBooker options.
```

## Storage

The File Storage provides access to local files which can be used as storage for StoryBooker.

You can provide path of directory relative to CWD as a parameter.

```ts
import { LocalFileStorage } from "@storybooker/adapter-fs";

const storage = new LocalFileStorage();

// use as storage in StoryBooker options.
```
