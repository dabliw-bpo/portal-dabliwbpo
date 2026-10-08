"use client";

import { useEffect, useRef, useState } from "react";
import { buttonGhost, buttonSecondary, buttonSuccess } from "@/components/ui/styles";

type Fase = "inicial" | "abrindo" | "ao_vivo" | "tirada" | "indisponivel" | "pulada";
type Origem = "ao_vivo" | "camera_do_aparelho";
type Motivo = "sem_suporte" | "permissao_negada" | "erro_camera";

/** Lado da foto guardada. Uns 60 KB: suficiente para reconhecer a pessoa, leve para enviar pelo celular. */
const LADO_FINAL = 640;
/** O servidor aceita até 350 mil caracteres; ficamos abaixo para sobrar folga. */
const LIMITE_CHARS = 330_000;
const QUALIDADES = [0.74, 0.62, 0.5, 0.4];

const MENSAGEM_INDISPONIVEL: Record<Motivo, string> = {
  sem_suporte:
    "Este navegador não deixa abrir a câmera por aqui. Isso é comum quando o link é aberto de dentro do Gmail ou do WhatsApp.",
  permissao_negada: "O acesso à câmera não foi liberado.",
  erro_camera: "A câmera não abriu. Ela pode estar em uso por outro aplicativo.",
};

/** Recorta o centro em quadrado, reduz e comprime em JPEG até caber no limite. */
function reduzir(fonte: CanvasImageSource, largura: number, altura: number): string {
  const lado = Math.min(largura, altura);
  const saida = Math.min(LADO_FINAL, lado);
  const canvas = document.createElement("canvas");
  canvas.width = saida;
  canvas.height = saida;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.drawImage(fonte, (largura - lado) / 2, (altura - lado) / 2, lado, lado, 0, 0, saida, saida);
  for (const qualidade of QUALIDADES) {
    const url = canvas.toDataURL("image/jpeg", qualidade);
    if (url.length <= LIMITE_CHARS) return url;
  }
  return canvas.toDataURL("image/jpeg", 0.3);
}

function carregarImagem(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem ilegível"));
    };
    img.src = url;
  });
}

/**
 * O passo da selfie na janela de assinatura. A foto sai de dentro do portal,
 * com a câmera frontal aberta ao vivo (não de um arquivo da galeria). Quando o
 * navegador não deixa abrir a câmera, há duas saídas honestas: o aplicativo de
 * câmera do aparelho, ou assinar sem selfie — e o comprovante registra qual.
 *
 * O resultado vai para o formulário em três campos ocultos.
 */
