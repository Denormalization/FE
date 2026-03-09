'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccessToken } from '@/lib/auth';
import { useBook } from '@/context/bookContext';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

function MetadataForm({ onUpload, loading }: { onUpload: (meta: { isbn: string; title: string; author: string; description: string }) => void; loading: boolean }) {
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="w-full space-y-2 mb-4">
      <input type="text" placeholder="ISBN (필수)" value={isbn} onChange={(e) => setIsbn(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
      <input type="text" placeholder="제목 (필수)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
      <input type="text" placeholder="저자" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
      <input type="text" placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
      <p className="text-xs text-gray-400">.txt 파일은 metadata가 필수입니다.</p>
      <button
        onClick={() => onUpload({ isbn, title, author, description })}
        disabled={loading}
        className="w-full mt-2 px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-40 hover:bg-blue-700 transition-colors text-sm"
      >
        {loading ? '업로드 중...' : '업로드'}
      </button>
    </div>
  );
}

export default function AdminUploadPage() {
  const { setBookContent, updateBookContent } = useBook();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const isFirstRender = useRef(true);
  const fileRef = useRef<File | null>(null);

  const isTxt = file?.name.endsWith('.txt') ?? false;

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
      if (res.ok) {
        setResult(`업로드 성공 (${res.status})\n${text}`);
      } else {
        setResult(`실패 (${res.status})\n${text}`);
      }
    } catch (err) {
      setResult(`에러: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const left = (
      <div className="flex flex-col items-center justify-center h-full p-10 pointer-events-auto">
        <h1 className="text-2xl font-bold mb-6">책 업로드 (Admin)</h1>
        <input
          type="file"
          accept=".epub,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            fileRef.current = f;
            setFile(f);
          }}
          className="mb-4 text-sm"
        />
        {isTxt && (
          <MetadataForm onUpload={handleUpload} loading={loading} />
        )}
        {!isTxt && (
          <button
            onClick={() => handleUpload({
              title: '', author: '', description: '',
              isbn: ''
            })}
            disabled={loading || !file}
            className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-40 hover:bg-blue-700 transition-colors text-sm"
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
        )}
      </div>
    );

    const right = (
      <div className="flex flex-col items-center justify-center h-full p-10 pointer-events-auto">
        <h2 className="text-lg font-semibold mb-4">업로드 결과</h2>
        {result ? (
          <pre className="w-full p-4 bg-gray-100 rounded-lg text-xs whitespace-pre-wrap break-all max-h-[36rem] overflow-y-auto">
            {result}
          </pre>
        ) : (
          <p className="text-gray-400 text-sm">아직 결과가 없습니다.</p>
        )}
      </div>
    );

    if (isFirstRender.current) {
      setBookContent(left, right);
      isFirstRender.current = false;
    } else {
      updateBookContent(left, right);
    }
  }, [file, loading, result, isTxt, handleUpload, setBookContent, updateBookContent]);

  return null;
}
