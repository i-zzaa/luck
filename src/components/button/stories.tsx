import { Meta, StoryObj } from "@storybook/react"
import { ButtonHeron, ButtonProps  } from "./index";

export default {
  title: "Components/ButtonHeron",
  component: ButtonHeron,
  args: {
    text: "Button",
    color: 'primary',
  }
} as Meta<ButtonProps>;

export const primary: StoryObj = {};

export const Second: StoryObj<ButtonProps> = {
  args: {
    text: "Button",
    color: 'second',
  }
};

export const buttonIcon: StoryObj<ButtonProps> = {
  args: {
    text: "Button",
    icon: 'pi pi-user-plus',
    color: 'second',
    size: 'icon'
  }
};

export const buttonLoading: StoryObj<ButtonProps> = {
  args: {
    text: "Loading",
    color: 'primary',
    size: 'icon',
    loading: true
  }
};