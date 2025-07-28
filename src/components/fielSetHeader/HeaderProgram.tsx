import { FieldsetHeader } from "./FieldsetHeader";

interface HeaderProgramaProps {
  estimuloDiscriminativo?: string;
  resposta?: string;
  estimuloReforcadorPositivo?: string;
}

export const HeaderPrograma = ({
  estimuloDiscriminativo = '',
  resposta = '',
  estimuloReforcadorPositivo = ''
}: HeaderProgramaProps) => {
  return (
    <div className="grid grid-cols-3 gap-1">
      {estimuloDiscriminativo && (
        <FieldsetHeader title="SD (estímulo discriminativo)" text={estimuloDiscriminativo} />
      )}
      {resposta && (
        <FieldsetHeader title="Resposta" text={resposta} />
      )}
      {estimuloReforcadorPositivo && (
        <FieldsetHeader title="SR+ (estímulo reforçador positivo)" text={estimuloReforcadorPositivo} />
      )}
    </div>
  );
};
