---
sidebar_position: 11
title: Schema UI Extension Specification
---

:::tip
Design a universal schema UI extension specification
:::

👌 Sure, let me help you design a **universal Schema UI extension specification** that can be applied to all configuration schemas in your plugin system, enabling unified rules for frontend rendering.

---

Extend JSON Schema with a reserved field:

```json
"x-ui": { ... }
```

The frontend UI renderer determines which component to use, how to display, and how to handle dynamic linkage based on the contents of `x-ui`.

---

## 1. Basic Fields

| Field Name      | Type   | Description                                                                                                                      |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `component`     | string | Specifies the UI component type, e.g. `textInput`, `textarea`, `select`, `switch`, `slider`, `promptEditor`, `modelProviderSelect`, `modelSelect` |
| `label`         | string | Label displayed in the UI                                                                                                       |
| `description`   | string | Help text for the UI, overrides schema.description if present                                                                   |
| `placeholder`   | string | Input placeholder                                                                                                               |
| `defaultValue`  | any    | Default value, overrides schema.default if present                                                                             |
| `order`         | number | Display order in the UI                                                                                                         |

---

## 2. Data Source Related

| Field Name      | Type   | Description                                                         |
| --------------- | ------ | ------------------------------------------------------------------- |
| `options`       | array  | Static options (dropdown, checkbox, etc.), e.g. `[{ label: 'OpenAI', value: 'openai' }]` |
| `dataSource`    | string | Dynamic options source identifier, e.g. `"system.providers"`, `"system.models"` |
| `dependency`    | string | Depends on another field's value to filter options, e.g. `"provider"` |
| `mapping`       | object | Mapping, e.g. `{ label: 'name', value: 'id' }`                      |

---

## 3. Validation & Interaction

| Field Name      | Type    | Description                                         |
| --------------- | ------- | -------------------------------------------------- |
| `required`      | boolean | Required (overrides schema.required)                |
| `visibleWhen`   | object  | Conditional rendering, e.g. `{ provider: 'openai' }`|
| `enabledWhen`   | object  | Conditional enabling, e.g. `{ useCustomPrompt: true }`|
| `maxLength`     | number  | Maximum input length                                |
| `minLength`     | number  | Minimum input length                                |
| `regex`         | string  | Custom regex validation rule                        |

---

## 4. Special Component Conventions

### `modelProviderSelect`

* Used to select model providers (OpenAI, Anthropic, Azure, Ollama, etc.)
* `dataSource = "system.providers"`

### `modelSelect`

* Used to select specific models
* Depends on `provider`
* `dataSource = "system.models"`
* `dependency = "provider"`

### `promptEditor`

* Used to edit prompts, supports multiline, syntax highlighting, variable interpolation

### `jsonEditor`

* Used to edit JSON objects, with format validation

### `codeEditor`

* Used to edit code (supports language highlighting, e.g. js, ts, python)

---

## 5. Example Schema

```ts
configSchema: {
  type: 'object',
  properties: {
    provider: {
      type: 'string',
      description: 'Model provider',
      enum: ['openai', 'anthropic', 'azure', 'ollama'],
      'x-ui': {
        component: 'modelProviderSelect',
        label: 'Provider',
        order: 1,
        dataSource: 'system.providers'
      }
    },
    model: {
      type: 'string',
      description: 'Model name',
      default: 'gpt-4-vision-preview',
      'x-ui': {
        component: 'modelSelect',
        label: 'Model',
        order: 2,
        dependency: 'provider',
        dataSource: 'system.models'
      }
    },
    prompt: {
      type: 'string',
      default: 'Describe this image in detail.',
      description: 'Prompt',
      'x-ui': {
        component: 'promptEditor',
        label: 'Prompt',
        order: 3,
        placeholder: 'Enter prompt, you can use {{variables}} placeholders'
      }
    },
    temperature: {
      type: 'number',
      default: 0.7,
      'x-ui': {
        component: 'slider',
        label: 'Temperature',
        order: 4,
        min: 0,
        max: 1,
        step: 0.1
      }
    },
    advanced: {
      type: 'object',
      'x-ui': {
        component: 'jsonEditor',
        label: 'Advanced Config',
        order: 5,
        visibleWhen: { provider: 'openai' }
      }
    }
  },
  required: ['provider', 'model']
}
```

---

With this approach:

* The frontend UI renderer only needs to recognize `x-ui.component`, with other logic driven by the `x-ui` field.
* Plugin developers only need to write the schema to automatically get an intelligent configuration experience.
* Highly extensible, can be adapted for future Embedding, OCR, VLM, VectorStore plugins.

## How to represent SECRET input fields

Great question 👍, **SECRET type fields** (such as API Key, Token, password) need special handling in the schema UI:

