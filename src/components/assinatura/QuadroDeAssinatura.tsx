import clsx from 'clsx';
import { useCallback, useEffect, useRef } from 'react';
import {
  deveGuardarPonto,
  pontoNoQuadro,
  tracoCheio,
  type PontoAssinatura,
  type TracoAssinatura,
} from './traco';

interface Props {
  traco: TracoAssinatura;
  onChange: (traco: TracoAssinatura) => void;
  desabilitado?: boolean;
  /** Texto de dentro do quadro enquanto ninguém assinou. */
  convite?: string;
  className?: string;
}

const COR_DO_TRACO = '#1f2937';
const ESPESSURA = 2.4;
// Linha de base, como a do papel: dá onde apoiar a assinatura.
const COR_DA_LINHA = '#CBCBCB';
const ALTURA_DA_LINHA = 0.78;

/**
 * Quadro onde a terapeuta assina com o dedo (ou com o mouse). O desenho
 * sai daqui em fração do quadro — ver traco.ts.
 *
 * O traço é desenhado direto no canvas enquanto o dedo anda e só sobe
 * para quem chamou quando o dedo levanta: avisar a cada ponto
 * re-renderizaria a tela dezenas de vezes por segundo e o traço sairia
 * picotado.
 */
export function QuadroDeAssinatura({ traco, onChange, desabilitado, convite, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracoRef = useRef<TracoAssinatura>(traco);
  const desenhandoRef = useRef(false);
  // O que este quadro mandou para cima por último: a prop que volta igual
  // é o nosso próprio traço, e não um "limpar" de fora.
  const enviadoRef = useRef<TracoAssinatura | null>(null);

  const redesenhar = useCallback(() => {
    const canvas = canvasRef.current;
    const contexto = canvas?.getContext('2d');
    if (!canvas || !contexto) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;

    // Canvas em pixels do aparelho: sem isso o traço sai borrado.
    const escala = window.devicePixelRatio || 1;
    const larguraReal = Math.round(width * escala);
    const alturaReal = Math.round(height * escala);
    if (canvas.width !== larguraReal || canvas.height !== alturaReal) {
      canvas.width = larguraReal;
      canvas.height = alturaReal;
    }

    contexto.setTransform(escala, 0, 0, escala, 0, 0);
    contexto.clearRect(0, 0, width, height);

    contexto.strokeStyle = COR_DA_LINHA;
    contexto.lineWidth = 1;
    contexto.beginPath();
    contexto.moveTo(width * 0.06, height * ALTURA_DA_LINHA);
    contexto.lineTo(width * 0.94, height * ALTURA_DA_LINHA);
    contexto.stroke();

    contexto.strokeStyle = COR_DO_TRACO;
    contexto.lineWidth = ESPESSURA;
    contexto.lineCap = 'round';
    contexto.lineJoin = 'round';

    for (const linha of tracoRef.current) {
      if (!linha.length) continue;
      contexto.beginPath();
      contexto.moveTo(linha[0].x * width, linha[0].y * height);
      for (const ponto of linha.slice(1)) contexto.lineTo(ponto.x * width, ponto.y * height);
      if (linha.length === 1) contexto.lineTo(linha[0].x * width, linha[0].y * height);
      contexto.stroke();
    }
  }, []);

  // Traço que veio de fora (limpar) substitui o daqui.
  useEffect(() => {
    if (traco === enviadoRef.current) return;
    tracoRef.current = traco;
    redesenhar();
  }, [traco, redesenhar]);

  // Girar o aparelho muda a largura do quadro; o traço é relativo, então
  // é só redesenhar.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') {
      redesenhar();
      return;
    }
    const observador = new ResizeObserver(() => redesenhar());
    observador.observe(canvas);
    return () => observador.disconnect();
  }, [redesenhar]);

  const pontoDoEvento = (evento: { clientX: number; clientY: number }): PontoAssinatura | null => {
    const canvas = canvasRef.current;
    return canvas ? pontoNoQuadro(evento, canvas.getBoundingClientRect()) : null;
  };

  const avisar = () => {
    // Cópia nova a cada aviso: mutar o mesmo array não dispararia render.
    const copia = tracoRef.current.map((linha) => [...linha]);
    enviadoRef.current = copia;
    onChange(copia);
  };

  const aoEncostar = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    if (desabilitado || tracoCheio(tracoRef.current)) return;
    const ponto = pontoDoEvento(evento);
    if (!ponto) return;

    // Segura o dedo neste quadro: arrastar para fora continua desenhando.
    evento.currentTarget.setPointerCapture?.(evento.pointerId);
    desenhandoRef.current = true;
    tracoRef.current = [...tracoRef.current, [ponto]];
    redesenhar();
  };

  const aoArrastar = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhandoRef.current || desabilitado) return;
    const ponto = pontoDoEvento(evento);
    const linha = tracoRef.current[tracoRef.current.length - 1];
    if (!ponto || !linha || !deveGuardarPonto(linha[linha.length - 1], ponto)) return;
    if (tracoCheio(tracoRef.current)) return;
    linha.push(ponto);
    redesenhar();
  };

  const aoLevantar = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhandoRef.current) return;
    evento.currentTarget.releasePointerCapture?.(evento.pointerId);
    desenhandoRef.current = false;
    avisar();
  };

  const vazio = !traco.length;

  return (
    <div className={clsx('relative', className)}>
      <canvas
        ref={canvasRef}
        // O dedo desenha; a tela não rola por baixo dele.
        className={clsx(
          'block h-[168px] w-full touch-none rounded-[14px] border-2 border-dashed bg-white',
          desabilitado ? 'border-gray-300 opacity-60' : 'border-violet-600 cursor-crosshair'
        )}
        role="img"
        aria-label={vazio ? 'Quadro de assinatura, ainda em branco' : 'Quadro com a assinatura'}
        data-testid="quadro-assinatura"
        onPointerDown={aoEncostar}
        onPointerMove={aoArrastar}
        onPointerUp={aoLevantar}
        onPointerCancel={aoLevantar}
      />
      {vazio && (
        <span className="pointer-events-none absolute inset-x-0 bottom-[18px] text-center text-[13px] text-gray-800">
          {convite ?? 'Assine aqui com o dedo'}
        </span>
      )}
    </div>
  );
}
