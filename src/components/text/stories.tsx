import { Meta, StoryObj } from "@storybook/react"
import { Text, TextProps  } from "./index";

export default {
  title: "Components/Text",
  component: Text,
  args: {
    children: "Text",
    size: 'xs',
    color: 'violet'
  }
} as Meta<TextProps>;

export const Default: StoryObj = {

};