---
sidebar_position: 5
title: Lark Document Source Strategy
---

`LarkSourceStrategy` is mainly responsible for **document source loading logic**—fetching folders and document data from the Lark Docs API, and converting them into unified `Document` objects for use in **knowledge base / AI vectorization**.

Full code below (imports omitted):

```ts
@DocumentSourceStrategy(LarkName)
@Injectable()
export class LarkSourceStrategy implements IDocumentSourceStrategy<LarkDocumentsParams> {
  readonly permissions = [
    {
      type: 'integration',
      service: LarkName,
      description: 'Access to Lark system integrations'
    } as IntegrationPermission
  ]

  readonly meta: IDocumentSourceProvider = {
    name: LarkName,
    category: DocumentSourceProviderCategoryEnum.OnlineDocument,
    label: {
      en_US: 'Lark Documents',
      zh_Hans: '飞书文档'
    } as I18nObject,
    configSchema: {
      type: 'object',
      properties: {
        folderToken: {
          type: 'string',
          title: { en_US: 'Folder Token', zh_Hans: '文件夹 Token' },
          description: { en_US: 'The folder token to fetch documents from.', zh_Hans: '从中获取文档的文件夹 Token。' }
        },
        types: {
          type: 'array',
          title: { en_US: 'Document Types', zh_Hans: '文档类型' },
          description: { en_US: 'The types of document to fetch.', zh_Hans: '要获取的文档类型。' },
          default: ['docx'],
          items: {
            type: 'string',
            enum: ['doc', 'sheet', 'mindnote', 'bitable', 'file', 'docx', 'folder', 'shortcut']
          },
          uniqueItems: true,
          minItems: 0
        }
      },
      required: ['folderToken']
    },
    icon: {
      type: 'image',
      value: iconImage,
      color: '#4CAF50'
    }
  }

  async validateConfig(config: LarkDocumentsParams): Promise<void> {
    if (!config.folderToken) {
      throw new Error('Folder Token is required')
    }
  }

  test(config: LarkDocumentsParams): Promise<any> {
    throw new Error('Method not implemented.')
  }

  async loadDocuments(config: LarkDocumentsParams, context?: { integration: IIntegration }): Promise<Document[]> {
    const integration = context?.integration
    if (!integration) {
      throw new Error('Integration system is required')
    }

    await this.validateConfig(config)

    const client = new LarkClient(integration)
    const children = await client.listDriveFiles(config.folderToken)

    const documents: Document[] = children
      .filter((item) => config.types ? config.types.includes(item.type) : true)
      .map((item) => {
        return new Document({
          id: item.token,
          pageContent: `${item.name}\n${item.url}`,
          metadata: {
            ...item,
            chunkId: item.token,
            title: item.name,
            url: item.url,
            createdAt: item.created_time
          }
        })
      })

    return documents
  }

  async loadDocument?(document: Document, context: { integration?: IIntegration }): Promise<Document> {
    const integration = context?.integration
    if (!integration) {
      throw new Error('Integration system is required')
    }

    const client = new LarkClient(integration)
    const content = await client.getDocumentContent(document.id)

    return new Document({
      id: document.id,
      pageContent: content,
      metadata: {
        id: document.id,
        title: `Lark Document ${document.id}`
      }
    })
  }
}
```

---

## 1. Class Declaration & Decorators

```ts
@DocumentSourceStrategy(LarkName)
@Injectable()
export class LarkSourceStrategy implements IDocumentSourceStrategy<LarkDocumentsParams>
```

* **`@DocumentSourceStrategy(LarkName)`**  
  Registers this class as a **document source strategy** with provider name `LarkName` ("lark").  
  The Xpert AI system will automatically detect and invoke it.

* **`@Injectable()`**  
  Allows the class to be injected (standard NestJS usage).

* **Implements interface**: `IDocumentSourceStrategy<LarkDocumentsParams>`  
  Ensures the class provides required methods like `validateConfig`, `loadDocuments`, etc.

---

## 2. Permission Definition

```ts
readonly permissions = [
  {
    type: 'integration',
    service: LarkName,
    description: 'Access to Lark system integrations'
  } as IntegrationPermission
]
```

Explanation:

* The plugin requires **access to Lark integration info** (AppID, Secret, etc.) at runtime.
* The system checks if the user has authorized the plugin to access Lark.

---

## 3. Metadata Definition

```ts
readonly meta: IDocumentSourceProvider = {
  name: LarkName,
  category: DocumentSourceProviderCategoryEnum.OnlineDocument,
  label: { en_US: 'Lark Documents', zh_Hans: '飞书文档' },
  configSchema: { ... },
  icon: { type: 'image', value: iconImage, color: '#4CAF50' }
}
```

* **name/category**: Identifies this as an **online document source**.
* **label**: UI display name (English/Chinese).
* **configSchema**: Defines user-configurable parameters:
  * `folderToken`: Folder token (required).
  * `types`: Array of document types to load, default is `docx`.
* **icon**: Plugin icon for UI display.

---

## 4. Config Validation

```ts
async validateConfig(config: LarkDocumentsParams): Promise<void> {
  if (!config.folderToken) {
    throw new Error('Folder Token is required')
  }
}
```

* Checks if `folderToken` is present.
* Throws an error if the folder token is not configured.

---

## 5. Document Loading Method

```ts
async loadDocuments(config: LarkDocumentsParams, context?: { integration: IIntegration }): Promise<Document[]> {
  const integration = context?.integration
  if (!integration) {
    throw new Error('Integration system is required')
  }

  await this.validateConfig(config)

  const client = new LarkClient(integration)
  const children = await client.listDriveFiles(config.folderToken)

  const documents: Document[] = children
    .filter((item) => config.types ? config.types.includes(item.type) : true)
    .map((item) => {
      return new Document({
        id: item.token,
        pageContent: `${item.name}\n${item.url}`,
        metadata: {
          ...item,
          chunkId: item.token,
          title: item.name,
          url: item.url,
          createdAt: item.created_time
        }
      })
    })

  return documents
}
```

Logic steps:

1. Check for integration info; throw error if missing.
2. Validate config (must have `folderToken`).
3. Initialize `LarkClient`, call `listDriveFiles(folderToken)` to get folder contents.
4. Filter documents by `types`.
5. Convert each document to a **LangChain `Document` object**:
   * `id`: document token
   * `pageContent`: document title and URL
   * `metadata`: extra info (token, title, url, creation time)

> ✅ The output is a list of documents, each containing **basic info and link only**.

---

## 6. Single Document Loading

```ts
async loadDocument?(document: Document, context: { integration?: IIntegration }): Promise<Document> {
  const integration = context?.integration
  if (!integration) {
    throw new Error('Integration system is required')
  }

  const client = new LarkClient(integration)
  const content = await client.getDocumentContent(document.id)

  return new Document({
    id: document.id,
    pageContent: content,
    metadata: {
      id: document.id,
      title: `Lark Document ${document.id}`
    }
  })
}
```

Purpose:

* Further **loads the full content of a single document** when needed.
* Uses `getDocumentContent(docToken)` to fetch the complete document content.
* Returns a new `Document` object with `pageContent` as the document body.

---

## 7. Design Summary

* **`permissions`**: Declares dependency on Lark integration permissions.
* **`meta`**: Provides UI config schema, defines folderToken and document types input.
* **`validateConfig`**: Ensures config is valid.
* **`loadDocuments`**: Gets document list from folder, generates document summary.
* **`loadDocument`**: Loads full content of a single document as needed.

The overall logic converts **Lark Drive API** data structures into **LangChain Document objects**, preparing them for downstream AI knowledge base processing.
