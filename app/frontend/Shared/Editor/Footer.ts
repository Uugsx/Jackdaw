import { mergeAttributes, Node } from "@tiptap/core";

export interface FooterOptions {
  HTMLAttributes: Record<string, any>,
}

/** `<footer>` Node — used for mail signatures (`class="signature"`). */
export const Footer = Node.create<FooterOptions>({
  name: 'footer',

  group: 'block',

  content: 'block+',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class'),
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {};
          }
          return { class: attributes.class };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'footer', }
    ]
  },


  renderHTML({HTMLAttributes}) {
    return ['footer', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
});