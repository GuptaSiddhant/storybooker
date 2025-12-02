import type { LoggerAdapter } from "./logger";

/**
 * Service adapter to interact with queueing service.
 *
 * @description
 * The adapter should provide callbacks to perform operations
 * to an existing queue like send and receive messages.
 *
 * - `topic`: A topic/queue to hold messages.
 * - `message`: A single message in topic which contains data and metadata.
 *    Each message has a unique identifier.
 */
export interface QueueAdapter {
  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws if an error occur during initialisation.
   */
  init?: (options: QueueAdapterOptions) => Promise<void>;

  // Topics (message queues)

  /**
   * List all topics available in the queue service.
   * @param options Common options like abortSignal.
   * @returns A list of names/IDs of the topics.
   * @throws If the queue service is not connected.
   */
  listTopics: (options: QueueAdapterOptions) => Promise<string[]>;

  /**
   * Create a topic used for different message types.
   * @param topicId ID of the topic
   * @param options Common options like abortSignal.
   * @throws if topic with ID already exists.
   */
  createTopic: (topicId: string, options: QueueAdapterOptions) => Promise<void>;

  /**
   * Delete an existing topic.
   * @param topicId ID of the topic
   * @param options Common options like abortSignal.
   * @throws if topic with ID does not exist.
   */
  deleteTopic: (topicId: string, options: QueueAdapterOptions) => Promise<void>;

  /**
   * Check if topic exists.
   * @param topicId ID of the topic
   * @param options Common options like abortSignal.
   * @returns if topic is available or not
   * @throws never.
   */
  hasTopic: (topicId: string, options: QueueAdapterOptions) => Promise<boolean>;

  // Messages

  /**
   * Send a message to the specified topic.
   * @param topicId ID of the topic
   * @param message Message data to be sent
   * @param options Common options like abortSignal.
   * @returns Message ID if successful
   * @throws if the topic does not exist.
   */
  sendMessage: <Message extends StoryBookerQueueMessage>(
    topicId: string,
    message: Omit<Message, "id" | "timestamp">,
    options: QueueAdapterOptions,
  ) => Promise<string>;

  /**
   * Receive messages from the specified topic.
   * @param topicId ID of the topic
   * @param receiveOptions Options to configure message receiving
   * @param options Common options like abortSignal.
   * @returns List of messages
   * @throws if the topic does not exist.
   */
  receiveMessages: <Message extends StoryBookerQueueMessage>(
    topicId: string,
    receiveOptions: QueueMessageReceiveOptions,
    options: QueueAdapterOptions,
  ) => Promise<Message[]>;

  /**
   * Acknowledge that a message has been processed.
   * @param topicId ID of the topic
   * @param messageId ID of the message
   * @param options Common options like abortSignal.
   * @throws if the topic or message does not exist.
   */
  acknowledgeMessage: (
    topicId: string,
    messageId: string,
    options: QueueAdapterOptions,
  ) => Promise<void>;

  /**
   * Get message count in a topic.
   * @param topicId ID of the topic
   * @param options Common options like abortSignal.
   * @returns Number of messages in the topic
   * @throws if the topic does not exist.
   */
  getMessageCount: (topicId: string, options: QueueAdapterOptions) => Promise<number>;

  /**
   * Purge all messages from a topic.
   * @param topicId ID of the topic
   * @param options Common options like abortSignal.
   * @throws if the topic does not exist.
   */
  purgeMessages: (topicId: string, options: QueueAdapterOptions) => Promise<void>;
}

/**
 * Base Message shape used in StoryBooker Queue.
 * Should always contain fields 'id' and 'timestamp'.
 */
export interface StoryBookerQueueMessage {
  id: string;
  timestamp: number;
  data: Record<string, unknown>;
  attributes?: Record<string, string>;
}

/** Common Queue adapter options. */
export interface QueueAdapterOptions {
  /** A signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Logger */
  logger: LoggerAdapter;
}

export interface QueueMessageReceiveOptions {
  /** Maximum number of messages to receive */
  maxMessages?: number;
  /** Visibility timeout in seconds */
  visibilityTimeout?: number;
  /** Wait time for long polling in seconds */
  waitTimeSeconds?: number;
}
