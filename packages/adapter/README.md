# StoryBooker Adapter

The adapter package exports interfaces for all adapters that are required by StoryBooker to function properly.

Some adapters also exports a simple implementation using NodeJS API for testing.

# `AuthAdapter`

The adapter for Auth allows StoryBooker to connect with an Auth service and control user access.

# `DatabaseAdapter`

The adapter for Database allows StoryBooker to connect with an Database service and create/update/read entries from it.

# `LoggerAdapter`

The adapter for Logger allows StoryBooker to connect and use a different logger than NodeJS console logger. Logger can connect to a external logger and send messages asynchronously.

# `StorageAdapter`

The adapter for Storage allows StoryBooker to connect with an Storage service and upload/delete files from it.
