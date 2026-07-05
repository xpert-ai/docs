---
title: Tenant and Organization Membership Plan Design
sidebar_position: 6
tags:
  - Membership
  - Copilot
  - Tenant
  - Organization
---

## Background

Xpert supports AI capability configuration at both tenant and organization scope:

- A tenant can provide shared Copilot models as the platform-wide default AI capability.
- An organization can configure its own Copilot models to meet model, cost, compliance, or private deployment needs.
- When users work inside an organization through AI Assistant, ClawXpert, Workspace Assistant, or other Copilot capabilities, the product must clearly decide which membership plan controls quota, rate limits, and usage reporting.

If model availability is determined only by whether the current organization has configured Copilot models, several product issues appear:

- An organization may have local models but no initialized organization membership plan, which can lead to scope mismatch errors.
- After an organization removes the tenant plan and intends to manage AI on its own, model lists and chat may still behave according to tenant fallback rules.
- Usage can be recorded under the wrong scope, making Usage Overview and Usage & Billing hard to explain.
- The product cannot clearly distinguish between tenant-provided AI and organization-managed AI cost ownership.

Membership plan should therefore be the single decision center for Copilot model availability, limits, and usage ownership.

## Product Goals

### Goals

- Define the boundary between tenant membership plans and organization membership plans.
- Let organizations move smoothly between inheriting tenant AI capability and managing AI capability themselves.
- Automatically initialize organization membership when an organization enables local Copilot models, so users are not blocked by technical setup gaps.
- Make quota limits, rate limits, usage ledger records, and usage overview all belong to an explainable scope.
- Support unlimited plans for organization-owned models or internal cost scenarios where total point quota is not needed.

### Non-goals

- Do not stack tenant and organization plans for the same usage event.
- Do not allow organization membership to limit tenant copilots, and do not allow tenant membership to directly limit organization copilots.
- Do not introduce plan selection interactions in the user chat flow.
- Do not introduce payment, subscription renewal, or invoicing in this design.

## Core Concepts

| Concept | Description |
| --- | --- |
| Tenant membership plan | A tenant-scope plan that controls tenant-provided Copilot models. |
| Organization membership plan | An organization-scope plan that controls Copilot models owned by the current organization. |
| Effective membership scope | The membership scope resolved for the current request. It decides available models, limits, and ledger ownership. |
| Tenant copilot | A Copilot model with `organizationId = null`, provided by the tenant. |
| Organization copilot | A Copilot model with `organizationId = current organization ID`, provided by the organization. |
| Billable user | The user whose membership is checked and recorded. Normal chat uses the current user; xpert usage can resolve to the xpert creator. |
| Unlimited plan | A plan with `includedPoints = null`. It has no total point cap, but usage is still recorded and explicit rate limits still apply. |

## Product Modes

### 1. Tenant-Provided Mode

Use this mode when:

- A new tenant should quickly provide shared AI capability to all organizations.
- The platform team manages model providers and Copilot models centrally.
- Organizations do not need custom models or independent AI cost ownership.

Product behavior:

- Tenant admins configure membership plans in tenant scope.
- New users receive tenant-scope membership by default.
- If an organization has no active organization membership plan, organization users fall back to tenant membership.
- Users see only enabled tenant-scope Copilot models.
- Chat usage and ledger records are written to tenant membership.

### 2. Organization-Managed Mode

Use this mode when:

- Organization admins configure their own model providers or Copilot models.
- The organization wants to control model availability, quota, rate limits, and usage reporting.
- The organization wants to remove tenant-wide quota limits and use its own unlimited or fixed-quota plan.

Product behavior:

- As soon as the current organization has an active organization membership plan, it enters organization-managed mode.
- Organization requests prefer organization membership and no longer fall back to tenant membership.
- Users see only enabled Copilot models in the current organization scope.
- Chat usage and ledger records are written to organization membership.
- If the organization has no enabled local copilots, the model list is empty even when an organization plan exists; it does not fall back to tenant models.

### 3. Local Model Self-Healing Mode

Use this mode when:

- Legacy data has local Copilot models in an organization, but no initialized organization membership plan.
- An organization admin removed the tenant membership plan during onboarding or settings and intends to use organization-managed AI.
- A user has already opened ClawXpert or AI Assistant inside the organization and started chatting.

Product behavior:

- If the system finds enabled local Copilot models in organization scope and no organization membership plan, it performs one idempotent initialization.
- Initialization creates a default unlimited organization plan and assigns membership to all active organization members.
- After initialization, only organization Copilot models are returned.
- Future chat, limits, and ledger records belong to organization scope.

