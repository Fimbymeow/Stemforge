import assert from "node:assert/strict";
import test from "node:test";
import { getAuthFeatureConfiguration, isAuthFeatureAvailable } from "../lib/auth/config";

test("authentication is disabled by default", () => {
  assert.deepEqual(getAuthFeatureConfiguration({}), { status: "disabled" });
  assert.equal(isAuthFeatureAvailable({}), false);
});

test("enabled authentication reports missing configuration without throwing", () => {
  const config = getAuthFeatureConfiguration({ STEMFORGE_AUTH_ENABLED: "true" });
  assert.equal(config.status, "misconfigured");
  assert.equal(isAuthFeatureAvailable({ STEMFORGE_AUTH_ENABLED: "true" }), false);
});

test("complete safe configuration enables the account surface", () => {
  const config = getAuthFeatureConfiguration({
    STEMFORGE_AUTH_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co/path",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    STEMFORGE_AUTH_SITE_URL: "http://localhost:3000",
  });
  assert.deepEqual(config, {
    status: "enabled",
    supabaseUrl: "https://project.supabase.co",
    publishableKey: "sb_publishable_test",
    siteUrl: "http://localhost:3000",
  });
});

test("authentication rejects non-origin site URLs", () => {
  const config = getAuthFeatureConfiguration({
    STEMFORGE_AUTH_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    STEMFORGE_AUTH_SITE_URL: "https://stemforge.example/account?next=unsafe",
  });
  assert.equal(config.status, "misconfigured");
});

test("insecure provider URLs fail closed", () => {
  const config = getAuthFeatureConfiguration({
    STEMFORGE_AUTH_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "http://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    STEMFORGE_AUTH_SITE_URL: "http://localhost:3000",
  });
  assert.equal(config.status, "misconfigured");
});