1. **Frontend should render as a password input** (`type="password"` or masked).
2. **Storage should distinguish**: do not display the original value, use `"******"` or empty value as a placeholder.
3. **Schema can explicitly mark** so the frontend UI renderer knows it's a secret field.

---

## Extension Specification Solution

Add `component: "secretInput"` in `x-ui`, supporting the following properties:

| Field Name      | Type    | Description                          |
| --------------- | ------- | ------------------------------------ |
| `component`     | string  | Fixed as `"secretInput"`, renders password input |
| `label`         | string  | Field label                          |
| `description`   | string  | Field description                    |
| `placeholder`   | string  | Placeholder (e.g. `Enter API Key`)   |
| `revealable`    | boolean | Whether to allow user to temporarily view plaintext |
| `maskSymbol`    | string  | Mask symbol (default `*`)            |
| `persist`       | boolean | Whether to persist, false means runtime only, not saved |

---

## Example Schema

```ts
configSchema: {
  type: 'object',
  properties: {
    apiKey: {
      type: 'string',
      description: 'OpenAI API Key',
      'x-ui': {
        component: 'secretInput',
        label: 'API Key',
        placeholder: 'Enter your OpenAI API Key',
        revealable: true,
        maskSymbol: '*',
        persist: true
      }
    },
    provider: {
      type: 'string',
      enum: ['openai', 'anthropic', 'azure'],
      'x-ui': {
        component: 'modelProviderSelect',
        label: 'Provider'
      }
    }
  },
  required: ['apiKey', 'provider']
}
```

---

## Frontend Rendering Effect

* `apiKey` is displayed as a **password input**, masked by default.
* If `revealable: true`, there is an 👁 button to toggle show/hide.
* When editing configuration, if the backend returns `"******"` it means a value exists; if unchanged, the original value is used.

---

## Additional Security Considerations

* When submitting the form, if `apiKey === "******"`, keep the old value on the backend.
* If a new value is submitted, the backend replaces the old value.
* When exporting configuration or logging, skip SECRET fields.

---

Would you like me to further abstract the **SECRET field** into a generic interface (e.g. `ISchemaSecretField`) to clearly distinguish it from regular fields?

## Abstract as a Generic Interface

👌 Sure, let's abstract the **SECRET field** into a generic interface, so it's consistent with regular fields but clearly marked as sensitive.

---

# 🔐 Generic Interface Design

```ts
/**
 * Generic UI Schema Field Definition
 */
export interface ISchemaUIBase {
  component: string;       // UI component type
  label?: string;          // Field label
  description?: string;    // Field description
  placeholder?: string;    // Input placeholder
  order?: number;          // UI display order
  required?: boolean;      // Required
  visibleWhen?: Record<string, any>; // Conditional rendering
  enabledWhen?: Record<string, any>; // Conditional enabling
}

/**
 * Secret Field Extension
 */
export interface ISchemaSecretField extends ISchemaUIBase {
  component: 'secretInput';   // Fixed component type
  revealable?: boolean;       // Allow plaintext display (👁 button)
  maskSymbol?: string;        // Mask symbol (default *)
  persist?: boolean;          // Persist or runtime only
}
```

This way, SECRET fields inherit the same specification as regular UI fields, with **additional properties for sensitive information handling**.

---

# 🔧 Usage Example

```ts
configSchema: {
  type: 'object',
  properties: {
    apiKey: {
      type: 'string',
      description: 'OpenAI API Key',
      'x-ui': <ISchemaSecretField>{
        component: 'secretInput',
        label: 'API Key',
        placeholder: 'Enter your OpenAI API Key',
        revealable: true,
        maskSymbol: '*',
        persist: true
      }
    },
    provider: {
      type: 'string',
      enum: ['openai', 'anthropic', 'azure'],
      'x-ui': {
        component: 'modelProviderSelect',
        label: 'Provider'
      }
    }
  },
  required: ['apiKey', 'provider']
}
```

---

# 🔒 Frontend Handling Specification

1. **Rendering**:

   * `secretInput` renders as a password field (`type=password`).
   * If `revealable: true`, add 👁 toggle button.

2. **Loading Configuration**:

   * Backend returns `******` to indicate a value exists, frontend does not show the real value.

3. **Saving Configuration**:

   * If the submitted value is still `******` → keep the old value.
   * If a new value is submitted → update and overwrite the old value.

4. **Export/Logging**:

   * Ignore SECRET fields or output `******` to avoid leaks.

---

Now `secretInput` is a **first-class UI component**, just like `textInput` or `select`, and can be uniformly driven by the schema.

Would you like me to define a **complete ISchemaUIComponent union type** to standardize all `x-ui` components (select, slider, secretInput, promptEditor, etc.)?
