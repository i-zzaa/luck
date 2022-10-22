import { Meta, StoryObj } from "@storybook/react"
import { Title, TitleProps  } from "./index";

export default {
  title: "Components/Title",
  component: Title,
  args: {
    children: "Title",
    size: 'xs',
    color: 'violet'
  }
} as Meta<TitleProps>;

export const Default: StoryObj = {

};