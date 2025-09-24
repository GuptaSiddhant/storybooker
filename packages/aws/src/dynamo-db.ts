import {
  CreateTableCommand,
  DeleteItemCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  ListTablesCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import type {
  DatabaseDocumentListOptions,
  DatabaseService,
  DatabaseServiceOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/types";

export class AwsDynamoDatabaseService implements DatabaseService {
  #client: DynamoDBClient;

  constructor(config: DynamoDBClientConfig) {
    this.#client = new DynamoDBClient(config);
  }

  listCollections: DatabaseService["listCollections"] = async (options) => {
    const response = await this.#client.send(new ListTablesCommand({}), {
      abortSignal: options.abortSignal,
    });
    return response.TableNames ?? [];
  };

  createCollection: DatabaseService["createCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#client.send(
      new CreateTableCommand({
        TableName: collectionId,
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST",
      }),
      { abortSignal: options.abortSignal },
    );
  };

  hasCollection: DatabaseService["hasCollection"] = async (
    collectionId,
    options,
  ) => {
    try {
      const response = await this.#client.send(
        new DescribeTableCommand({ TableName: collectionId }),
        { abortSignal: options.abortSignal },
      );
      return !!response.Table;
    } catch {
      return false;
    }
  };

  deleteCollection: DatabaseService["deleteCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#client.send(
      new DeleteTableCommand({ TableName: collectionId }),
      { abortSignal: options.abortSignal },
    );
  };

  listDocuments: DatabaseService["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseServiceOptions,
  ) => {
    const response = await this.#client.send(
      new ScanCommand({ TableName: collectionId }),
      { abortSignal: options.abortSignal },
    );
    return (response.Items ?? []).map((item) => {
      const doc: any = {};
      Object.entries(item).forEach(([key, value]) => {
        doc[key] = value.S ?? value.N ?? value.BOOL ?? value.NULL ?? value;
      });
      return doc as Document;
    });
  };

  getDocument: DatabaseService["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    options: DatabaseServiceOptions,
  ): Promise<Document> => {
    const response = await this.#client.send(
      new GetItemCommand({
        TableName: collectionId,
        Key: { id: { S: documentId } },
      }),
      { abortSignal: options.abortSignal },
    );
    const document = response.Item
      ? (Object.fromEntries(
          Object.entries(response.Item).map(([k, v]) => [
            k,
            v.S ?? v.N ?? v.BOOL ?? v.NULL ?? v,
          ]),
        ) as Record<string, unknown>)
      : undefined;

    if (document) {
      document["id"] = documentId;
      return document as Document;
    }

    throw new Error(
      `Document with id ${documentId} not found in collection ${collectionId}`,
    );
  };

  createDocument: DatabaseService["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    await this.#client.send(
      new PutItemCommand({
        TableName: collectionId,
        Item: Object.fromEntries(
          Object.entries(documentData).map(([k, v]) => [k, { S: String(v) }]),
        ),
      }),
      { abortSignal: options.abortSignal },
    );
  };

  hasDocument: DatabaseService["hasDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    const response = await this.#client.send(
      new GetItemCommand({
        TableName: collectionId,
        Key: { id: { S: documentId } },
      }),
      { abortSignal: options.abortSignal },
    );
    return !!response.Item;
  };

  deleteDocument: DatabaseService["deleteDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    await this.#client.send(
      new DeleteItemCommand({
        TableName: collectionId,
        Key: { id: { S: documentId } },
      }),
      { abortSignal: options.abortSignal },
    );
  };

  updateDocument: DatabaseService["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
    options,
  ) => {
    const updateExpr: string[] = [];
    const exprAttrValues: Record<string, any> = {};
    Object.entries(documentData).forEach(([key, value]) => {
      updateExpr.push(`#${key} = :${key}`);
      exprAttrValues[`:${key}`] = { S: String(value) };
    });
    await this.#client.send(
      new UpdateItemCommand({
        TableName: collectionId,
        Key: { id: { S: documentId } },
        UpdateExpression: `SET ${updateExpr.join(", ")}`,
        ExpressionAttributeNames: Object.fromEntries(
          Object.keys(documentData).map((k) => [`#${k}`, k]),
        ),
        ExpressionAttributeValues: exprAttrValues,
      }),
      { abortSignal: options.abortSignal },
    );
  };
}
