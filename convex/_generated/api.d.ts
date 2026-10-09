/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as answers from "../answers.js";
import type * as boxes from "../boxes.js";
import type * as invitationTokens from "../invitationTokens.js";
import type * as invitations from "../invitations.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_content from "../lib/content.js";
import type * as profiles from "../profiles.js";
import type * as questions from "../questions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  answers: typeof answers;
  boxes: typeof boxes;
  invitationTokens: typeof invitationTokens;
  invitations: typeof invitations;
  "lib/access": typeof lib_access;
  "lib/content": typeof lib_content;
  profiles: typeof profiles;
  questions: typeof questions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