## Scope Resolution Rules

### Organization Requests

For organization-scope requests, resolve effective membership in this order:

1. Look for active membership in the current organization scope.
2. If found, use organization membership.
3. If the organization has an active membership plan but the current user has no membership, reject usage and do not fall back to tenant.
4. If the organization has no active membership plan, look for tenant-scope membership.
5. If found, use tenant membership.
6. If neither exists, return no available models and block chat.

### Tenant Requests

Tenant-scope requests only use tenant membership:

1. Look for active tenant-scope membership.
2. If found, use tenant membership.
3. If not found, return no available models and block chat.

### Copilot Model Scope Validation

The effective membership scope must match the Copilot model scope:

| Request scope | Effective membership | Copilot model | Result |
| --- | --- | --- | --- |
| tenant | tenant | tenant copilot | Allowed |
| tenant | tenant | organization copilot | Rejected |
| organization | tenant fallback | tenant copilot | Allowed |
| organization | tenant fallback | organization copilot | Self-heal or reject |
| organization | organization | organization copilot | Allowed |
| organization | organization | tenant copilot | Rejected |

This rule keeps the product principle simple: the scope that provides the model is the scope whose membership plan controls limits and usage.

## Plan Initialization Design

### Default Organization Plan

When organization membership is initialized manually or through self-healing, the default plan is:

```ts
{
  code: 'default-unlimited',
  name: 'Default Unlimited',
  includedPoints: null,
  tokensPerPoint: 1000,
  isDefault: true,
  status: 'active'
}
```

Product meaning:

- The organization starts in unlimited mode, so organization-owned models are not accidentally blocked by total point quota.
- `tokensPerPoint` is still kept for usage ledger, reporting, and future cost conversion.
- Organization admins can later change unlimited to a fixed quota plan.

### Initialization Strategy

Initialization must be idempotent:

- If an active default plan exists, use it.
- If active plans exist but none is default, mark the first active plan as default.
- If only an archived `default-unlimited` exists, reactivate it and make it default.
- If no usable plan exists, create a new `default-unlimited` plan.
- Create active `UserMembership` records for all active `UserOrganization` members in the current organization.
- Do not overwrite members who already have active membership.
- For unlimited assignment ledger records, use `pointsDelta = 0`.

### Manual Initialization and Repair

The organization membership page provides two product actions:

- **Initialize organization membership**: used when the organization has no plan.
- **Repair assignments**: used when plans exist but member assignments are incomplete.

Both actions call the same idempotent initialization capability.

## Usage and Limits

### Point Limits

For normal plans:

- `includedPoints` is the total point quota for the current cycle.
- Model usage converts tokens to points by token count and multiplier.
- If remaining points are less than or equal to zero, usage is rejected.

For unlimited plans:

- `includedPoints = null`.
- Total point-limit checks are skipped.
- Points used for each call are still calculated.
- Usage ledger records are still written.
- Explicit `rateLimits` still apply.

### Rate Limits

Rate limits are independent from unlimited plans:

- Unlimited only means there is no total point cap.
- If the plan defines rate limits by hour, day, week, cycle, provider, or model, those limits still apply.
- This lets an organization use an unlimited plan while still throttling specific models or high-cost providers.

### Ledger Ownership

Ledger records must be written to the effective membership scope:

- Tenant copilot usage writes to tenant membership ledger.
- Organization copilot usage writes to membership ledger in the same organization.
- If scopes do not match, no ledger is written and usage is rejected.

Usage Overview and Usage & Billing show usage for the current effective membership.

## Page and User Experience

### Settings Entry

`/settings/membership` is a dual-scope page:

- Tenant scope shows tenant membership plans.
- Organization scope shows organization membership plans.
- Access uses `MEMBERSHIP_EDIT`.
- Organization local admins can access the organization membership page when they have this permission.

### Page Information Architecture

The page header shows current scope status:

| Information | Tenant scope | Organization scope |
| --- | --- | --- |
| Current scope | Tenant membership | Organization membership |
| Active plans | Shown | Shown |
| Default plan | Shown | Shown |
| Active members | Hidden | Shown |
| Assigned members | Hidden | Shown |
| Local copilots | Hidden | Shown |
| Initialize action | Hidden | Shown when not initialized |
| Repair action | Hidden | Shown when assignments are incomplete |

### Empty States

When organization scope has no plan:

- If the organization has no local copilots, explain that it is still inheriting tenant AI capability and can initialize organization membership when it wants to manage AI itself.
- If the organization already has local copilots, show an initialization call to action and explain that initialization creates a default unlimited plan and member memberships.

