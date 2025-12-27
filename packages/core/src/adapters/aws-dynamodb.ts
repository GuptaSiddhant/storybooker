// oxlint-disable id-length

import * as Dynamo from "@aws-sdk/client-dynamodb";
import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "./_internal/database.ts";

/**
 * AWS DynamoDB implementation of the DatabaseAdapter interface.
 *
 * @classdesc
 * Provides database operations for StoryBooker using AWS DynamoDB as the backend.
 * Supports NoSQL tables and items with automatic error handling.
 *
 * @example
 * ```ts
 * import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
 * import { AwsDynamoDatabaseService } from "storybooker/aws-dynamodb";
 *
 * // Create DynamoDB client
 * const client = new DynamoDBClient({ region: "us-east-1" });
 * // Initialize the database adapter
 * const database = new AwsDynamoDatabaseService(client);
 * // Use the database adapter with StoryBooker
 * const router = createHonoRouter({ database });
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/dynamodb/ | AWS DynamoDB Documentation}
 */
export class AwsDynamoDatabaseService implements DatabaseAdapter {
  #client: Dynamo.DynamoDBClient;

  /**
   * Creates a new AWS DynamoDB database adapter instance.
   *
   * @param client - The authenticated DynamoDBClient instance for connecting to AWS DynamoDB
   *
   * @example
   * ```ts
   * import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
   * const client = new DynamoDBClient({ region: "us-east-1" });
   * const database = new AwsDynamoDatabaseService(client);
   * ```
   */
  constructor(client: Dynamo.DynamoDBClient) {
    this.#client = client;
  }

  get metadata(): DatabaseAdapter["metadata"] {
    return {
      name: "AWS DynamoDB",
      description: "NoSQL database using AWS DynamoDB tables and items.",
      id: this.#client.config.accountId?.toString(),
    };
  }

  listCollections: DatabaseAdapter["listCollections"] = async (options) => {
    const response = await this.#client.send(new Dynamo.ListTablesCommand({}), {
      abortSignal: options.abortSignal,
    });
    return response.TableNames ?? [];
  };

  createCollection: DatabaseAdapter["createCollection"] = async (collectionId, options) => {
    try {
      await this.#client.send(
        new Dynamo.CreateTableCommand({
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          BillingMode: "PAY_PER_REQUEST",
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          TableName: collectionId,
        }),
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId, error);
    }
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, options) => {
    try {
      const response = await this.#client.send(
        new Dynamo.DescribeTableCommand({ TableName: collectionId }),
        { abortSignal: options.abortSignal },
      );
      return Boolean(response.Table);
    } catch {
      return false;
    }
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (collectionId, options) => {
    try {
      await this.#client.send(new Dynamo.DeleteTableCommand({ TableName: collectionId }), {
        abortSignal: options.abortSignal,
      });
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
    }
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseAdapterOptions,
  ) => {
    const response = await this.#client.send(new Dynamo.ScanCommand({ TableName: collectionId }), {
      abortSignal: options.abortSignal,
    });
    return (response.Items ?? []).map((item) => {
      const doc: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(item)) {
        doc[key] = value.S ?? value.N ?? value.BOOL ?? value.NULL ?? value;
      }

      return doc as Document;
    });
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    options: DatabaseAdapterOptions,
  ): Promise<Document> => {
    try {
      const response = await this.#client.send(
        new Dynamo.GetItemCommand({
          Key: { id: { S: documentId } },
          TableName: collectionId,
        }),
        { abortSignal: options.abortSignal },
      );
      const document = response.Item
        ? (Object.fromEntries(
            Object.entries(response.Item).map(([key, value]) => [
              key,
              value.S ?? value.N ?? value.BOOL ?? value.NULL ?? value,
            ]),
          ) as Record<string, unknown>)
        : undefined;

      if (!document) {
        throw new Error("Document not found");
      }

      document["id"] = documentId;
      return document as Document;
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    try {
      await this.#client.send(
        new Dynamo.PutItemCommand({
          Item: Object.fromEntries(
            Object.entries(documentData).map(([key, value]) => [key, { S: String(value) }]),
          ),
          TableName: collectionId,
        }),
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(
        collectionId,
        documentData.id,
        error,
      );
    }
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, options) => {
    const response = await this.#client.send(
      new Dynamo.GetItemCommand({
        Key: { id: { S: documentId } },
        TableName: collectionId,
      }),
      { abortSignal: options.abortSignal },
    );
    return Boolean(response.Item);
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (collectionId, documentId, options) => {
    try {
      await this.#client.send(
        new Dynamo.DeleteItemCommand({
          Key: { id: { S: documentId } },
          TableName: collectionId,
        }),
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  // oxlint-disable-next-line max-params
  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
    options,
  ) => {
    const updateExpr: string[] = [];
    const exprAttrValues: Record<string, Dynamo.AttributeValue> = {};
    for (const [key, value] of Object.entries(documentData)) {
      updateExpr.push(`#${key} = :${key}`);
      exprAttrValues[`:${key}`] = { S: String(value) };
    }

    try {
      await this.#client.send(
        new Dynamo.UpdateItemCommand({
          ExpressionAttributeNames: Object.fromEntries(
            Object.keys(documentData).map((k) => [`#${k}`, k]),
          ),
          ExpressionAttributeValues: exprAttrValues,
          Key: { id: { S: documentId } },
          TableName: collectionId,
          UpdateExpression: `SET ${updateExpr.join(", ")}`,
        }),
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };
}
