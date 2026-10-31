# Share link v2 rollback

V2 stores a template index and pairs of field indices/changed values, encoded as
URL-safe base64 after the `2.` prefix. The field order, template order and defaults
in `src/shareDefaultsV2.ts` are a permanent wire-format snapshot. Never change
them to match future UI defaults; introduce a new version instead.

Legacy unprefixed links still use the original full-settings JSON reader.
V2 preserves every non-default setting, including inactive feature settings.

## Roll back link creation

Set `VITE_SHARE_LINK_VERSION=1` in `.env.production` and rebuild/deploy.
Alternatively, change the writer version argument in `createShareUrl` to `1`.
Keep `src/shareSettings.ts` and the frozen defaults so already-shared v2 links
continue to load. Removing the entire v2 reader would break those links.

To resume v2 creation, remove the environment override and rebuild/deploy.
Browser saved trays are unchanged by either format.

## Verification

Bundle `scripts/checkShareSettings.ts` using esbuild for Node, then run the bundle.
It checks legacy links, exact round trips, frozen defaults, and malformed input.
