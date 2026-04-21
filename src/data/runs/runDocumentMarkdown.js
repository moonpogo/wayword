(function () {
  var FRONTMATTER_KIND = "wayword.runDocument.v1";

  /**
   * Serializes a run document to markdown with a front metadata block plus raw body.
   * The metadata block uses JSON (a YAML 1.2–compatible subset) between fences for stable parsing without extra deps.
   *
   * @param {WaywordRunDocument} doc
   * @returns {string}
   */
  function serializeRunDocumentToMarkdown(doc) {
    if (!doc || typeof doc !== "object") throw new Error("serializeRunDocumentToMarkdown: expected document");
    var body = String(doc.body == null ? "" : doc.body);
    var head = {
      kind: FRONTMATTER_KIND,
      schemaVersion: doc.schemaVersion,
      record: stripBodyForMetadata(doc),
    };
    return "---\n" + JSON.stringify(head, null, 2) + "\n---\n" + body;
  }

  /**
   * @param {WaywordRunDocument} doc
   * @returns {Record<string, unknown>}
   */
  function stripBodyForMetadata(doc) {
    var out = {};
    for (var k in doc) {
      if (!Object.prototype.hasOwnProperty.call(doc, k)) continue;
      if (k === "body") continue;
      out[k] = doc[k];
    }
    return out;
  }

  /**
   * @param {string} markdown
   * @returns {WaywordRunDocument}
   */
  function deserializeRunDocumentFromMarkdown(markdown) {
    var src = String(markdown || "");
    var m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!m) throw new Error("deserializeRunDocumentFromMarkdown: missing front matter");
    var head;
    try {
      head = JSON.parse(m[1]);
    } catch (e) {
      throw new Error("deserializeRunDocumentFromMarkdown: invalid front matter JSON");
    }
    if (!head || typeof head !== "object") throw new Error("deserializeRunDocumentFromMarkdown: bad front matter shape");
    if (head.kind !== FRONTMATTER_KIND) {
      throw new Error("deserializeRunDocumentFromMarkdown: unexpected kind");
    }
    var record = head.record;
    if (!record || typeof record !== "object") throw new Error("deserializeRunDocumentFromMarkdown: missing record");
    var bodyFromMarkdown = m[2] == null ? "" : m[2];
    var merged = Object.assign({}, record, { body: bodyFromMarkdown });
    if (typeof merged.schemaVersion !== "number" && typeof head.schemaVersion === "number") {
      merged.schemaVersion = head.schemaVersion;
    }
    return /** @type {WaywordRunDocument} */ (merged);
  }

  window.waywordRunDocumentMarkdown = {
    serializeRunDocumentToMarkdown: serializeRunDocumentToMarkdown,
    deserializeRunDocumentFromMarkdown: deserializeRunDocumentFromMarkdown,
    RUN_DOCUMENT_MARKDOWN_KIND: FRONTMATTER_KIND,
  };
})();
