import { MongoClient, ObjectId, type Collection } from "mongodb";

const DEFAULT_URI =
  "mongodb://admin:adminpassword@localhost:27017/?authSource=admin";
const DEFAULT_DB = "qianfan-ai-workflow";
const DEFAULT_COLLECTION = "workflows";

type WorkflowFileEntry = {
  path: string;
  content: string;
  id?: string;           // 工作流ID
  artifact_id?: string;  // 制品ID
  name?: string;         // 工作流名称
  desc?: string;         // 工作流描述
};

export type WorkflowDocument = {
  _id?: ObjectId;
  name: string;
  entryPath: string;
  files: WorkflowFileEntry[];
  createdAt: Date;
  updatedAt: Date;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || DEFAULT_URI;
const dbName = process.env.MONGODB_DB || DEFAULT_DB;
const collectionName =
  process.env.MONGODB_COLLECTION || DEFAULT_COLLECTION;

const client = new MongoClient(uri);
const clientPromise =
  global._mongoClientPromise || client.connect();

if (!global._mongoClientPromise) {
  global._mongoClientPromise = clientPromise;
}

export async function getWorkflowsCollection(): Promise<
  Collection<WorkflowDocument>
> {
  const mongoClient = await clientPromise;
  return mongoClient.db(dbName).collection(collectionName);
}

export function toObjectId(id: string | ObjectId) {
  return typeof id === "string" ? new ObjectId(id) : id;
}

export function isValidObjectId(id: string | ObjectId) {
  return ObjectId.isValid(id);
}

export function serializeWorkflow(
  doc: WorkflowDocument & { _id?: ObjectId },
) {
  const { _id, ...rest } = doc;
  return {
    id: _id ? _id.toString() : "",
    ...rest,
  };
}
