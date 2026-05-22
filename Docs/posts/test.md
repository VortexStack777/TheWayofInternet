---
title: Test Post
subtitle: Technical verification playground for markdown rendering engines
editor: 𝖘𝖚𝖕𝖗𝖊𝖒𝖊𝖒𝖚𝖍𝖎𝖙
date: 2026-03-25
icon: science
---

<Post />

I am testing site utils.

# Testing Auto-Tagging

- [Entry](https://example.com) | This Site Sucks | So you should check notes | [Note](/notes#testnote)

- [Entry](https://example.com) | This Site have some cool Resources | [Resource](/notes#testnote)

# Testing Icon-Transformer

- [Discord](https://discord.com) [GitHub](https://github.com) [Reddit](https://www.reddit.com) [X](https://x.com) [YouTube](https://www.youtube.com) [Instagram](https://www.instagram.com) [Facebook](https://www.facebook.com) [Telegram](https://www.telegram.org)

# Testing Auto Bold

- [A normal link](https://example.com)
- ⭐ [A starred link is auto-bolded](https://example.com)
- 🌟 [A superstarred link is auto-bold-italicized](https://example.com)

# MDIT Plugin Examples

## @mdit/plugin-abbr

HTML keeps the markup short.

*[HTML]: Hyper Text Markup Language

## @mdit/plugin-alert

> [!NOTE]
> Alert blocks render a styled note.

## @mdit/plugin-align

::: center
Centered alignment container.
:::

## @mdit/plugin-attrs

### Heading with attributes {.mdit-attrs-example #mdit-attrs-example}

## @mdit/plugin-container

::: info
Generic container content.
:::

## @mdit/plugin-demo

::: demo Demo block
```js
console.log("demo plugin");
```
:::

## @mdit/plugin-dl

Term
: Definition list item.

## @mdit/plugin-embed

{% raw %}
{% youtube dQw4w9WgXcQ %}
{% endraw %}

## @mdit/plugin-emoji

:sparkles: Emoji shortcode example.

## @mdit/plugin-figure

![Figure logo](/logo.png)

Figure caption text.

## @mdit/plugin-footnote

Footnotes can be referenced inline.[^mdit-footnote]

[^mdit-footnote]: This is a footnote example.

## @mdit/plugin-icon

::material-symbols:home =28 /#38d9ff::

## @mdit/plugin-img-lazyload

![Lazy loaded logo](/logo.png)

## @mdit/plugin-img-mark

![Light-only logo](/logo.png#light)

## @mdit/plugin-img-size

![Sized logo =80x80](/logo.png)

## @mdit/plugin-include

@include: src/templates/mdit-examples/include.md

## @mdit/plugin-inline-rule

The installed inline-rule engine powers examples such as ++inserted text++, ==marked text==, and !!spoiler text!!.

## @mdit/plugin-ins

++inserted text++

## @mdit/plugin-katex

$E = mc^2$

## @mdit/plugin-katex-slim

`@mdit/plugin-katex-slim` is not installed in this project.

## @mdit/plugin-layout

`@mdit/plugin-layout` is not installed in this project.

## @mdit/plugin-mark

==marked text==

## @mdit/plugin-mathjax

`@mdit/plugin-mathjax` is not installed in this project.

## @mdit/plugin-mathjax-slim

`@mdit/plugin-mathjax-slim` is not installed in this project.

## @mdit/plugin-plantuml

@startuml
Alice -> Bob: PlantUML example
@enduml

## @mdit/plugin-ruby

{漢字:かんじ}

## @mdit/plugin-snippet

<<< _includes/mdit-examples/snippet.js

## @mdit/plugin-spoiler

!!spoiler text!!

## @mdit/plugin-stylize

*TokyoInsiders* is transformed by the project stylize configuration.

## @mdit/plugin-sub

H~2~O

## @mdit/plugin-sup

x^2^

## @mdit/plugin-tab

::: tabs
@tab First tab
First tab content.

@tab Second tab
Second tab content.
:::

## @mdit/plugin-tasklist

- [x] Completed task
- [ ] Pending task

## @mdit/plugin-tex

$$
a^2 + b^2 = c^2
$$

## @mdit/plugin-uml

@start
Bob -> Alice: UML example
@end
