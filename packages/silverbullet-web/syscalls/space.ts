import { Editor } from "../editor";
import { SysCallMapping } from "@silverbulletmd/plugos/system";
import { PageMeta } from "@silverbulletmd/common/types";

export function spaceSyscalls(editor: Editor): SysCallMapping {
  return {
    "space.listPages": async (): Promise<PageMeta[]> => {
      return [...(await editor.space.listPages())];
    },
    "space.readPage": async (
      ctx,
      name: string
    ): Promise<{ text: string; meta: PageMeta }> => {
      return await editor.space.readPage(name);
    },
    "space.writePage": async (
      ctx,
      name: string,
      text: string
    ): Promise<PageMeta> => {
      return await editor.space.writePage(name, text);
    },
    "space.deletePage": async (ctx, name: string) => {
      // If we're deleting the current page, navigate to the start page
      if (editor.currentPage === name) {
        await editor.navigate("start");
      }
      // Remove page from open pages in editor
      editor.openPages.delete(name);
      console.log("Deleting page");
      await editor.space.deletePage(name);
    },
  };
}