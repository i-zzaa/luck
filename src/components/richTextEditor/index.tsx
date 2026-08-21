import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import clsx from 'clsx';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onBlur: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolbarButton = ({
  label,
  active,
  onClick,
  children,
}: ToolbarButtonProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    // evita que o toque no botão tire o foco/seleção do editor antes do click
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={clsx(
      'min-w-[44px] h-11 px-2 flex items-center justify-center rounded-md font-inter text-md leading-none active:bg-gray-300',
      active ? 'bg-violet-600 text-violet-800' : 'text-gray-800'
    )}
  >
    {children}
  </button>
);

export function RichTextEditor({
  value,
  onBlur,
  readOnly,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'font-inter text-md leading-6 min-h-[220px] focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_s]:line-through [&_p]:mb-2',
      },
    },
    onBlur: ({ editor: current }) => onBlur(current.getHTML()),
  });

  // mantém o campo desabilitado em sincronia caso o carregamento
  // da sessão (isEdit) mude depois do editor já ter montado
  useEffect(() => {
    if (editor && editor.isEditable === readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // sincroniza conteúdo vindo de fora (ex.: carregado da API) sem
  // sobrescrever o que a terapeuta está digitando no momento
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="w-full">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-300 pb-2 mb-2">
          <ToolbarButton
            label="Negrito"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            label="Itálico"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            label="Sublinhado"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">S</span>
          </ToolbarButton>
          <ToolbarButton
            label="Tachado"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <span className="line-through">T</span>
          </ToolbarButton>
          <span className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton
            label="Lista com marcadores"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <i className="pi pi-list" />
          </ToolbarButton>
          <ToolbarButton
            label="Lista numerada"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <span className="text-sm">1.</span>
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
