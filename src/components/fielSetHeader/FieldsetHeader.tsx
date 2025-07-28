import { Fieldset } from "primereact/fieldset";

interface Props {
  title: string;
  text: string;
}

export const FieldsetHeader = ({ title, text }: Props) => (
  <Fieldset className="text-[8px]">
    <div className="font-bold text-wrap">{title}</div>
    <div className="font-normal text-wrap">{text}</div>
  </Fieldset>
);
