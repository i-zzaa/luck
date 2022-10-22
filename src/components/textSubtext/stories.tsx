import { Meta, StoryObj } from "@storybook/react"
import { TextSubtext, TextSubtextProps  } from "./index";

export default {
  title: "Components/Text e Subtext",
  component: TextSubtext,
  args: {
    text: "Text",
    subtext: "subtext",
    size: 'xs',
    color: 'violet'
  }
} as Meta<TextSubtextProps>;

export const Default: StoryObj = {

};