export function SelfieCapture({
  ativa,
  onReadyChange,
}: {
  ativa: boolean;
  onReadyChange: (pronta: boolean) => void;
}) {
  const [fase, setFase] = useState<Fase>("inicial");
  const [foto, setFoto] = useState("");
  const [origem, setOrigem] = useState<Origem>("ao_vivo");
  const [motivo, setMotivo] = useState<Motivo>("erro_camera");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function pararCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  // Fechou a janela: o próximo uso começa do zero. Ajustar o estado durante a
  // renderização evita o quadro em que a foto antiga ainda apareceria.
  const [ativaAntes, setAtivaAntes] = useState(ativa);
  if (ativa !== ativaAntes) {
    setAtivaAntes(ativa);
    if (!ativa) {
      setFase("inicial");
      setFoto("");
    }
  }

  // ...e a câmera, que é externa ao React, não pode ficar ligada.
  useEffect(() => {
    if (!ativa) pararCamera();
  }, [ativa]);

  useEffect(() => () => pararCamera(), []);

  // O vídeo só existe na tela depois que a fase muda; é aqui que ele recebe a câmera.
  useEffect(() => {
    const video = videoRef.current;
    if (fase === "ao_vivo" && video && streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => undefined);
    }
  }, [fase]);

  const pronta = fase === "tirada" || fase === "pulada";
  useEffect(() => {
    onReadyChange(pronta);
  }, [pronta, onReadyChange]);

  async function abrirCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMotivo("sem_suporte");
      setFase("indisponivel");
      return;
    }
    setFase("abrindo");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      setFase("ao_vivo");
    } catch (erro) {
      const nome = erro instanceof DOMException ? erro.name : "";
      setMotivo(
        nome === "NotAllowedError" || nome === "SecurityError" || nome === "PermissionDeniedError"
          ? "permissao_negada"
          : "erro_camera"
      );
      setFase("indisponivel");
    }
  }

  function tirarFoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setFoto(reduzir(video, video.videoWidth, video.videoHeight));
    setOrigem("ao_vivo");
    pararCamera();
    setFase("tirada");
  }

  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    try {
      const img = await carregarImagem(arquivo);
      setFoto(reduzir(img, img.naturalWidth, img.naturalHeight));
      setOrigem("camera_do_aparelho");
      setFase("tirada");
    } catch {
      setMotivo("erro_camera");
      setFase("indisponivel");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-areia">Sua selfie</span>

      <input type="hidden" name="selfieImage" value={fase === "tirada" ? foto : ""} />
      <input type="hidden" name="selfieSource" value={fase === "tirada" ? origem : ""} />
      <input type="hidden" name="selfieSkip" value={fase === "pulada" ? motivo : ""} />

      {fase === "inicial" && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm leading-relaxed text-areia">
            Para concluir, tire uma selfie. Ela comprova que foi você que assinou.
          </p>
          <button type="button" onClick={abrirCamera} className={buttonSecondary}>
            Abrir a câmera
          </button>
        </div>
      )}

      {fase === "abrindo" && (
        <p className="text-sm text-areia" role="status">
          Abrindo a câmera… se o navegador perguntar, toque em Permitir.
        </p>
      )}

      {fase === "ao_vivo" && (
        <div className="flex flex-col items-start gap-3">
          <div className="aspect-square w-full max-w-[240px] overflow-hidden border border-fio-forte bg-breu">
            {/* Espelhado só na prévia, como num espelho; a foto guardada sai sem espelhar. */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              aria-label="Prévia da câmera"
              className="h-full w-full -scale-x-100 object-cover"
            />
          </div>
          <button type="button" onClick={tirarFoto} className={buttonSuccess}>
            Tirar foto
          </button>
        </div>
      )}

      {fase === "tirada" && (
        <div className="flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- prévia local em data URL */}
          <img
            src={foto}
            alt="A selfie que você tirou"
            className="aspect-square w-full max-w-[240px] border border-fio-forte object-cover"
          />
          <button type="button" onClick={abrirCamera} className={buttonGhost}>
            Tirar outra
          </button>
        </div>
      )}

      {fase === "indisponivel" && (
        <div className="flex flex-col items-start gap-3" role="alert">
          <p className="text-sm leading-relaxed text-terracota">{MENSAGEM_INDISPONIVEL[motivo]}</p>
          <p className="text-sm leading-relaxed text-areia">
            Você pode tirar a foto pelo aplicativo de câmera do celular, ou assinar sem selfie: isso
            fica registrado no comprovante.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className={`${buttonSecondary} cursor-pointer`}>
              Usar a câmera do celular
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={aoEscolherArquivo}
                className="sr-only"
              />
            </label>
            <button type="button" onClick={() => setFase("pulada")} className={buttonGhost}>
              Assinar sem selfie
            </button>
          </div>
        </div>
      )}

      {fase === "pulada" && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm leading-relaxed text-areia">
            Você vai assinar sem selfie. O comprovante registra o motivo.
          </p>
          <button type="button" onClick={abrirCamera} className={buttonGhost}>
            Tentar de novo
          </button>
        </div>
      )}

      <p className="text-xs leading-relaxed text-pedra">
        Sua foto fica guardada junto com a assinatura e vai no comprovante enviado à empresa, para
        comprovar que foi você que assinou.
      </p>
    </div>
  );
}