### Plan Editing

The plan catalog and editor continue to support:

- Creating plans.
- Editing plans.
- Setting the default plan.
- Archiving plans.
- Configuring `includedPoints`.
- Enabling unlimited mode by saving `includedPoints = null`.
- Configuring `tokensPerPoint`, model multipliers, and rate limits.

## User Journeys

### New Tenant Fast Start

1. Tenant admin configures tenant Copilot models.
2. Tenant admin configures a tenant default membership plan.
3. New users receive tenant membership.
4. Users enter organizations. If the organization has no organization plan, they use tenant models.
5. Usage is recorded under tenant membership.

### Organization Switches to Managed Mode

1. Organization admin enters organization scope.
2. Admin configures organization-owned Copilot models.
3. Admin opens Settings / Membership.
4. Admin clicks Initialize organization membership.
5. The system creates a default unlimited plan and assigns membership to active members.
6. Organization users see only organization Copilot models.
7. Usage is recorded under organization membership.

### Legacy Data Self-Healing

1. An organization already has enabled local Copilot models but no organization plan.
2. A user opens ClawXpert or requests the model list.
3. The system detects local models and performs idempotent initialization.
4. The model list returns organization models.
5. Chat succeeds and the ledger is written to organization membership.

### New Member Joins an Organization-Managed Organization

1. A new user joins the organization.
2. User bootstrap runs.
3. If the organization already has an active membership plan, the user receives active membership.
4. If the organization has no active plan, no membership plan is created.

## Permission Design

| Action | Permission |
| --- | --- |
| View membership page | `MEMBERSHIP_EDIT` |
| Initialize organization membership | `MEMBERSHIP_EDIT` |
| Repair member assignments | `MEMBERSHIP_EDIT` |
| Create, edit, or archive plans | `MEMBERSHIP_EDIT` |
| Manually assign a plan to a user | `MEMBERSHIP_EDIT` |
| View personal usage overview | Current signed-in user |

Tenant admins usually manage tenant plans in tenant scope.

Organization local admins manage organization plans in organization scope.

## Boundaries and Exceptions

### Organization Has a Plan but No Local Copilots

Return an empty model list and do not fall back to tenant.

Product meaning: the organization has chosen managed mode, but no usable model has been configured yet.

### Organization Has Local Copilots but No Plan

Trigger initialization self-healing.

Product meaning: local Copilot configuration is treated as organization-managed intent, and the system fills in the default membership setup.

### User Has No Assignment

If the organization has an active plan but the user has no active membership, usage is rejected.

Admins can use Repair assignments or user management to assign a plan.

### Tenant Membership and Organization Membership Both Exist

Organization-scope requests always prefer organization membership.

Tenant membership allows tenant copilot usage only when the current organization has no active organization plan.

### Plan Deletion or Archiving

If the default plan is archived, the organization may enter a needs-repair state.

Admins should set another active default plan or run repair.

## Product Copy Recommendations

### Initialization Copy

> After organization membership is initialized, this organization will use its own membership plans and Copilot models. The system will create a default unlimited plan and assign membership to current active members.

### Repair Copy

> Some organization members do not have membership assignments. Repair will assign the current default plan to missing members without overwriting existing memberships.

### Scope Mismatch Copy

> This Copilot model is not available for the current membership plan. Switch to a model in the matching scope or ask an admin to review membership and model configuration.

### No Available Model Copy

> No Copilot model is available under the current membership plan. Ask an admin to configure models or check the membership plan.

## Acceptance Criteria

- If an organization has no plan but the user has tenant membership, organization users can use tenant models.
- If an organization has an active plan, organization users use only organization models and do not fall back to tenant.
- If an organization has local models but no plan, the first model lookup or chat initializes a default unlimited plan.
- After initialization, all active organization members receive membership.
- Repeated initialization does not create duplicate plans, memberships, or assignment ledger records.
- Unlimited plans do not trigger total point-limit failures, but usage ledger and rate limits still work.
- Tenant copilots cannot be used by organization membership.
- Organization copilots cannot be directly used by tenant membership, unless current-organization self-healing runs and switches usage to organization membership.
- The organization membership page is visible to organization local admins with `MEMBERSHIP_EDIT`.
- Usage Overview and Usage & Billing show usage for the current effective membership.

## Future Improvements

- Let organization admins choose fixed quota or unlimited mode during initialization.
- Support cloning a tenant plan into an organization plan.
- Add clearer membership health checks, such as missing plan, missing default, missing assignment, or no local models.
- Show estimated cost by provider and model, not only points.
- Connect plan lifecycle to real subscription and payment systems.
