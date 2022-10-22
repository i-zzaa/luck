import { Meta, StoryObj } from "@storybook/react"
import { ItemList, itemListCompleteProps  } from "./index";


export default {
  title: "Components/itemList",
  component: ItemList.Complete,
  args: {
    tags: [
      {type: 'to', disabled: false}, 
      {type: 'psico', disabled: false}
    ],
    textPrimaryLeft: 'Texto Principal', 
    textPrimaryCenter: 'Texto center', 
    textPrimaryRight: 'texto secudário',
    textSecondLeft: 'texto secudário',
    textSecondCenter: 'texto center',
    textSecondRight: 'texto secudário',
    textFooter: 'texto footer',
    textButtonFooter: 'button',
    iconButtonFooter: 'pi pi-lock-open',
    typeButtonFooter: 'second',
    sizeButtonFooter: 'md',
  }
} as Meta<itemListCompleteProps>;


export const Complete: StoryObj<itemListCompleteProps> = {};

export const Simples  = () => (
  <ItemList.Simples
  textPrimaryLeft= 'Texto Principal' 
  textPrimaryRight= 'texto secudário'
  textSecondLeft= 'texto secudário'
  textButtonFooter= 'button'
  iconButtonFooter= 'pi pi-lock-open'
  typeButtonFooter= 'second'
  sizeButtonFooter= 'md'
  onClickLink={() => console.log('dajdijad')}
  onClick={() => console.log('dajdijad')}
></ItemList.Simples>
)
