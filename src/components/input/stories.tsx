import { Meta, StoryObj } from "@storybook/react"
import { Input, InputProps, OptionsProps  } from "./index";

const arrOptions: OptionsProps[] = [
  { value: "foo", nome: "foo" },
  { value: "bar", nome: "bar" },
  { value: "baz", nome: "baz" },
]

export default {
  title: "Components/Input",
  component: Input,
  args: {
    id: 'input-simples',
    type: 'text',
    labelText: 'Simples',
    onChange: () => {console.log('Input date changed')},
  }
} as Meta<InputProps>;

export const Simples: StoryObj<InputProps> = {};

export const Date: StoryObj<InputProps> = {
  args: {
    id: 'input-date',
    type: 'date',
    labelText: 'Date',
    onChange: () => {console.log('Input date changed')},
  }
};

export const Number: StoryObj<InputProps> = {
  args: {
    id: 'input-number',
    type: 'number',
    labelText: 'number',
    onChange: () => {console.log('Input date changed')},
  }
};

export const Telefone: StoryObj<InputProps> = {
  args: {
    id: 'input-tel',
    type: 'tel',
    labelText: 'telefone',
    onChange: () => {console.log('Input date changed')},
  }
};

export const Textarea: StoryObj<InputProps> = {
  args: {
    id: 'input-textarea',
    type: 'textarea',
    labelText: 'textarea',
    customClass: "col-span-6 sm:col-span-6",
    onChange: () => {console.log('Input date changed')},
  }
};

export const select: StoryObj<InputProps> = {
  args: {
    id: 'input-select',
    type: 'select',
    labelText: 'select',
    onChange: () => {console.log('Input date changed')}
  }
};

export const multiselect: StoryObj<InputProps> = {
  args: {
    id: 'input-multiselect',
    type: 'multiselect',
    labelText: 'multiselect',
    onChange: () => {console.log('Input date changed')},
  }
};

export const inputSwitch: StoryObj<InputProps> = {
  args: {
    id: 'input-switch',
    type: 'switch',
    labelText: 'switch',
    onChange: () => {console.log('Input date changed')},
  }
};
