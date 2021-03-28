import { JsonInput } from "jsonhtmlfyer";

export declare namespace h {
  export namespace JSX {
    type Element = JsonInput;

    export type HTMLAttributes =
      & JsonInput["attributes"]
      & { style?: JsonInput["styles"] & { backdropFilter?: string } };

    export type HTMLElements = { [El in JsonInput["tag"]]: HTMLAttributes };

    type IntrinsicElements = HTMLElements;
    type IntrinsicAttributes = { children?: never };
  }
}

type Component = (...args: unknown[]) => JsonInput;

export function h(
  type: keyof h.JSX.HTMLElements | Component,
  props?: h.JSX.HTMLAttributes,
  ...children: JsonInput[]
): JsonInput {
  const style = props?.style;
  delete props?.style;

  if (typeof type === "function") {
    return type(props, ...children);
  }

  return {
    tag: type,
    attributes: props,
    styles: style,
    content: children.flatMap((c) =>
      typeof c !== "object" ? { tag: "span", content: `${c}` } : c
    ),
  };
}
