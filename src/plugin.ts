import unified from 'unified';
import { Node, Parent } from 'unist';
// import { VFileCompatible } from 'vfile';
import visit from 'unist-util-visit';
import { Paragraph } from 'mdast';
import { inspect } from 'unist-util-inspect';
import parser from 'remark-parse';
import toHast from 'remark-rehype';
import compiler from 'rehype-stringify';
import { all, H } from 'mdast-util-to-hast';
import { isParent, isText, isParagraph } from './util';

const LINK_PREFIX = `\n[`;
const LINK_SUFFIX = `)\n`;

const isLink = (node: unknown): node is Paragraph => {
  if (isParagraph(node)) return false;

  const { children } = node as Paragraph;

  const firstChild = children[0];
  if (!(isText(firstChild) && firstChild.value.startsWith(LINK_PREFIX))) {
    return false;
  }

  const lastChild = children[children.length - 1];
  if (!(isText(lastChild) && lastChild.value.endsWith(LINK_SUFFIX))) {
    return false;
  }

  return true;
};

export const print: unified.Plugin = () => (tree: Node) => {
  // eslint-disable-next-line no-console
  console.log(inspect(tree));
};

const processFirstChild = (children: Node[], identifier: string): Node[] => {
  const firstChild = children[0];
  const firstValue = firstChild.value as string;

  const [_, ...tail] = children;

  return firstValue === identifier
    ? tail
    : [{ ...firstChild, value: firstValue.slice(identifier.length) }, ...tail];
};

const processLastChild = (children: Array<Node>, identifier: string) => {
  const lastIndex = children.length - 1;
  const lastChild = children[lastIndex];
  const lastValue = lastChild.value as string;

  const popped = children.slice(0, lastIndex);

  return lastValue === identifier
    ? popped
    : [
        ...popped,
        {
          ...lastChild,
          value: lastValue.slice(0, lastValue.length - identifier.length),
        },
      ];
};

const visitor = (
  node: Paragraph,
  index: number,
  parent: Parent | undefined,
) => {
  if (!isParent(parent)) return;

  const children = [...node.children];
  const processedPrefix = processFirstChild(children, LINK_PREFIX);
  const processedChildren = processLastChild(processedPrefix, LINK_SUFFIX);

  parent.children.splice(index, 1, {
    type: 'message',
    processedChildren,
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const handler = (h: H, node: Node) => ({
  type: 'element',
  tagName: 'div',
  properties: {
    className: ['msg'],
  },
  children: all(h, node),
});

const plugin: unified.Plugin = () => (tree: Node) =>
  visit(tree, isLink, visitor);

export const processor = unified()
  .use(parser)
  .use(plugin)
  .use(toHast, {
    handlers: {
      message: handler,
    },
  })
  .use(compiler);
