'use client';

import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';

const theme = EditorView.theme({
  '&': { backgroundColor: '#fff' },
  '.cm-content': { fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace", padding: '10px 0' },
  '.cm-gutters': { fontFamily: "'JetBrains Mono', Consolas, monospace" },
  '.cm-activeLine': { backgroundColor: '#f2f8f7' },
  '.cm-activeLineGutter': { backgroundColor: '#e3f2ef' },
});

export default function CodeEditor({ value, onChange, readOnly }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      editable={!readOnly}
      extensions={[python(), theme]}
      basicSetup={{ foldGutter: false, autocompletion: false, highlightActiveLine: true, indentOnInput: true }}
      minHeight="120px"
    />
  );
}
