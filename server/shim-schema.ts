/**
 * Compatibility shim: routes import tables from "../../shared/schema".
 * We override that path using tsconfig path aliases so they land here instead,
 * getting PostgreSQL tables.
 */

export * from "../shared/schema";
