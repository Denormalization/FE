'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccessToken } from '@/lib/auth';
import { useBook } from '@/context/bookContext';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

/* ── 입력 폼 (한글 IME 보호용 별도 컴포넌트) ── */
function MetadataForm({
  onUpload,
  loading,
}: {
  onUpload: (meta: { isbn: string; title: string; author: string; description: string }) => void;
  loading: boolean;
}) {
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  const inputBase =
    'w-full px-4 py-2.5 bg-white/60 border border-stone-300 rounded-lg text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all';

  return (
    <div className="w-full space-y-3">
      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1 tracking-wide">ISBN *</label>
        <input type="text" placeholder="ex) 9788937460470" value={isbn} onChange={(e) => setIsbn(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1 tracking-wide">제목 *</label>
        <input type="text" placeholder="책 제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1 tracking-wide">저자</label>
        <input type="text" placeholder="저자명" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputBase} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1 tracking-wide">설명</label>
        <input type="text" placeholder="간단한 설명" value={description} onChange={(e) => setDescription(e.target.value)} className={inputBase} />
      </div>
      <p className="text-[11px] text-stone-400 italic">.txt 파일은 ISBN과 제목이 필수입니다.</p>
      <button
        onClick={() => onUpload({ isbn, title, author, description })}
        disabled={loading}
        className="w-full mt-1 px-6 py-2.5 bg-amber-600 text-white font-medium rounded-lg disabled:opacity-40 hover:bg-amber-700 active:scale-[0.98] transition-all text-sm shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            업로드 중...
          </span>
        ) : '📤 업로드'}
      </button>
    </div>
  );
}

/* ── 파일 드롭 영역 ── */
function FileDropZone({
  file,
  onFileSelect,
}: {
  file: File | null;
  onFileSelect: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0] ?? null;
        if (f && (f.name.endsWith('.epub') || f.name.endsWith('.txt'))) {
          onFileSelect(f);
        }
      }}
      className={`
        w-full rounded-xl border-2 border-dashed cursor-pointer
        flex flex-col items-center justify-center gap-2 py-8 px-4
        transition-all duration-200
        ${dragOver
          ? 'border-amber-400 bg-amber-50/50 scale-[1.01]'
          : file
            ? 'border-green-400/60 bg-green-50/30'
            : 'border-stone-300 bg-stone-50/40 hover:border-amber-300 hover:bg-amber-50/20'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".epub,.txt"
        onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      {file ? (
        <>
          <span className="text-2xl">📄</span>
          <p className="text-sm font-medium text-stone-700 text-center break-all">{file.name}</p>
          <p className="text-[11px] text-stone-400">{(file.size / 1024).toFixed(1)} KB · 클릭하여 변경</p>
        </>
      ) : (
        <>
          <span className="text-3xl opacity-40">📁</span>
          <p className="text-sm text-stone-500">파일을 드래그하거나 클릭하여 선택</p>
          <p className="text-[11px] text-stone-400">.epub 또는 .txt</p>
        </>
      )}
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function AdminUploadPage() {
  const { setBookContent, updateBookContent } = useBook();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [resultOk, setResultOk] = useState(false);
  const isFirstRender = useRef(true);
  const fileRef = useRef<File | null>(null);

  const isTxt = file?.name.endsWith('.txt') ?? false;

  const handleFileSelect = useCallback((f: File | null) => {
    fileRef.current = f;
    setFile(f);
  }, []);

  const handleUpload = useCallback(async (meta: { isbn: string; title: string; author: string; description: string }) => {
    const selectedFile = fileRef.current;
    if (!selectedFile) return alert('파일을 선택해주세요');

    const token = getAccessToken();
    if (!token) return alert('로그인이 필요합니다');

    if (selectedFile.name.endsWith('.txt') && (!meta.title || !meta.isbn)) {
      return alert('.txt 파일은 ISBN과 제목이 필수입니다');
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (meta.isbn || meta.title || meta.author || meta.description) {
      const metadata: Record<string, unknown> = {};
      if (meta.isbn) metadata.isbn = Number(meta.isbn);
      if (meta.title) metadata.title = meta.title;
      if (meta.author) metadata.authors = [meta.author];
      if (meta.description) metadata.description = meta.description;
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    }

    setLoading(true);
    setResult('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/books`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      setResultOk(res.ok);
      if (res.ok) {
        setResult(`✅ 업로드 성공 (${res.status})\n\n${text}`);
      } else {
        setResult(`❌ 실패 (${res.status})\n\n${text}`);
      }
    } catch (err) {
      setResultOk(false);
      setResult(`⚠️ 에러\n\n${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const left = (
      <div className="flex flex-col h-full p-8 pointer-events-auto overflow-y-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-amber-600 tracking-widest uppercase mb-1">Admin</p>
          <h1 className="text-xl font-bold text-stone-800 tracking-tight">책 업로드</h1>
          <p className="text-xs text-stone-400 mt-1">EPUB 또는 TXT 파일을 업로드하세요</p>
        </div>

        {/* 구분선 */}
        <div className="w-12 h-0.5 bg-amber-400/60 rounded-full mb-6" />

        {/* 파일 선택 */}
        <FileDropZone file={file} onFileSelect={handleFileSelect} />

        {/* 메타데이터 폼 or 업로드 버튼 */}
        <div className="mt-5">
          {isTxt ? (
            <MetadataForm onUpload={handleUpload} loading={loading} />
          ) : (
            <button
              onClick={() => handleUpload({ title: '', author: '', description: '', isbn: '' })}
              disabled={loading || !file}
              className="w-full px-6 py-2.5 bg-amber-600 text-white font-medium rounded-lg disabled:opacity-30 hover:bg-amber-700 active:scale-[0.98] transition-all text-sm shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  업로드 중...
                </span>
              ) : '📤 업로드'}
            </button>
          )}
        </div>
      </div>
    );

    const right = (
      <div className="flex flex-col h-full p-8 pointer-events-auto overflow-y-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase mb-1">Result</p>
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">업로드 결과</h2>
        </div>

        {/* 구분선 */}
        <div className="w-12 h-0.5 bg-stone-300/60 rounded-full mb-6" />

        {/* 결과 영역 */}
        <div className="flex-1 flex flex-col">
          {result ? (
            <div className={`
              flex-1 rounded-xl border p-5
              ${resultOk
                ? 'bg-green-50/50 border-green-200'
                : 'bg-red-50/50 border-red-200'
              }
            `}>
              <pre className="text-xs text-stone-700 whitespace-pre-wrap break-all leading-relaxed font-mono">
                {result}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-4xl opacity-20 mb-3">📋</span>
              <p className="text-sm text-stone-400">아직 결과가 없습니다</p>
              <p className="text-[11px] text-stone-300 mt-1">파일을 업로드하면 여기에 결과가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    );

    if (isFirstRender.current) {
      setBookContent(left, right);
      isFirstRender.current = false;
    } else {
      updateBookContent(left, right);
    }
  }, [file, loading, result, resultOk, isTxt, handleUpload, handleFileSelect, setBookContent, updateBookContent]);

  return null;
}
