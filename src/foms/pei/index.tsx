import { useEffect } from 'react';
import clsx from 'clsx';
import { Input, ButtonHeron } from '../../components';
import { PEICadastroFields } from '../../constants/formFields';
import { TIPO_PROTOCOLO } from '../../constants/protocolo';
import { usePeiForm } from './usePeiForm';
import { useIsTabRoute } from '../../components/Nav/useIsTabRoute';
import { ABOVE_TAB_BAR } from '../../components/Nav/bottomTabBarLayout';
import { MetaCard } from './MetaCard';

export default function PEICADASTRO({ paciente, param }: { paciente: { id: number; nome: string }; param?: any}) {
  const isTabRoute = useIsTabRoute();
  const {
    control,
    handleSubmit,
    loading,
    metas,
    dropDownList,
    tipoProtocolo,
    addMeta,
    addSubitem,
    removeMeta,
    renderDropdown,
    onSubmit,
    removeSubitemFromMeta,
    duplicateMeta,
    toggleMeta,
    openMetaId,
    focusId,
    metasInvalidas,
    limparInvalida,
    toast,
    fecharToast,
    programaAberto,
    setProgramaAberto,
    watch,
  } = usePeiForm({ paciente, param });

  useEffect(() => {
    renderDropdown();
  }, [renderDropdown]);

  const isPei = tipoProtocolo === TIPO_PROTOCOLO.pei;

  const resumoPrograma = [
    (watch('programaId') as any)?.nome,
    (watch('procedimentoEnsinoId') as any)?.nome,
  ]
    .filter(Boolean)
    .join(' · ');

  const numerosInvalidos = metas
    .map((meta: any, i: number) => (metasInvalidas.includes(meta.id) ? i + 1 : null))
    .filter(Boolean);

  return (
    <div className="mt-6 flex flex-col gap-3 pb-40">
      {/* Dados do programa — recolhido na edição, com resumo, pra metas
          aparecerem logo de cara (ver programaAberto em usePeiForm). */}
      <section className="bg-white border border-gray-200 rounded-[14px]">
        <button
          type="button"
          onClick={() => setProgramaAberto(!programaAberto)}
          aria-expanded={programaAberto}
          className="w-full min-h-[56px] flex items-center gap-3 px-3.5 py-3 text-left"
        >
          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[15px] font-bold text-[#27272a]">
              Dados do programa
            </span>
            {resumoPrograma && (
              <span className="text-[13px] text-gray-800 truncate">
                {resumoPrograma}
              </span>
            )}
          </span>
          <i
            className={clsx(
              'pi pi-chevron-down text-primary transition-transform',
              programaAberto && 'rotate-180'
            )}
          />
        </button>
        {programaAberto && (
          <div className="px-3.5 pb-4">
            {PEICadastroFields.map((item: any) => (
              <div key={item.id}>
                <Input
                  labelText={item.labelText}
                  id={item.id}
                  type={item.type}
                  customCol={item.customCol}
                  control={control}
                  options={item.type === 'select' ? dropDownList[item.name] : undefined}
                  buttonAdd={item.buttonAdd}
                  disabled={!isPei && item.name === 'programa'}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-between items-baseline px-1 pt-2">
        <h2 className="m-0 text-[13px] font-bold tracking-[0.08em] text-gray-800">
          METAS
        </h2>
        <span className="text-[13px] text-gray-800">
          {metas.length} {metas.length === 1 ? 'meta' : 'metas'}
        </span>
      </div>

      {numerosInvalidos.length > 0 && (
        <div
          role="alert"
          className="flex gap-2.5 items-start px-3.5 py-3 rounded-xl bg-[#fee2e2] text-[#991b1b] text-[14px] font-semibold leading-[1.35]"
        >
          <i className="pi pi-exclamation-circle mt-0.5" />
          <span>
            {numerosInvalidos.length === 1
              ? `A meta ${numerosInvalidos[0]} está sem descrição.`
              : `As metas ${numerosInvalidos.join(', ')} estão sem descrição.`}{' '}
            Preencha ou exclua para salvar.
          </span>
        </div>
      )}

      {metas.map((meta: any, key: number) => (
        <MetaCard
          key={meta.id}
          meta={meta}
          index={key}
          control={control}
          open={openMetaId === meta.id}
          onToggle={() => toggleMeta(meta.id)}
          isPei={isPei}
          invalid={metasInvalidas.includes(meta.id)}
          focusId={focusId}
          onDescChange={() => limparInvalida(meta.id)}
          onAddItem={(afterIndex) => addSubitem(key, afterIndex)}
          onRemoveItem={(index) => removeSubitemFromMeta(key, index)}
          onDuplicate={() => duplicateMeta(key)}
          onRemove={() => removeMeta(key)}
        />
      ))}

      {isPei && (
        <button
          type="button"
          onClick={addMeta}
          className="min-h-[56px] flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-primary text-[15px] font-bold text-primary"
        >
          <i className="pi pi-plus text-[14px]" />
          Adicionar meta
        </button>
      )}

      <div
        className={clsx(
          'fixed inset-x-0 z-10 px-4 pt-3 bg-background border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          // acima da tab bar flutuante quando ela está visível na mesma
          // tela (cadastro novo em /protocolo-av; na edição ela some —
          // ver Nav/useIsTabRoute.ts e Nav/bottomTabBarLayout.ts)
          isTabRoute ? ABOVE_TAB_BAR : 'bottom-0'
        )}
      >
        {/* Desfazer exclusão / confirmação curta — em cima do Salvar */}
        {toast && (
          <div
            role="status"
            className="absolute left-4 right-4 bottom-full mb-3 min-h-[52px] flex items-center gap-3 pl-4 pr-1.5 py-1 rounded-xl bg-[#27272a] text-white text-[14px] font-semibold shadow-lg"
          >
            <span className="flex-1">{toast.texto}</span>
            {toast.desfazer ? (
              <button
                type="button"
                onClick={toast.desfazer}
                className="h-11 px-3.5 rounded-lg text-[14px] font-bold text-[#e9c8f3]"
              >
                Desfazer
              </button>
            ) : (
              <button
                type="button"
                onClick={fecharToast}
                aria-label="Fechar aviso"
                className="w-11 h-11 flex items-center justify-center text-white"
              >
                <i className="pi pi-times text-[13px]" />
              </button>
            )}
          </div>
        )}
        <ButtonHeron
          text="Salvar"
          type="primary"
          size="full"
          typeButton="button"
          onClick={handleSubmit(onSubmit)}
          loading={loading}
        />
      </div>
    </div>
  );
}
