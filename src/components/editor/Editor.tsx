import { useEffect, useRef } from "react";
import { type EditorState, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTextNode } from "lexical";
import { $insertNodes, $getSelection, $isRangeSelection } from "lexical";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";

interface EditorProps {
  initialJson?: string;
  onChange?: (json: string, preview: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const theme = {
  paragraph: "mb-1 leading-relaxed",
  heading: { h1: "text-xl font-bold my-2", h2: "text-lg font-semibold my-1.5", h3: "text-base font-semibold my-1" },
  list: { ul: "list-disc ml-5", ol: "list-decimal ml-5" },
  listitem: "my-0.5",
  quote: "border-l-3 border-primary pl-3 italic text-text-secondary",
  code: "bg-gray-100 dark:bg-gray-800 rounded px-1 text-sm font-mono",
  codeHighlight: { atrule: "text-purple-500", attr: "text-blue-500", boolean: "text-orange-500", builtin: "text-green-600", cdata: "text-gray-500", char: "text-green-600", class: "text-blue-600", "class-name": "text-blue-600", comment: "text-gray-400 italic", constant: "text-orange-500", deleted: "text-red-500", doctype: "text-gray-500", entity: "text-orange-500", function: "text-blue-600", important: "text-orange-500", inserted: "text-green-600", keyword: "text-purple-500", namespace: "text-teal-500", number: "text-orange-500", operator: "text-gray-600", prolog: "text-gray-500", property: "text-blue-500", punctuation: "text-gray-600", regex: "text-orange-500", selector: "text-green-600", string: "text-green-600", symbol: "text-orange-500", tag: "text-red-500", url: "text-blue-500 underline", variable: "text-orange-500" },
  link: "text-blue-500 underline cursor-pointer",
  text: { bold: "font-bold", italic: "italic", underline: "underline", strikethrough: "line-through", underlineStrikethrough: "underline line-through" },
};

const onError = (error: any) => console.error(error);

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const format = (tag: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      switch (tag) {
        case "bold": editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"); break;
        case "italic": editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"); break;
        case "underline": editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline"); break;
        case "strikethrough": editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough"); break;
        case "h1": $setBlocksType(selection, () => $createHeadingNode("h1")); break;
        case "h2": $setBlocksType(selection, () => $createHeadingNode("h2")); break;
        case "h3": $setBlocksType(selection, () => $createHeadingNode("h3")); break;
        case "bullet": editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined); break;
        case "number": editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined); break;
        case "quote": $setBlocksType(selection, () => $createQuoteNode()); break;
        case "code":
          const text = selection.getTextContent();
          if (text) {
            const codeNode = $createParagraphNode();
            codeNode.append($createTextNode("```\n" + text + "\n```"));
            selection.insertNodes([codeNode]);
          }
          break;
      }
    });
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border dark:border-border-dark flex-wrap">
      {[
        { label: "B", action: "bold", title: "加粗" },
        { label: "I", action: "italic", title: "斜体" },
        { label: "U", action: "underline", title: "下划线" },
        { label: "S", action: "strikethrough", title: "删除线" },
      ].map(({ label, action, title }) => (
        <button
          key={action}
          title={title}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-card dark:hover:bg-card-dark text-sm font-medium text-text dark:text-text-dark"
          onClick={() => format(action)}
        >
          {label}
        </button>
      ))}
      <span className="w-px h-5 bg-border dark:bg-border-dark mx-1" />
      {[
        { label: "H1", action: "h1", title: "标题1" },
        { label: "H2", action: "h2", title: "标题2" },
        { label: "H3", action: "h3", title: "标题3" },
      ].map(({ label, action, title }) => (
        <button
          key={action}
          title={title}
          className="px-2 h-7 flex items-center justify-center rounded hover:bg-card dark:hover:bg-card-dark text-xs font-medium text-text dark:text-text-dark"
          onClick={() => format(action)}
        >
          {label}
        </button>
      ))}
      <span className="w-px h-5 bg-border dark:bg-border-dark mx-1" />
      {[
        { label: "•", action: "bullet", title: "无序列表" },
        { label: "1.", action: "number", title: "有序列表" },
        { label: "❝", action: "quote", title: "引用" },
        { label: "</>", action: "code", title: "代码块" },
      ].map(({ label, action, title }) => (
        <button
          key={action}
          title={title}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-card dark:hover:bg-card-dark text-sm text-text dark:text-text-dark"
          onClick={() => format(action)}
        >
          {label}
        </button>
      ))}
      <span className="w-px h-5 bg-border dark:bg-border-dark mx-1" />
      <button
        title="插入图片"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-card dark:hover:bg-card-dark text-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        🖼
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              editor.update(() => {
                const p = $createParagraphNode();
                const img = document.createElement("img");
                img.src = dataUrl;
                img.style.maxWidth = "100%";
                p.append($createTextNode("[图片]"));
                $insertNodes([p]);
              });
            };
            reader.readAsDataURL(file);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

function extractPreview(json: string): string {
  try {
    const parsed = JSON.parse(json);
    const texts: string[] = [];
    function walk(node: any) {
      if (node.text) texts.push(node.text);
      if (node.children) node.children.forEach(walk);
    }
    if (parsed.root?.children) parsed.root.children.forEach(walk);
    return texts.join(" ").slice(0, 200);
  } catch { return ""; }
}

export function Editor({ initialJson, onChange, placeholder = "开始写笔记...", readOnly = false }: EditorProps) {
  const initialConfig = {
    namespace: "WPSNoteEditor",
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, CodeHighlightNode],
    editable: !readOnly,
  };

  const handleChange = (editorState: EditorState) => {
    const json = JSON.stringify(editorState.toJSON());
    const preview = extractPreview(json);
    onChange?.(json, preview);
  };

  return (
    <div className="editor-container flex flex-col h-full">
      {!readOnly && (
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input text-text dark:text-text-dark text-base leading-relaxed min-h-[300px]" />}
            placeholder={<div className="absolute top-4 left-4 text-text-hint dark:text-text-hint-dark pointer-events-none">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
        </LexicalComposer>
      )}
      {readOnly && initialJson && (
        <LexicalComposer initialConfig={{ ...initialConfig, editorState: initialJson }}>
          <RichTextPlugin contentEditable={<ContentEditable className="editor-input text-text dark:text-text-dark text-base leading-relaxed" />} ErrorBoundary={LexicalErrorBoundary} />
          <ListPlugin />
          <LinkPlugin />
        </LexicalComposer>
      )}
    </div>
  );
}

export function ReadOnlyEditor({ json }: { json: string }) {
  const initialConfig = {
    namespace: "WPSNotePreview",
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, CodeHighlightNode],
    editorState: json,
    editable: false,
  };

  return (
    <div className="p-4">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin contentEditable={<ContentEditable className="editor-input text-text dark:text-text-dark text-base leading-relaxed" />} ErrorBoundary={LexicalErrorBoundary} />
        <ListPlugin />
        <LinkPlugin />
      </LexicalComposer>
    </div>
  );
}