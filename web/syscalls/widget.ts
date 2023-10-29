import { CodeWidgetContent } from "$sb/types.ts";
import { SysCallMapping } from "../../plugos/system.ts";
import { Client } from "../client.ts";

export function widgetSyscalls(
  client: Client,
): SysCallMapping {
  return {
    "widget.render": (
      _ctx,
      lang: string,
      body: string,
    ): Promise<CodeWidgetContent> => {
      const langCallback = client.system.codeWidgetHook.codeWidgetCallbacks.get(
        lang,
      );
      if (!langCallback) {
        throw new Error(`Code widget ${lang} not found`);
      }
      return langCallback(body);
    },
  };
}
