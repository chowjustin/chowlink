import * as React from 'react';

import Accent from '@/components/Accent';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';

export default function Loading() {
  return (
    <Layout>
      <Seo />

      <main>
        <section className=''>
          <div className='layout flex h-full flex-col items-center justify-center'>
            <h1 className='text-5xl md:text-7xl'>
              <Accent>Loading</Accent>
            </h1>
            <p className='mt-4 text-gray-300'>
              Loading the page. Please wait...
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
