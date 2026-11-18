/*
 * PVS token lists and syntax adapted from emacs/pvs-mode.el in SRI-CSL/PVS.
 * Copyright (c) 2026, SRI International's Computer Science Laboratory
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(() => {
  const pvsKeywords = new Set(`
    and andthen array as assuming assumption auto_rewrite auto_rewrite+ auto_rewrite-
    axiom begin but by cases challenge claim closure codatatype coinductive cond
    conjecture containing conversion conversion+ conversion- corollary datatype
    else elsif end endassuming endcases endcond endif endtable exists exporting
    fact false forall formula from function has_type if iff implies importing in
    inductive judgement lambda law lemma let library macro measure nonempty_type
    not o obligation of or orelse postulate proposition recursive sublemma
    subtypes subtype_of table then theorem theory true type type+ var when where
    with xor
  `.trim().split(/\s+/));

  const pvsOperators = new Set([
    "#", "##", "$", "$$", "&", "&&", "*", "**", "+", "++", "-", "/", "//",
    "/=", "/\\", "::", ":=", "<", "<-", "<<", "<<=", "<=", "<=>", "<>",
    "<|", "=", "==", "==>", "=>", ">", ">=", ">>", ">>=", "@", "@@",
    "[]", "\\/", "^", "^^", "|-", "|->", "|=", "|>", "~"
  ]);
  const pvsDelimiters = [
    "(#", "#)", "[#", "#]", "(:", ":)", "(|", "|)", "(", ")", "[|", "|]",
    "|[", "]|", "||", "{", "|", "}", "[", "->", "]"
  ];

  // Longest symbols first so a prefix such as | never splits |->.
  function literalAlternatives(tokens) {
    return [...tokens]
      .sort((a, b) => b.length - a.length)
      .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
  }

  const stringLiteral = /"(?:[^"\\]|\\[\s\S])*"?/.source;
  const pvsWordCharacter = /[\p{L}\p{M}\p{N}_?]/u.source;
  const suffixedKeywords = [...pvsKeywords].filter(keyword => /[+-]$/.test(keyword));
  const pvsTokens = new RegExp([
    /(?<comment>%[^\r\n\f]*)/.source,
    `(?<string>${stringLiteral})`,
    `(?<word>(?:${literalAlternatives(suffixedKeywords)})(?!${pvsWordCharacter})|${pvsWordCharacter}+)`,
    `(?<symbol>${literalAlternatives([...pvsOperators, ...pvsDelimiters])})`
  ].join("|"), "giu");

  // pvs-strategies files use Lisp mode. Include the proof commands shown here.
  const strategyKeywords = new Set(
    "defstep defstrat defhelper try abstract musimp skip ws1s eval &optional &key &rest nil t".split(" ")
  );
  const strategyTokens = new RegExp([
    /(?<comment>;[^\r\n\f]*)/.source,
    `(?<string>${stringLiteral})`,
    /(?<word>(?:\\[\s\S]|[^\s();"\\])+)/.source,
    /(?<symbol>[()])/.source
  ].join("|"), "g");

  function highlight(code, pattern, keywords, operators) {
    const text = code.textContent;
    const result = document.createDocumentFragment();
    let end = 0;

    for (const match of text.matchAll(pattern)) {
      const { comment, string, word, symbol } = match.groups;
      let face;
      if (comment) {
        face = "comment";
      } else if (string) {
        face = "string";
      } else if (symbol) {
        face = operators?.has(symbol) ? "operator" : "delimiter";
      } else if (keywords.has(word.toLowerCase()) || (word.startsWith(":") && word.length > 1)) {
        face = "keyword";
      } else {
        continue;
      }
      const span = document.createElement("span");
      span.className = `syntax-${face}`;
      span.textContent = match[0];
      result.append(text.slice(end, match.index), span);
      end = match.index + match[0].length;
    }

    if (end > 0) {
      result.append(text.slice(end));
      code.replaceChildren(result);
    }
  }

  for (const code of document.querySelectorAll("code.language-pvs")) {
    highlight(code, pvsTokens, pvsKeywords, pvsOperators);
  }
  for (const code of document.querySelectorAll("code.language-pvs-strategy")) {
    highlight(code, strategyTokens, strategyKeywords);
  }
})();
