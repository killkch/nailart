'use client';

/**
 * components/ui/ai-prompt-box.tsx
 *
 * AI 프롬프트 입력 박스 컴포넌트
 * ─────────────────────────────────────────────────────────────
 * [기능 사양]
 * 1. 텍스트 입력 및 자동 높이 조절
 * 2. 이미지 첨부: 개당 최대 5MB, 최대 10개 첨부 제한
 * 3. 다중 파일 업로드(multiple), 드래그 앤 드롭, 클립보드 붙여넣기(Paste) 지원
 * 4. 첨부 이미지 개별 삭제(X 버튼) 및 실시간 개수 카운터 표시 (예: 3/10)
 * 5. 용량 초과 또는 개수 초과 시 친절한 안내 메시지 표시
 * 6. 음성 녹음 및 모드 토글(Search, Think, Canvas) 지원
 */

import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  ArrowUp,
  Paperclip,
  Square,
  X,
  StopCircle,
  Mic,
  Globe,
  BrainCog,
  FolderCode,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── 첨부 파일 제한 상수 정의 ─────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 개당 5MB (바이트 단위)
const MAX_FILE_COUNT = 10; // 최대 10개 첨부 가능

// ── className 결합 유틸 ──────────────────────────────────────
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

// ── Textarea 컴포넌트 ────────────────────────────────────────
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none',
        className
      )}
      ref={ref}
      rows={1}
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#444 transparent' }}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// ── Tooltip 컴포넌트 ─────────────────────────────────────────
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-[#333] bg-[#1F2023] px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ── Dialog 컴포넌트 (이미지 원본 확대용) ─────────────────────
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-[#333] bg-[#1F2023] p-0 shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-[#2E3033]/80 p-2 hover:bg-[#2E3033] transition-all cursor-pointer">
        <X className="h-5 w-5 text-gray-200 hover:text-white" />
        <span className="sr-only">닫기</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-gray-100',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ── Button 컴포넌트 ──────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white hover:bg-white/80 text-black',
      outline: 'border border-[#444] bg-transparent hover:bg-[#3A3A40]',
      ghost: 'bg-transparent hover:bg-[#3A3A40]',
    };
    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6',
      icon: 'h-8 w-8 rounded-full aspect-square',
    };
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// ── VoiceRecorder 컴포넌트 ───────────────────────────────────
interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  visualizerBars = 32,
}) => {
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (isRecording) {
      onStartRecording();
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onStopRecording(time);
      setTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full transition-all duration-300 py-3',
        isRecording ? 'opacity-100' : 'opacity-0 h-0'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-sm text-white/80">{formatTime(time)}</span>
      </div>
      <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
        {[...Array(visualizerBars)].map((_, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full bg-white/50 animate-pulse"
            style={{
              height: `${Math.max(15, Math.random() * 100)}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ── ImageViewDialog 컴포넌트 ─────────────────────────────────
interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}
const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[90vw] md:max-w-[800px]">
        <DialogTitle className="sr-only">이미지 미리보기</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-[#1F2023] rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="원본 미리보기"
            className="w-full max-h-[80vh] object-contain rounded-2xl"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// ── PromptInput Context ───────────────────────────────────────
interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: '',
  setValue: () => {},
  maxHeight: 240,
});
function usePromptInput() {
  return React.useContext(PromptInputContext);
}

// ── PromptInput Root ──────────────────────────────────────────
interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
      onDragOver,
      onDragLeave,
      onDrop,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || '');
    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: value ?? internalValue,
            setValue: onValueChange ?? handleChange,
            maxHeight,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              'rounded-3xl border border-[#444] bg-[#1F2023] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300',
              isLoading && 'border-red-500/70',
              className
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  }
);
PromptInput.displayName = 'PromptInput';

// ── PromptInputTextarea ───────────────────────────────────────
interface PromptInputTextareaProps extends React.ComponentProps<typeof Textarea> {
  disableAutosize?: boolean;
}
const PromptInputTextarea: React.FC<PromptInputTextareaProps> = ({
  className,
  onKeyDown,
  disableAutosize = false,
  ...props
}) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height =
      typeof maxHeight === 'number'
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn('text-base', className)}
      disabled={disabled}
      {...props}
    />
  );
};

// ── PromptInputActions ────────────────────────────────────────
const PromptInputActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('flex items-center gap-2', className)} {...props}>
    {children}
  </div>
);

// ── PromptInputAction ─────────────────────────────────────────
interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({
  tooltip,
  children,
  side = 'top',
  ...props
}) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

// ── CustomDivider ─────────────────────────────────────────────
const CustomDivider: React.FC = () => (
  <div className="relative h-6 w-[1.5px] mx-1">
    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#9b87f5]/70 to-transparent rounded-full" />
  </div>
);

// ── ToggleButton ──────────────────────────────────────────────
interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
  icon: React.ReactNode;
  label: string;
}
const ToggleButton: React.FC<ToggleButtonProps> = ({
  active,
  onClick,
  activeColor,
  activeBg,
  activeBorder,
  icon,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8 cursor-pointer',
      active
        ? `border-[${activeBorder}] text-[${activeColor}]`
        : 'bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]'
    )}
    style={
      active
        ? { background: activeBg, borderColor: activeBorder, color: activeColor }
        : {}
    }
  >
    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
      <motion.div
        animate={{ rotate: active ? 360 : 0, scale: active ? 1.1 : 1 }}
        whileHover={{
          rotate: active ? 360 : 15,
          scale: 1.1,
          transition: { type: 'spring', stiffness: 300, damping: 10 },
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
      >
        {icon}
      </motion.div>
    </div>
    <AnimatePresence>
      {active && (
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);

// ── Main PromptInputBox Export ────────────────────────────────
interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(
  (
    {
      onSend = () => {},
      isLoading = false,
      placeholder = '어떤 썸네일을 만들까요? 유튜브 채널 주제와 원하는 분위기를 알려주세요...',
      className,
    },
    ref
  ) => {
    const [input, setInput] = React.useState('');
    const [files, setFiles] = React.useState<File[]>([]);
    const [filePreviews, setFilePreviews] = React.useState<string[]>([]);
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
    const [isRecording, setIsRecording] = React.useState(false);
    const [showSearch, setShowSearch] = React.useState(false);
    const [showThink, setShowThink] = React.useState(false);
    const [showCanvas, setShowCanvas] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);

    // 이미지 파일 여부 판별
    const isImageFile = (file: File) => file.type.startsWith('image/');

    // 경고 메시지 임시 표시 (3초 후 자동 해제)
    const showWarning = (msg: string) => {
      setWarningMessage(msg);
      setTimeout(() => setWarningMessage(null), 3500);
    };

    /**
     * 다중 파일 검증 및 추가 처리 함수
     * 1. 개당 용량 제한: 최대 5MB (MAX_FILE_SIZE)
     * 2. 총 첨부 개수 제한: 최대 10개 (MAX_FILE_COUNT)
     */
    const processFiles = (newFiles: File[]) => {
      const validImages = newFiles.filter(isImageFile);

      if (validImages.length === 0) {
        showWarning('이미지 파일(PNG, JPG, WEBP 등)만 첨부할 수 있습니다.');
        return;
      }

      // 현재 파일 개수 + 추가할 파일 개수 계산
      const currentCount = files.length;
      if (currentCount >= MAX_FILE_COUNT) {
        showWarning(`이미지는 최대 ${MAX_FILE_COUNT}개까지만 첨부할 수 있습니다.`);
        return;
      }

      const availableSlots = MAX_FILE_COUNT - currentCount;
      let filesToProcess = validImages;

      if (validImages.length > availableSlots) {
        showWarning(
          `최대 ${MAX_FILE_COUNT}개까지 첨부 가능하여 ${availableSlots}개의 이미지만 추가되었습니다.`
        );
        filesToProcess = validImages.slice(0, availableSlots);
      }

      // 5MB 용량 검증 필터링
      const allowedFiles: File[] = [];
      let hasOversized = false;

      filesToProcess.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          hasOversized = true;
        } else {
          allowedFiles.push(file);
        }
      });

      if (hasOversized) {
        showWarning('개당 5MB를 초과하는 이미지는 제외되었습니다.');
      }

      if (allowedFiles.length === 0) return;

      // 새 파일들의 미리보기 Base64 읽기
      const readPromises = allowedFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readPromises).then((newPreviews) => {
        setFiles((prev) => [...prev, ...allowedFiles]);
        setFilePreviews((prev) => [...prev, ...newPreviews]);
      });
    };

    // 개별 파일 삭제 핸들러 (X 버튼 클릭 시 해당 인덱스만 제거)
    const removeFile = (indexToRemove: number) => {
      setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
      setFilePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // ── 드래그 앤 드롭 이벤트 핸들러 ──────────────────────────
    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) processFiles(droppedFiles);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [files]
    );

    // ── 클립보드 붙여넣기(Paste) 이벤트 핸들러 ────────────────
    const handlePaste = React.useCallback(
      (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const pastedFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) pastedFiles.push(file);
          }
        }

        if (pastedFiles.length > 0) {
          e.preventDefault();
          processFiles(pastedFiles);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [files]
    );

    React.useEffect(() => {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    // ── 전송 핸들러 ──────────────────────────────────────────
    const handleSubmit = () => {
      if (!input.trim() && files.length === 0) return;
      const prefix = showSearch
        ? '[Search: '
        : showThink
        ? '[Think: '
        : showCanvas
        ? '[Canvas: '
        : '';
      const formatted = prefix ? `${prefix}${input}]` : input;
      onSend(formatted, files);
      setInput('');
      setFiles([]);
      setFilePreviews([]);
    };

    const hasContent = input.trim() !== '' || files.length > 0;

    return (
      <>
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className={cn(
            'w-full bg-[#1F2023] border-[#444] shadow-[0_8px_30px_rgba(0,0,0,0.24)]',
            isRecording && 'border-red-500/70',
            className
          )}
          disabled={isLoading || isRecording}
          ref={ref}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* ── 첨부 파일 상단 상태 & 미리보기 갤러리 ── */}
          {files.length > 0 && !isRecording && (
            <div className="flex flex-col gap-1.5 pb-2 px-1 border-b border-white/5 mb-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-medium text-purple-300">
                  첨부된 참조 이미지 ({files.length}/{MAX_FILE_COUNT})
                </span>
                <span className="text-[11px] text-gray-500">
                  개당 최대 5MB · 클릭 시 원본 확대
                </span>
              </div>

              {/* 썸네일 리스트 */}
              <div className="flex flex-wrap gap-2 pt-1 max-h-[140px] overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="relative group flex-shrink-0">
                    {filePreviews[index] && (
                      <div
                        className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-purple-400 transition"
                        onClick={() => setSelectedImage(filePreviews[index])}
                        title={`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={filePreviews[index]}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                        {/* 개별 파일 삭제 버튼 */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="absolute top-1 right-1 rounded-full bg-black/80 hover:bg-red-600 p-1 text-white transition cursor-pointer shadow-md"
                          title="이미지 제거"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 용량/개수 제한 경고 메시지 토스트 ── */}
          {warningMessage && (
            <div className="mx-1 mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 animate-in fade-in-50">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* ── 텍스트 입력 영역 ── */}
          <div
            className={cn(
              'transition-all duration-300',
              isRecording ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'
            )}
          >
            <PromptInputTextarea
              placeholder={
                showSearch
                  ? 'Search the web...'
                  : showThink
                  ? 'Think deeply...'
                  : showCanvas
                  ? 'Create on canvas...'
                  : placeholder
              }
              className="text-base"
            />
          </div>

          {/* ── 음성 녹음 영역 ── */}
          {isRecording && (
            <VoiceRecorder
              isRecording={isRecording}
              onStartRecording={() => console.log('Recording started')}
              onStopRecording={(d) => {
                console.log(`Stopped: ${d}s`);
                setIsRecording(false);
                onSend(`[Voice - ${d}s]`, []);
              }}
            />
          )}

          {/* ── 하단 액션 바 ── */}
          <PromptInputActions className="flex items-center justify-between gap-2 p-0 pt-2">
            {/* 좌측: 파일업로드 + 토글 버튼들 */}
            <div
              className={cn(
                'flex items-center gap-1 transition-opacity duration-300',
                isRecording ? 'opacity-0 invisible h-0' : 'opacity-100 visible'
              )}
            >
              <PromptInputAction
                tooltip={
                  files.length >= MAX_FILE_COUNT
                    ? `최대 ${MAX_FILE_COUNT}개 도달`
                    : `이미지 첨부 (개당 5MB, 최대 10개)`
                }
              >
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className={cn(
                    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors',
                    files.length >= MAX_FILE_COUNT
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-[#9CA3AF] hover:bg-gray-600/30 hover:text-[#D1D5DB]'
                  )}
                  disabled={isRecording || files.length >= MAX_FILE_COUNT}
                >
                  <Paperclip className="h-5 w-5" />
                  {/* multiple 속성으로 한 번에 여러 개 선택 가능 */}
                  <input
                    ref={uploadInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processFiles(Array.from(e.target.files));
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />
                </button>
              </PromptInputAction>

              <div className="flex items-center">
                <ToggleButton
                  active={showSearch}
                  onClick={() => {
                    setShowSearch((p) => !p);
                    setShowThink(false);
                  }}
                  activeColor="#1EAEDB"
                  activeBg="rgba(30,174,219,0.15)"
                  activeBorder="#1EAEDB"
                  icon={<Globe className="w-4 h-4" />}
                  label="Search"
                />
                <CustomDivider />
                <ToggleButton
                  active={showThink}
                  onClick={() => {
                    setShowThink((p) => !p);
                    setShowSearch(false);
                  }}
                  activeColor="#8B5CF6"
                  activeBg="rgba(139,92,246,0.15)"
                  activeBorder="#8B5CF6"
                  icon={<BrainCog className="w-4 h-4" />}
                  label="Think"
                />
                <CustomDivider />
                <ToggleButton
                  active={showCanvas}
                  onClick={() => setShowCanvas((p) => !p)}
                  activeColor="#F97316"
                  activeBg="rgba(249,115,22,0.15)"
                  activeBorder="#F97316"
                  icon={<FolderCode className="w-4 h-4" />}
                  label="Canvas"
                />
              </div>
            </div>

            {/* 우측: 전송 / 음성 / 정지 버튼 */}
            <PromptInputAction
              tooltip={
                isLoading
                  ? '생성 중지'
                  : isRecording
                  ? '녹음 중지'
                  : hasContent
                  ? '전송'
                  : '음성 입력'
              }
            >
              <Button
                variant="default"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-full transition-all duration-200',
                  isRecording
                    ? 'bg-transparent hover:bg-gray-600/30 text-red-500'
                    : hasContent
                    ? 'bg-white hover:bg-white/80 text-[#1F2023]'
                    : 'bg-transparent hover:bg-gray-600/30 text-[#9CA3AF]'
                )}
                onClick={() => {
                  if (isRecording) setIsRecording(false);
                  else if (hasContent) handleSubmit();
                  else setIsRecording(true);
                }}
                disabled={isLoading && !hasContent}
              >
                {isLoading ? (
                  <Square className="h-4 w-4 fill-[#1F2023] animate-pulse" />
                ) : isRecording ? (
                  <StopCircle className="h-5 w-5 text-red-500" />
                ) : hasContent ? (
                  <ArrowUp className="h-4 w-4 text-[#1F2023]" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>

        {/* ── 이미지 원본 확대 팝업 ── */}
        <ImageViewDialog
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </>
    );
  }
);
PromptInputBox.displayName = 'PromptInputBox';
