'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { NavigationRail } from '../../components/NavigationRail';
import { UploadModal } from '../../components/UploadModal';

export default function UploadPage() {
  const router = useRouter();

  return (
    <div className="flex w-full min-h-screen bg-slate-100">
      <NavigationRail />
      <div className="flex-1 flex items-center justify-center p-8">
        <UploadModal
          isOpen={true}
          onClose={() => router.push('/')}
          onSuccess={(poNum) => {
            router.push(`/?po=${encodeURIComponent(poNum)}`);
          }}
        />
      </div>
    </div>
  );
}
