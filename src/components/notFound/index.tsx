import { Title } from '../title';

export function NotFound() {
  return (
    <div className="uppercase flex items-center gap-4 m-auto mt-2">
      <i className="pi pi-folder-open"></i>
      <Title color="gray">Não há itens</Title>
    </div>
  );
}
