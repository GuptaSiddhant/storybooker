# StoryBooker CLI

A NodeJS CLI to sync with StoryBooker service. The CLI can be used to build, test, upload StoryBook to the service.

## Usage

See commands + help

```sh
npx -y storybooker -h
```

### Build+Upload assets

```sh
npx -y storybooker create \
    -u https://<storybooker-service> \
    -p <project-id> \
    --id <build-id> \
    --test \
    -l <branch-name> -l <another-label> \
    --authorName <your-name> \
    --authorEmail <your-email> \
    --message "<readable message>"
```
