const markdownItAnchor = require("markdown-it-anchor");
const fs = require("fs");
const path = require("path");

let mdInstance = null;

const mditPlugins = [
  () => { const p = require("@mdit/plugin-abbr"); return p.abbr; },
  () => { const p = require("@mdit/plugin-alert"); return p.alert; },
  () => { const p = require("@mdit/plugin-align"); return p.align; },
  () => { const p = require("@mdit/plugin-attrs"); return p.attrs; },
  () => { const p = require("@mdit/plugin-container"); return [p.container, { name: "info" }]; },
  () => { const p = require("@mdit/plugin-demo"); return p.demo; },
  () => { const p = require("@mdit/plugin-dl"); return p.dl; },
  () => {
    const p = require("@mdit/plugin-embed");
    return [p.embed, {
      config: [
        {
          name: "youtube",
          setup: (id) => {
            const videoId = encodeURIComponent(id.trim());
            return `<div class="mdit-embed mdit-embed-youtube"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video" loading="lazy" allowfullscreen></iframe></div>`;
          },
        },
      ],
    }];
  },
  () => { const p = require("@mdit/plugin-emoji"); return p.fullEmoji; },
  () => { const p = require("@mdit/plugin-figure"); return p.figure; },
  () => { const p = require("@mdit/plugin-footnote"); return p.footnote; },
  () => { const p = require("@mdit/plugin-icon"); return [p.icon, { render: p.defaultRender }]; },
  () => { const p = require("@mdit/plugin-img-lazyload"); return p.imgLazyload; },
  () => { const p = require("@mdit/plugin-img-mark"); return p.imgMark; },
  () => { const p = require("@mdit/plugin-img-size"); return p.imgSize; },
  () => {
    const p = require("@mdit/plugin-include");
    return [p.include, {
      currentPath: (env) => env.page?.inputPath ? path.resolve(__dirname, env.page.inputPath) : path.resolve(__dirname, "Docs/posts/test.md"),
      resolvePath: (filePath, cwd) => {
        const candidates = [
          cwd && path.resolve(cwd, filePath),
          path.resolve(__dirname, filePath),
          path.resolve(__dirname, "src/templates", filePath.replace(/^_includes\//, '')),
        ].filter(Boolean);
        for (const c of candidates) {
          if (fs.existsSync(c)) return c;
        }
        return candidates[candidates.length - 1] || path.resolve(__dirname, filePath);
      },
      resolveImagePath: false,
      resolveLinkPath: false,
      useComment: false,
    }];
  },
  () => { const p = require("@mdit/plugin-ins"); return p.ins; },
  () => { const p = require("@mdit/plugin-katex"); return p.katex; },
  () => { const p = require("@mdit/plugin-mark"); return p.mark; },
  () => { const p = require("@mdit/plugin-plantuml"); return [p.plantuml, { name: "plantuml", open: "startuml", close: "enduml" }]; },
  () => { const p = require("@mdit/plugin-ruby"); return p.ruby; },
  () => {
    const p = require("@mdit/plugin-snippet");
    return [p.snippet, {
      currentPath: (env) => env.page?.inputPath ? path.resolve(__dirname, env.page.inputPath) : path.resolve(__dirname, "Docs/posts/test.md"),
      resolvePath: (filePath, cwd) => fs.existsSync(path.resolve(cwd || __dirname, filePath))
        ? path.resolve(cwd || __dirname, filePath)
        : path.resolve(__dirname, filePath),
    }];
  },
  () => { const p = require("@mdit/plugin-spoiler"); return p.spoiler; },
  () => {
    const p = require("@mdit/plugin-stylize");
    return [p.stylize, {
      config: [
        {
          matcher: "TokyoInsiders",
          replacer: ({ content }) => ({
            tag: "span",
            attrs: { class: "mdit-stylize-example" },
            content,
          }),
        },
      ],
    }];
  },
  () => { const p = require("@mdit/plugin-sub"); return p.sub; },
  () => { const p = require("@mdit/plugin-sup"); return p.sup; },
  () => { const p = require("@mdit/plugin-tab"); return p.tab; },
  () => { const p = require("@mdit/plugin-tasklist"); return p.tasklist; },
  () => { const p = require("@mdit/plugin-tex"); return p.tex; },
  () => { const p = require("@mdit/plugin-uml"); return p.uml; },
];

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("layout", "layouts/base.html");
  eleventyConfig.addPassthroughCopy({ "src/assets": "." });
  eleventyConfig.addPassthroughCopy({ "src/themes": "css" });
  eleventyConfig.addPassthroughCopy({ "src/utils": "js" });

  eleventyConfig.addNunjucksGlobal("getNotesRegistry", () => {
    const notesPath = path.resolve(__dirname, "Docs/notes.md");
    const registry = {};
    if (fs.existsSync(notesPath)) {
      const content = fs.readFileSync(notesPath, "utf8");
      const regex = /^###\s+([^\r\n]+)\r?\n([\s\S]*?)(?=\n#+\s|(?![\s\S]))/gm;
      const md = mdInstance || new (require("markdown-it"))({ html: true });
      let match;
      while ((match = regex.exec(content)) !== null) {
        const name = match[1].trim();
        const markdownContent = match[2].trim();
        registry[name] = md.render(markdownContent);
      }
    }
    return registry;
  });

  eleventyConfig.addNunjucksGlobal("gitLastCommitHash", () => {
    try {
      const { execSync } = require("child_process");
      return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    } catch (e) {
      console.warn("Failed to get git last commit hash:", e);
      return "unknown";
    }
  });

  eleventyConfig.addNunjucksGlobal("gitLastCommitHashFull", () => {
    try {
      const { execSync } = require("child_process");
      return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch (e) {
      console.warn("Failed to get git last commit hash full:", e);
      return "";
    }
  });

  // Shortcode to include another markdown file with its header block 1:1
  eleventyConfig.addNunjucksShortcode("includeMarkdown", function(filePath) {
    const fs = require("fs");
    const path = require("path");
    const absolutePath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`[includeMarkdown] File not found: ${absolutePath}`);
      return "";
    }
    const fileContent = fs.readFileSync(absolutePath, "utf8");
    
    // Parse front matter
    const frontMatter = {};
    const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    let cleanContent = fileContent;
    if (match) {
      cleanContent = fileContent.replace(/^---[\s\S]*?---/, "");
      const yamlText = match[1];
      const lines = yamlText.split("\n");
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim();
          let value = line.slice(colonIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          frontMatter[key] = value;
        }
      }
    }
    
    // Generate page header HTML if title exists, identical to base.html's page-header
    let headerHtml = "";
    if (frontMatter.title) {
      headerHtml = `
<header class="page-header">
  <h1 class="page-title">
    ${frontMatter.icon ? `<span class="material-symbols-outlined page-title-icon">${frontMatter.icon}</span>` : ""}
    <span class="page-title-text">${frontMatter.title}</span>
  </h1>
  ${frontMatter.subtitle ? `
  <div class="post-meta-line" style="display: flex; align-items: center; gap: 8px; color: var(--md-sys-color-on-surface-variant); font-size: 15px; margin-top: 12px; margin-bottom: 20px; flex-wrap: wrap;">
    <span class="post-subtitle-inline" style="color: var(--md-sys-color-on-surface-variant);">${frontMatter.subtitle}</span>
  </div>
  ` : ""}
</header>
      `;
    }
    
    // Parse content using MD instance
    const md = mdInstance || new (require("markdown-it"))({ html: true });
    return headerHtml + md.render(cleanContent);
  });

  // Custom searchable collection
  eleventyConfig.addCollection("searchable", function(collectionApi) {
    return collectionApi.getFilteredByGlob("Docs/**/*.md");
  });

  // Search index builder — used at build time
  function buildSearchIndex(collectionsSearchable) {
    const searchDocs = [];
    let idCounter = 1;

    for (const item of collectionsSearchable) {
      if (item.url === "/search-index.json") continue;

      const inputPath = item.inputPath;
      if (!inputPath || !fs.existsSync(inputPath)) continue;

      const url = item.url;

      let rawContent = fs.readFileSync(inputPath, "utf8");

      // Extract title from front matter if not provided in data
      let title = item.data.title || item.data.name;
      if (!title) {
        const fmMatch = rawContent.match(/^---\s*\n([\s\S]*?)\n---/);
        if (fmMatch) {
          const fmTitle = fmMatch[1].match(/title:\s*(.+)/);
          if (fmTitle) title = fmTitle[1].trim().replace(/^["']|["']$/g, '');
        }
      }
      title = title || "Untitled";

      try {
        if (rawContent.startsWith("---")) {
          const secondDashIndex = rawContent.indexOf("---", 3);
          if (secondDashIndex !== -1) {
            rawContent = rawContent.slice(secondDashIndex + 3);
          }
        }

        const lines = rawContent.split(/\r?\n/);

        let currentSection = {
          id: idCounter++,
          title: title,
          sectionHeader: "",
          url: url,
          content: ""
        };
        searchDocs.push(currentSection);

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
          if (headingMatch) {
            const headingText = headingMatch[2].trim()
              .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
              .replace(/[*_`~]/g, "");

            const slug = headingText.toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .trim();

            currentSection = {
              id: idCounter++,
              title: title,
              sectionHeader: headingText,
              url: url + (slug ? "#" : "") + slug,
              content: ""
            };
            searchDocs.push(currentSection);
          } else {
            const cleanLine = trimmed
              .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
              .replace(/[*_`~|]/g, "")
              .replace(/#+/g, "")
              .trim();

            if (cleanLine) {
              currentSection.content += (currentSection.content ? "\n" : "") + cleanLine;
            }
          }
        }
      } catch (err) {
        console.error("Failed to read/parse file for search index:", inputPath, err);
      }
    }

    return searchDocs.filter(doc => doc.content.trim().length > 0 || doc.sectionHeader.trim().length > 0);
  }

  // JSON filter for Nunjucks
  eleventyConfig.addFilter("json", (val) => JSON.stringify(val));
  // striptags filter
  eleventyConfig.addFilter("striptags", (val) => (val || "").replace(/<[^>]*>/g, ""));
  // dateString filter
  eleventyConfig.addFilter("dateString", (dateObj) => {
    if (!dateObj) return "";
    const date = new Date(dateObj);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    });
  });

  // shortDate filter
  eleventyConfig.addFilter("shortDate", (dateObj) => {
    if (!dateObj) return "";
    const date = new Date(dateObj);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });
  });

  // Syntax highlighting via @11ty/eleventy-plugin-syntaxhighlight
  const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
  eleventyConfig.addPlugin(syntaxHighlight);

  // Custom TOC filter (replaces eleventy-plugin-nesting-toc)
  const cheerio = require("cheerio");
  eleventyConfig.addFilter("toc", (content) => {
    const $ = cheerio.load(content);
    const toc = [];
    $("h2[id], h3[id], h4[id]").each((_, el) => {
      const $el = $(el);
      $el.find("a.anchor-link").remove();
      const level = parseInt(el.tagName.slice(1));
      toc.push({ level, id: $el.attr("id"), text: $el.text().trim() });
    });
    if (!toc.length) return "";
    function render(items, minLevel) {
      let html = "<ol>\n";
      for (const item of items) {
        html += `<li><a href="#${item.id}">${item.text}</a>`;
        if (item.children && item.children.length) {
          html += "\n" + render(item.children, minLevel);
        }
        html += "</li>\n";
      }
      return html + "</ol>\n";
    }
    function buildTree(headings) {
      const root = { level: 0, children: [] };
      let stack = [root];
      for (const h of headings) {
        const node = { ...h, children: [] };
        while (stack.length > 1 && stack[stack.length - 1].level >= h.level) {
          stack.pop();
        }
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      }
      return root.children;
    }
    const tree = buildTree(toc);
    return '<div class="toc">' + render(tree, 2) + "</div>";
  });

  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdInstance = mdLib;
    mdLib.set({ html: true, linkify: true, typographer: true });

    for (const getPlugin of mditPlugins) {
      try {
        const plugin = getPlugin();
        if (Array.isArray(plugin)) {
          mdLib.use(plugin[0], plugin[1]);
        } else {
          mdLib.use(plugin);
        }
      } catch (e) {}
    }

    mdLib.use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.ariaHidden({
        placement: "before",
        class: "anchor-link",
        symbol: "#",
      }),
      level: [2, 3, 4],
    });

    // Rule 1 — Social Link Icon Transformer
    mdLib.core.ruler.push("social-link-icons", (state) => {
      const icons = {
        discord: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.03.02.03.08-.01.11c-.52.3-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/></svg>',
        github: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>',
        youtube: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        instagram: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"><title>Instagram</title><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>',
        facebook: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        reddit: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"><title>Reddit</title><path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z"/></svg>',
        x: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        telegram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
      };

      for (const token of state.tokens) {
        if (token.type !== "inline" || !token.children) continue;
        const children = token.children;
        for (let i = 1; i < children.length - 1; i++) {
          const t = children[i];
          if (t.type !== "text") continue;
          const prev = children[i - 1];
          const next = children[i + 1];
          if (prev.tag !== "a" || prev.nesting !== 1 || next.tag !== "a" || next.nesting !== -1) continue;
          const platform = t.content.trim().toLowerCase();
          const iconKey = platform === "insta" ? "instagram" : platform;
          if (!icons[iconKey]) continue;
          prev.attrJoin("class", `social-link social-link--${platform}`);
          prev.attrSet("target", "_blank");
          prev.attrSet("rel", "noopener noreferrer");
          t.type = "html_inline";
          t.content = icons[iconKey];
          t.tag = "";
          t.nesting = 0;
          t.attrs = null;
        }
      }
    });

    // Rule 2 — Starred List (replaces ⭐/🌟👑 emoji with icons)
    mdLib.core.ruler.push("emoji-link-icons", (state) => {
      for (let i = 0; i < state.tokens.length; i++) {
        const token = state.tokens[i];
        if (token.type !== "list_item_open") continue;

        let starMode = 0;
        let depth = 0;
        let inlineToken = null;
        let firstText = null;
        for (let j = i + 1; j < state.tokens.length; j++) {
          const t = state.tokens[j];
          if (t.type === "list_item_close" && depth === 0) break;
          if (t.type === "bullet_list_open" || t.type === "ordered_list_open") { depth++; continue; }
          if (t.type === "bullet_list_close" || t.type === "ordered_list_close") { depth--; continue; }
          if (depth > 0) continue;
          if (t.type === "inline" && t.children && t.children.length > 0) {
            const first = t.children[0];
            if (first.type === "text" && first.content) {
              if (first.content.startsWith("👑")) { starMode = 3; inlineToken = t; firstText = first; break; }
              if (first.content.startsWith("🌟")) { starMode = 2; inlineToken = t; firstText = first; break; }
              if (first.content.startsWith("⭐")) { starMode = 1; inlineToken = t; firstText = first; break; }
            }
          }
        }
        if (starMode === 0) continue;

        // Strip the emoji from text and inject icon token
        const iconHtml = starMode === 1
          ? `<span class="md-emoji-icon material-symbols-outlined">star</span>`
          : `<span class="md-emoji-icon material-symbols-outlined">crown</span>`;
        firstText.content = firstText.content.slice(2); // remove emoji + space
        const iconToken = new state.Token("html_inline", "", 0);
        iconToken.content = iconHtml;
        const idx = inlineToken.children.indexOf(firstText);
        inlineToken.children.splice(idx, 0, iconToken);

        // Wrap subsequent links in <strong> (⭐) or <strong><em> (🌟👑)
        depth = 0;
        for (let j = i + 1; j < state.tokens.length; j++) {
          const t = state.tokens[j];
          if (t.type === "list_item_close" && depth === 0) break;
          if (t.type === "bullet_list_open" || t.type === "ordered_list_open") { depth++; continue; }
          if (t.type === "bullet_list_close" || t.type === "ordered_list_close") { depth--; continue; }
          if (depth > 0) continue;
          if (t.type === "inline" && t.children) {
            const newChildren = [];
            for (const child of t.children) {
              if (child.type === "link_close") {
                if (starMode >= 2) newChildren.push(new state.Token("em_close", "em", -1));
                if (starMode >= 1) newChildren.push(new state.Token("strong_close", "strong", -1));
              }
              newChildren.push(child);
              if (child.type === "link_open") {
                if (starMode >= 1) newChildren.push(new state.Token("strong_open", "strong", 1));
                if (starMode >= 2) newChildren.push(new state.Token("em_open", "em", 1));
              }
            }
            t.children = newChildren;
          }
        }
      }
    });

    // Rule 3 — Notes & Resources Tooltip Transformer
    mdLib.core.ruler.push("tooltip-links", (state) => {
      state.tokens.forEach((token) => {
        if (token.type !== "inline" || !token.children) return;
        const children = token.children;

        for (let i = 0; i < children.length; i++) {
          const child = children[i];

          if (child.type === "link_open") {
            const nextChild = children[i + 1];

            // Check if the link text is exactly "Note" or "Resource"
            if (
              nextChild &&
              nextChild.type === "text" &&
              (nextChild.content === "Note" || nextChild.content === "Resource")
            ) {
              const hrefIndex = child.attrIndex("href");
              const href = hrefIndex >= 0 ? child.attrs[hrefIndex][1] : "";

              // Ensure it matches the requested note URL format
              if (href.startsWith("/notes#")) {
                const noteId = href.split("#")[1];
                const tooltipType = nextChild.content.toLowerCase();

                // Create our HTML inline component
                const htmlToken = new state.Token("html_inline", "", 0);
                const iconName = tooltipType === "resource" ? "widgets" : "info";
                htmlToken.content = `<span class="tooltip-trigger tooltip-type-${tooltipType}" data-note-id="${noteId}" tabindex="0"><span class="material-symbols-outlined tooltip-icon">${iconName}</span></span>`;

                // Find the matching link_close
                let closeIdx = i + 2;
                let level = 1;
                while (closeIdx < children.length) {
                  if (children[closeIdx].type === "link_open") level++;
                  else if (children[closeIdx].type === "link_close") level--;

                  if (level === 0) break;
                  closeIdx++;
                }

                // Replace the entire link sequence with the HTML inline token
                if (closeIdx < children.length) {
                  children.splice(i, closeIdx - i + 1, htmlToken);
                }
              }
            }
          }
        }
      });
    });

    // Rule 4 — Contributor List Tag Transformer
    mdLib.core.ruler.push("contributor-list", (state) => {
      state.tokens.forEach((token) => {
        // 1. Block-level HTML tag (when <ContributorList /> is on its own line)
        if (token.type === "html_block" && token.content.trim() === "<ContributorList />") {
          try {
            const contributorsPath = path.resolve(__dirname, "src/data/contributors.json");
            if (fs.existsSync(contributorsPath)) {
              const contributorsData = JSON.parse(fs.readFileSync(contributorsPath, "utf8"));
              
              const discordIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.03.02.03.08-.01.11c-.52.3-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/></svg>`;
              const githubIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
              const portfolioIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;

              let gridHtml = '<div class="contributors-grid">';
              for (const c of contributorsData) {
                let avatarUrl = "";
                if (c.pfp && c.pfp !== "none") {
                  avatarUrl = c.pfp;
                } else if (c.discordId && c.discordId !== "none") {
                  avatarUrl = `https://avatar-cyan.vercel.app/api/pfp/${c.discordId}/image`;
                } else if (c.github && c.github !== "none") {
                  avatarUrl = `${c.github}.png`;
                }

                gridHtml += `
                  <div class="contributor-card">
                    <div class="contributor-card-left">
                      <div class="contributor-avatar-container">
                        <img src="${avatarUrl}" class="contributor-avatar" alt="${c.name}">
                        <span class="contributor-type-badge">${c.type}</span>
                      </div>
                      ${c.aka && c.aka !== "none" ? `<div class="contributor-aka">aka ${c.aka}</div>` : ""}
                    </div>
                    <div class="contributor-card-right">
                      <h3 class="contributor-name">${c.name}</h3>
                      ${c.description && c.description !== "none" ? `<p class="contributor-description">${c.description}</p>` : ""}
                      <div class="contributor-socials">
                        ${c.discord && c.discord !== "none" ? `<md-icon-button href="${c.discord}" target="_blank" class="contributor-social-link contributor-social-discord" title="Discord" aria-label="Discord">${discordIconSvg}</md-icon-button>` : ""}
                        ${c.github && c.github !== "none" ? `<md-icon-button href="${c.github}" target="_blank" class="contributor-social-link contributor-social-github" title="GitHub" aria-label="GitHub">${githubIconSvg}</md-icon-button>` : ""}
                        ${c.portfolio && c.portfolio !== "none" ? `<md-icon-button href="${c.portfolio}" target="_blank" class="contributor-social-link contributor-social-portfolio" title="Portfolio" aria-label="Portfolio">${portfolioIconSvg}</md-icon-button>` : ""}
                      </div>
                    </div>
                  </div>
                `;
              }
              gridHtml += '</div>';

              token.content = gridHtml;
            }
          } catch (err) {
            console.error("Failed to render Contributors List (html_block):", err);
          }
          return;
        }

        // 2. Inline-level HTML tag (when nested inside a paragraph)
        if (token.type === "inline" && token.children) {
          const children = token.children;
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (
              (child.type === "html_inline" || child.type === "text") &&
              child.content.trim() === "<ContributorList />"
            ) {
              try {
                const contributorsPath = path.resolve(__dirname, "src/data/contributors.json");
                if (fs.existsSync(contributorsPath)) {
                  const contributorsData = JSON.parse(fs.readFileSync(contributorsPath, "utf8"));
                  
                  const discordIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.03.02.03.08-.01.11c-.52.3-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/></svg>`;
                  const githubIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
                  const portfolioIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;

                  let gridHtml = '<div class="contributors-grid">';
                  for (const c of contributorsData) {
                    let avatarUrl = "";
                    if (c.pfp && c.pfp !== "none") {
                      avatarUrl = c.pfp;
                    } else if (c.discordId && c.discordId !== "none") {
                      avatarUrl = `https://avatar-cyan.vercel.app/api/pfp/${c.discordId}/image`;
                    } else if (c.github && c.github !== "none") {
                      avatarUrl = `${c.github}.png`;
                    }

                    gridHtml += `
                      <div class="contributor-card">
                        <div class="contributor-card-left">
                          <div class="contributor-avatar-container">
                            <img src="${avatarUrl}" class="contributor-avatar" alt="${c.name}">
                            <span class="contributor-type-badge">${c.type}</span>
                          </div>
                          ${c.aka && c.aka !== "none" ? `<div class="contributor-aka">aka ${c.aka}</div>` : ""}
                        </div>
                        <div class="contributor-card-right">
                          <h3 class="contributor-name">${c.name}</h3>
                          ${c.description && c.description !== "none" ? `<p class="contributor-description">${c.description}</p>` : ""}
                          <div class="contributor-socials">
                            ${c.discord && c.discord !== "none" ? `<md-icon-button href="${c.discord}" target="_blank" class="contributor-social-link contributor-social-discord" title="Discord" aria-label="Discord">${discordIconSvg}</md-icon-button>` : ""}
                            ${c.github && c.github !== "none" ? `<md-icon-button href="${c.github}" target="_blank" class="contributor-social-link contributor-social-github" title="GitHub" aria-label="GitHub">${githubIconSvg}</md-icon-button>` : ""}
                            ${c.portfolio && c.portfolio !== "none" ? `<md-icon-button href="${c.portfolio}" target="_blank" class="contributor-social-link contributor-social-portfolio" title="Portfolio" aria-label="Portfolio">${portfolioIconSvg}</md-icon-button>` : ""}
                          </div>
                        </div>
                      </div>
                    `;
                  }
                  gridHtml += '</div>';

                  child.type = "html_inline";
                  child.content = gridHtml;
                }
              } catch (err) {
                console.error("Failed to render Contributors List (html_inline):", err);
              }
            }
          }
        }
      });
    });
  });

  eleventyConfig.on('eleventy.after', async ({ dir, results }) => {
    require('dotenv').config();
    const outDir = path.join(__dirname, dir.output);

    // Feedback config
    const fbWebhook = process.env.DISCORD_FEEDBACK_WEBHOOK || '';
    const seWebhook = process.env.DISCORD_SUGGEST_EDIT_WEBHOOK || '';
    const configPath = path.join(outDir, 'feedback-config.js');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `window.__FEEDBACK_WEBHOOK__ = '${fbWebhook}';\nwindow.__SUGGEST_EDIT_WEBHOOK__ = '${seWebhook}';\n`);

    // Search index — fallback: read files directly
    try {
      const inputDir = path.join(__dirname, dir.input);
      const files = [];
      function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.name.endsWith('.md')) files.push(full);
        }
      }
      walk(inputDir);

      const pages = files.map(f => {
        const rel = path.relative(inputDir, f);
        const url = '/' + rel.replace(/\\/g, '/').replace(/\.md$/, '') + '/';
        return { inputPath: f, url, data: { title: path.basename(f, '.md') } };
      });

      const docs = buildSearchIndex(pages);
      fs.writeFileSync(path.join(outDir, 'search-index.json'), JSON.stringify({ docs }));
    } catch (err) {
      console.error("Failed to generate search index:", err);
    }
  });

  return {
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dir: {
      input: "Docs",
      output: "dist",
      includes: "../src/templates",
      data: "../src/data",
    },
  };
};
