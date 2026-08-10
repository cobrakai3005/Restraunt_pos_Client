"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuill } from "react-quilljs";
// import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const getWordCount = (text: string): number => {
  return text
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
};

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your notes here...",
  className = "",
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [limitExceeded, setLimitExceeded] = useState(false);

  const { quill, quillRef } = useQuill({
    modules: {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["clean"],
        ],
      },
    },
    placeholder,
    theme: "snow",
  });

  const isMounted = useRef(false);

  // Remove tabindex from toolbar buttons so they're not focusable
  useEffect(() => {
    if (quill) {
      // Wait for DOM to be ready
      const timeout = setTimeout(() => {
        const toolbar = document.querySelector(".ql-toolbar");
        if (toolbar) {
          // Make all toolbar buttons and interactive elements non-focusable
          const focusableElements = toolbar.querySelectorAll(
            "button, select, .ql-picker, .ql-picker-label, .ql-picker-item, [tabindex]",
          );
          focusableElements.forEach((el) => {
            el.setAttribute("tabindex", "-1");
          });

          // Also disable the toolbar container itself
          toolbar.setAttribute("tabindex", "-1");
        }
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [quill]);


useEffect(() => {
  if (quill && !isMounted.current) {
    if (value) {
      quill.root.innerHTML = value; // focus steal nahi hota
      setWordCount(getWordCount(quill.getText()));
    }
    isMounted.current = true;
  }
}, [quill, value]);


useEffect(() => {
  if (!quill || !isMounted.current) return;

  // User type kar raha hai toh interfere mat karo
  if (quill.hasFocus()) return;

  const currentHTML = quill.root.innerHTML;
  const newValue = value || "";

  // Already in sync hai toh skip karo (infinite loop bachao)
  if (currentHTML === newValue) return;

  // innerHTML directly set karo — Quill events fire nahi hote, focus steal nahi hota
  quill.root.innerHTML = newValue;
  setWordCount(getWordCount(quill.getText()));
}, [quill, value]);


  useEffect(() => {
    if (quill) {
      const handleTextChange = (delta: any, oldDelta: any, source: string) => {
        if (source !== "user") return;

        const text = quill.getText();
        const words = getWordCount(text);

        setWordCount(words);

        if (words > 100) {
          alert("Maximum 100 words allowed");
          setLimitExceeded(true);
          quill.history.undo();
          return;
        } else {
          setLimitExceeded(false);
        }

        const htmlContent = quill.root.innerHTML;
        if (htmlContent !== value) {
          onChange(htmlContent);
        }
      };

      quill.on("text-change", handleTextChange);

      return () => {
        quill.off("text-change", handleTextChange);
      };
    }
  }, [quill, onChange, value]);

  useEffect(() => {
    if (!quill) return;

    const handleEditorTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const focusableSelectors = [
        'input:not([disabled]):not([tabindex="-1"])',
        'button:not([disabled]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        '[tabindex]:not([tabindex="-1"])', // Only include elements with tabindex >= 0
      ].join(", ");

      const allFocusable = Array.from(
        document.querySelectorAll<HTMLElement>(focusableSelectors),
      ).filter((el) => el.offsetParent !== null);

      const editorEl = quill.root as HTMLElement;
      const elements = [...allFocusable];

      if (!elements.includes(editorEl)) {
        const insertIndex = elements.findIndex(
          (el) =>
            el.compareDocumentPosition(editorEl) &
            Node.DOCUMENT_POSITION_PRECEDING,
        );
        if (insertIndex === -1) {
          elements.push(editorEl);
        } else {
          elements.splice(insertIndex, 0, editorEl);
        }
      }

      const currentIndex = elements.indexOf(editorEl);
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
      const nextEl = elements[nextIndex];
      if (nextEl) {
        nextEl.focus();
      }
    };

    quill.root.addEventListener("keydown", handleEditorTab, true);
    quill.keyboard.addBinding({ key: "Tab" }, () => false);

    return () => {
      quill.root.removeEventListener("keydown", handleEditorTab, true);
    };
  }, [quill]);

  return (
    <div className={`quill-editor ${className}`}>
      <div ref={quillRef} />

      {/* WORD COUNTER */}
      <div className="text-right text-xs text-gray-500 mt-1">
        {wordCount} / 100 words
      </div>

      {/* LIMIT WARNING */}
      {limitExceeded && (
        <div className="text-right text-xs text-red-500 mt-1">
          ⚠️ Maximum 100 words allowed
        </div>
      )}

      <style jsx>{`
        .quill-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
          border-radius: 4px 4px 0 0;
        }
        .quill-editor .ql-container {
          border: 1px solid #ccc;
          border-radius: 0 0 4px 4px;
          min-height: 120px;
        }
        .quill-editor .ql-editor {
          min-height: 120px;
          padding: 12px 15px;
        }
      `}</style>
    </div>
  );
};

export default QuillEditor;
