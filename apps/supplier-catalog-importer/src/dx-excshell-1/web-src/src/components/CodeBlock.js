/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { createContext, useContext, useMemo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";

export const CodeThemeContext = createContext("light");

function renderTokens(tokens) {
  let offset = 0;
  return tokens.map((token) => {
    const key = offset;
    offset += token.length;
    return typeof token === "string" ? (
      token
    ) : (
      <span className={`token ${token.type}`} key={key}>
        {Array.isArray(token.content)
          ? renderTokens(token.content)
          : token.content}
      </span>
    );
  });
}

export default function CodeBlock({ code, language = "json", label }) {
  const colorScheme = useContext(CodeThemeContext);
  const tokens = useMemo(
    () => Prism.tokenize(code, Prism.languages[language]),
    [code, language],
  );
  return (
    <section aria-label={label}>
      <pre
        className="workbench-code"
        data-color-scheme={colorScheme}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code needs keyboard access.
        tabIndex={0}
      >
        <code>{renderTokens(tokens)}</code>
      </pre>
    </section>
  );
}
