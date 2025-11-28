// oxlint-disable id-length

import * as Dynamo from "@aws-sdk/client-dynamodb";
import type {
  DatabaseAdapter,
  DatabaseAdapterOptions,
  DatabaseDocumentListOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/adapter";

export class AwsDynamoDatabaseService implements DatabaseAdapter {
  #client: Dynamo.DynamoDBClient;

  constructor(client: Dynamo.DynamoDBClient) {
    this.#client = client;
  }

  listCollections: DatabaseAdapter["listCollections"] = async (options) => {
    const response = await this.#client.send(new Dynamo.ListTablesCommand({}), {
      abortSignal: options.abortSignal,
    });
    return response.TableNames ?? [];
  };

  createCollection: DatabaseAdapter["createCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#client.send(
      new Dynamo.CreateTableCommand({
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        BillingMode: "PAY_PER_REQUEST",
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        TableName: collectionId,
      }),
      { abortSignal: options.abortSignal },
    );
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (
    collectionId,
    options,
  ) => {
    try {
      const response = await this.#client.send(
        new Dynamo.DescribeTableCommand({ TableName: collectionId }),
        { abortSignal: options.abortSignal },
      );
      return !!response.Table;
    } catch {
      return false;
    }
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#client.send(
      new Dynamo.DeleteTableCommand({ TableName: collectionId }),
      { abortSignal: options.abortSignal },
    );
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseAdapterOptions,
  ) => {
    const response = await this.#client.send(
      new Dynamo.ScanCommand({ TableName: collectionId }),
      { abortSignal: options.abortSignal },
    );
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

    if (document) {
      document["id"] = documentId;
      return document as Document;
    }

    throw new Error(
      `Document with id ${documentId} not found in collection ${collectionId}`,
    );
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    await this.#client.send(
      new Dynamo.PutItemCommand({
        Item: Object.fromEntries(
          Object.entries(documentData).map(([key, value]) => [
            key,
            { S: String(value) },
          ]),
        ),
        TableName: collectionId,
      }),
      { abortSignal: options.abortSignal },
    );
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    const response = await this.#client.send(
      new Dynamo.GetItemCommand({
        Key: { id: { S: documentId } },
        TableName: collectionId,
      }),
      { abortSignal: options.abortSignal },
    );
    return !!response.Item;
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    await this.#client.send(
      new Dynamo.DeleteItemCommand({
        Key: { id: { S: documentId } },
        TableName: collectionId,
      }),
      { abortSignal: options.abortSignal },
    );
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
  };
}
