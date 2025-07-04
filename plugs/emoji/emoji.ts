import emojiBlob from "./emoji.json" with { type: "json" };
import { editor, system } from "@silverbulletmd/silverbullet/syscalls";

import type { EmojiConfig } from "../../type/config.ts";
import type { CompleteEvent } from "@silverbulletmd/silverbullet/type/client";

let emojiConfig: EmojiConfig = { aliases: [] };

const emojis = emojiBlob.split("|").map((line) => line.split(" "));

export function emojiCompleter(
  { linePrefix, pos, parentNodes }: CompleteEvent,
) {
  updateConfig(); // no need to await, will be ready for completion by next keystrokes

  const match = /:([\w]+)$/.exec(linePrefix);
  if (!match) {
    return null;
  }

  // Check if we're not in a Lua directive or space-lua block
  if (
    parentNodes.find((node) =>
      node === "LuaDirective" || node.startsWith("FencedCode")
    )
  ) {
    return;
  }

  const [fullMatch, emojiName] = match;

  const filteredEmoji = [...emojiConfig.aliases, ...emojis].filter(
    ([shortcode]) => shortcode.includes(emojiName),
  );

  return {
    from: pos - fullMatch.length,
    filter: false,
    options: filteredEmoji.map(([shortcode, emoji]) => ({
      detail: shortcode,
      label: emoji,
      type: "emoji",
    })),
  };
}

let lastConfigUpdate = 0;

async function updateConfig() {
  // Update at most every 5 seconds
  if (Date.now() < lastConfigUpdate + 5000) return;
  lastConfigUpdate = Date.now();
  const config = await system.getConfig("emoji");
  if (!config) {
    return;
  }

  const errorMsg =
    "Emoji aliases in space config should be a map with entries 'name: 😀'";

  let aliasMap: Record<string, any> = {};
  if (config.aliases && typeof config.aliases !== "object") {
    await editor.flashNotification(errorMsg, "error");
  } else {
    aliasMap = config.aliases;
  }

  const aliases = [];
  const badAliases = [];
  for (const alias in aliasMap) {
    if (typeof aliasMap[alias] !== "string") {
      badAliases.push(alias);
      continue;
    }
    const emoji: string = aliasMap[alias].trim();
    // For detecting misconfiguration like 'smile: grinning_face' which wouldn't work.
    // Side effect: can't use for phrases like 'br: Best regards', but Slash Commands are meant for that
    if ([...emoji].find((c) => c.charCodeAt(0) <= 127)) {
      // ASCII characters somewhere in text
      badAliases.push(alias);
      continue;
    }

    aliases.push([alias, emoji]);
  }
  if (badAliases.length > 0) {
    await editor.flashNotification(
      errorMsg + `, need to fix: ${badAliases.join(",")}`,
      "error",
    );
  }

  emojiConfig = {
    aliases: aliases,
  };
}
